const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Team = require('../models/Team');
const User = require('../models/User');
const Task = require('../models/Task');

// GET all teams the user belongs to
router.get('/', auth, async (req, res) => {
  try {
    const teams = await Team.find({ members: req.user.id }).populate('members', 'name avatar');
    res.json(teams);
  } catch (err) { res.status(500).send('Server Error'); }
});

// CREATE Team
router.post('/', auth, async (req, res) => {
  try {
    const newTeam = new Team({
      name: req.body.name,
      admin: req.user.id,
      members: [req.user.id] // Admin is first member
    });
    const team = await newTeam.save();
    res.json(team);
  } catch (err) { res.status(500).send('Server Error'); }
});

// GET Shared Tasks for a specific Team
router.get('/:teamId/tasks', auth, async (req, res) => {
  try {
    // Check if user is member of team
    const team = await Team.findById(req.params.teamId);
    if (!team.members.includes(req.user.id)) return res.status(401).json({msg:'Not a member'});

    const tasks = await Task.find({ teamId: req.params.teamId });
    res.json(tasks);
  } catch (err) { res.status(500).send('Server Error'); }
});

// ADD Shared Task
router.post('/:teamId/tasks', auth, async (req, res) => {
  try {
    const newTask = new Task({
      ...req.body,
      teamId: req.params.teamId,
      user: req.user.id // Creator
    });
    const task = await newTask.save();
    res.json(task);
  } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;
