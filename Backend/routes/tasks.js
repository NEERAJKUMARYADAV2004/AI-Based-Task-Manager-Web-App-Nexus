const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// @route   GET api/tasks
// @desc    Get all tasks for the logged in user
router.get('/', auth, async (req, res) => {
  try {
    // Sort by date descending
    const tasks = await Task.find({ user: req.user.id }).sort({ date: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST api/tasks
// @desc    Add new task
router.post('/', auth, async (req, res) => {
  const { taskName, description, dueDate, priority, workplace } = req.body;
  try {
    const newTask = new Task({
      taskName,
      description,
      dueDate,
      priority,
      workplace,
      user: req.user.id
    });
    const task = await newTask.save();
    
    // Guarantee that only successful database actions trigger a notification
    if (req.body.teamId && req.io) {
      req.io.to(req.body.teamId).emit('receive_update', {
        type: 'NEW_TASK',
        payload: task,
        actionMessage: `created a new task.`
      });
    }
    
    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/tasks/:id
// @desc    Update task (edit or complete)
router.put('/:id', auth, async (req, res) => {
  const { taskName, description, dueDate, priority, workplace, completed, assignedTo, status, comments } = req.body;

  // Build object
  const taskFields = {};
  if (taskName !== undefined) taskFields.taskName = taskName;
  if (description !== undefined) taskFields.description = description;
  if (dueDate !== undefined) taskFields.dueDate = dueDate;
  if (priority !== undefined) taskFields.priority = priority;
  if (workplace !== undefined) taskFields.workplace = workplace;
  if (completed !== undefined) taskFields.completed = completed;
  if (assignedTo !== undefined) taskFields.assignedTo = assignedTo;
  if (status !== undefined) taskFields.status = status;
  if (comments !== undefined) taskFields.comments = comments;

  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    // Make sure user owns task OR is a member of the team
    let isAuthorized = task.user.toString() === req.user.id;
    if (!isAuthorized && task.teamId) {
      const Team = require('../models/Team');
      const team = await Team.findById(task.teamId);
      if (team) {
        const isMember = team.members.some(m => m._id && m._id.toString() === req.user.id && m.status !== 'Pending' && m.status !== 'Rejected');
        if (isMember || team.admin.toString() === req.user.id) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    task = await Task.findByIdAndUpdate(req.params.id, { $set: taskFields }, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/tasks/:id
// @desc    Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    let isAuthorized = task.user.toString() === req.user.id;
    if (!isAuthorized && task.teamId) {
      const Team = require('../models/Team');
      const team = await Team.findById(task.teamId);
      if (team) {
        if (team.admin.toString() === req.user.id) {
          isAuthorized = true; // Admin can delete any shared task
        }
      }
    }

    if (!isAuthorized) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Task removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
