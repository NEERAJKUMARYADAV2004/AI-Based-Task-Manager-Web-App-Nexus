const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Note = require('../models/Note');

// GET notes
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) { res.status(500).send('Server Error'); }
});

// CREATE note
router.post('/', auth, async (req, res) => {
  try {
    const newNote = new Note({ ...req.body, user: req.user.id });
    const note = await newNote.save();
    res.json(note);
  } catch (err) { res.status(500).send('Server Error'); }
});

// UPDATE note
router.put('/:id', auth, async (req, res) => {
  const { title, content } = req.body;
  try {
    let note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ msg: 'Note not found' });
    if (note.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    note = await Note.findByIdAndUpdate(req.params.id, { $set: { title, content, updatedAt: Date.now() } }, { new: true });
    res.json(note);
  } catch (err) { res.status(500).send('Server Error'); }
});

// DELETE note
router.delete('/:id', auth, async (req, res) => {
  try {
    let note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ msg: 'Note not found' });
    if (note.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    await Note.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Note removed' });
  } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;
