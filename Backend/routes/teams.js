const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Team = require('../models/Team');
const User = require('../models/User');
const Task = require('../models/Task');

const mongoose = require('mongoose');

// GET all teams the user belongs to
router.get('/', auth, async (req, res) => {
  try {
    const userIdObj = new mongoose.Types.ObjectId(req.user.id);
    const teams = await Team.find({
      $or: [
        { admin: req.user.id },
        { members: { $elemMatch: { _id: userIdObj, status: { $nin: ['Pending', 'Rejected'] } } } },
        { members: { $elemMatch: { _id: req.user.id, status: { $nin: ['Pending', 'Rejected'] } } } } // Fallback just in case it was saved as string
      ]
    });
    res.json(teams);
  } catch (err) { 
    console.error("GET /teams error:", err);
    res.status(500).send('Server Error'); 
  }
});

// CREATE Team
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const initialMembers = [{
      _id: req.user.id,
      name: user ? user.name : 'Owner',
      email: user ? user.email : '',
      avatar: user ? user.avatar : '',
      role: 'Owner'
    }];
    
    const newInvites = [];
    if (req.body.members && req.body.members.length > 0) {
      for (const m of req.body.members) {
        if (m._id && typeof m._id === 'string' && m._id.startsWith('temp-')) {
          const fetchedUser = await User.findOne({ email: m.email });
          if (fetchedUser) {
            const newMemberObj = {
              _id: fetchedUser._id,
              name: fetchedUser.name,
              email: fetchedUser.email,
              avatar: fetchedUser.avatar,
              role: m.role || 'Viewer',
              status: 'Pending'
            };
            initialMembers.push(newMemberObj);
            newInvites.push(newMemberObj);
          }
        }
      }
    }

    const newTeam = new Team({
      name: req.body.name,
      description: req.body.description || '',
      admin: req.user.id,
      members: initialMembers,
      activityLog: newInvites.map(inv => ({ message: `Invited ${inv.name} (${inv.email}) to the team.` }))
    });
    
    const team = await newTeam.save();

    if (req.io && newInvites.length > 0) {
      const invitor = await User.findById(req.user.id);
      for (const inv of newInvites) {
        req.io.to(inv._id.toString()).emit('new_notification', {
          id: `invite-${Date.now()}-${Math.random()}`,
          type: 'TEAM_INVITE',
          title: `Team Invitation`,
          desc: `${invitor.name} invited you to join ${team.name}.`,
          teamId: team._id
        });
      }
    }

    res.json(team);
  } catch (err) { res.status(500).send('Server Error'); }
});

// GET Shared Tasks for a specific Team
router.get('/:teamId/tasks', auth, async (req, res) => {
  try {
    // Check if user is member of team
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({msg: 'Team not found'});
    
    const isMember = team.members.some(m => m._id && m._id.toString() === req.user.id && m.status !== 'Pending' && m.status !== 'Rejected');
    if (!isMember && team.admin.toString() !== req.user.id) return res.status(401).json({msg:'Not a member'});

    const tasks = await Task.find({ teamId: req.params.teamId });
    res.json(tasks);
  } catch (err) { res.status(500).send('Server Error'); }
});

// ADD Shared Task
router.post('/:teamId/tasks', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({msg: 'Team not found'});
    
    const isMember = team.members.some(m => m._id && m._id.toString() === req.user.id && m.status !== 'Pending' && m.status !== 'Rejected');
    if (!isMember && team.admin.toString() !== req.user.id) return res.status(401).json({msg:'Not authorized to add task'});

    const newTask = new Task({
      ...req.body,
      teamId: req.params.teamId,
      user: req.user.id // Creator
    });
    const task = await newTask.save();
    res.json(task);
  } catch (err) { res.status(500).send('Server Error'); }
});

// UPDATE Team
router.put('/:teamId', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ msg: 'Team not found' });

    // Ensure user is admin
    if (team.admin.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update team' });
    }

    if (req.body.name) team.name = req.body.name;
    if (req.body.description !== undefined) team.description = req.body.description;
    
    if (req.body.members) {
      const updatedMembers = [];
      const newInvites = [];
      for (const m of req.body.members) {
        if (m._id && typeof m._id === 'string' && m._id.startsWith('temp-')) {
          const user = await User.findOne({ email: m.email });
          if (!user) return res.status(400).json({ msg: `User with email ${m.email} not found.` });
          
          const exists = team.members.find(existing => existing._id.toString() === user._id.toString());
          if (exists) {
            if (exists.status === 'Rejected' || exists.status === 'Pending') {
              exists.status = 'Pending';
              exists.role = m.role || exists.role;
              updatedMembers.push(exists);
              newInvites.push(exists);
              team.activityLog.push({ message: `Re-invited ${user.name} (${user.email}) to the team.` });
            } else {
              updatedMembers.push(exists);
            }
          } else {
            const newMemberObj = {
              _id: user._id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              role: m.role || 'Viewer',
              status: 'Pending'
            };
            updatedMembers.push(newMemberObj);
            newInvites.push(newMemberObj);
            team.activityLog.push({ message: `Invited ${user.name} (${user.email}) to the team.` });
          }
        } else {
          updatedMembers.push(m);
        }
      }
      
      // Deduplicate members by _id (keep the last occurring one, which will be the newly modified one)
      const uniqueMembersMap = new Map();
      for (const m of updatedMembers) {
        if (m._id) uniqueMembersMap.set(m._id.toString(), m);
      }
      team.members = Array.from(uniqueMembersMap.values());

      if (req.io && newInvites.length > 0) {
        const invitor = await User.findById(req.user.id);
        for (const inv of newInvites) {
          req.io.to(inv._id.toString()).emit('new_notification', {
            id: `invite-${Date.now()}-${Math.random()}`,
            title: 'Team Invitation',
            desc: `${invitor.name} invited you to join the team "${team.name}".`,
            type: 'TEAM_INVITE',
            teamId: team._id,
            serverTimestamp: new Date().toISOString()
          });
        }
      }
    }

    await team.save();
    res.json(team);
  } catch (err) { 
    console.error(err.message);
    res.status(500).send('Server Error'); 
  }
});

// POST Invite Response
router.post('/:teamId/invite-response', auth, async (req, res) => {
  try {
    const { accept } = req.body;
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ msg: 'Team not found' });

    const memberIndex = team.members.findIndex(m => m._id && m._id.toString() === req.user.id);
    if (memberIndex === -1) return res.status(404).json({ msg: 'You are not invited to this team.' });

    const user = await User.findById(req.user.id);
    
    if (accept) {
      team.members[memberIndex].status = 'Accepted';
      team.activityLog.push({ message: `${user.name} accepted the team invitation.` });
    } else {
      team.members[memberIndex].status = 'Rejected';
      team.activityLog.push({ message: `${user.name} rejected the team invitation.` });
    }

    await team.save();

    if (req.io) {
      req.io.to(team.admin.toString()).emit('new_notification', {
        id: `response-${Date.now()}-${Math.random()}`,
        title: 'Invitation Response',
        desc: `${user.name} ${accept ? 'accepted' : 'rejected'} your invitation to "${team.name}".`,
        type: 'INVITE_RESPONSE',
        teamId: team._id,
        serverTimestamp: new Date().toISOString()
      });
    }

    res.json(team);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE Team
router.delete('/:teamId', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ msg: 'Team not found' });
    
    // Check if user is admin
    if (team.admin.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to delete team' });
    }

    await team.deleteOne();
    // Also delete all tasks associated with this team
    await Task.deleteMany({ teamId: req.params.teamId });
    
    res.json({ msg: 'Team removed' });
  } catch (err) { 
    console.error(err.message);
    res.status(500).send('Server Error'); 
  }
});

module.exports = router;
