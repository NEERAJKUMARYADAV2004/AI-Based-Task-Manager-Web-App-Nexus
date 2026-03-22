const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Ensure this points to your User model
const auth = require('../middleware/auth'); // Ensure this points to your JWT middleware

// @route   GET /api/auth/user
// @desc    Get logged-in user profile data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    // Find user by the ID inside the JWT token, exclude the password
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile data
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const { name, bio, role, phone, address } = req.body;

  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Update the fields if they are provided in the request
    // Using !== undefined allows users to clear out fields by sending empty strings
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (role !== undefined) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;