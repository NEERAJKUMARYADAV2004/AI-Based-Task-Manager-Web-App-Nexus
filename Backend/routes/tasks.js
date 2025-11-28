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
    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/tasks/:id
// @desc    Update task (edit or complete)
router.put('/:id', auth, async (req, res) => {
  const { taskName, description, dueDate, priority, workplace, completed } = req.body;

  // Build object
  const taskFields = {};
  if (taskName) taskFields.taskName = taskName;
  if (description) taskFields.description = description;
  if (dueDate) taskFields.dueDate = dueDate;
  if (priority) taskFields.priority = priority;
  if (workplace) taskFields.workplace = workplace;
  if (completed !== undefined) taskFields.completed = completed;

  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    // Make sure user owns task
    if (task.user.toString() !== req.user.id) {
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

    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Task removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
