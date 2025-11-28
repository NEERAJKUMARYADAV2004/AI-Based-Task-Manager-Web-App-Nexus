const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');

// GET all projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) { res.status(500).send('Server Error'); }
});

// CREATE project
router.post('/', auth, async (req, res) => {
  try {
    const newProject = new Project({ ...req.body, user: req.user.id });
    const project = await newProject.save();
    res.json(project);
  } catch (err) { res.status(500).send('Server Error'); }
});

// UPDATE project
router.put('/:id', auth, async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    if (project.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    project = await Project.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(project);
  } catch (err) { res.status(500).send('Server Error'); }
});

// DELETE project
router.delete('/:id', auth, async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    if (project.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    await Project.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Project removed' });
  } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;
