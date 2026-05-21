const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find({}, 'username points wins losses gamesPlayed')
      .sort({ points: -1 })
      .limit(50);
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin - update user points
router.put('/admin/points/:id', auth, async (req, res) => {
  try {
    const reqUser = await User.findById(req.user.id);
    if (!reqUser.isAdmin) return res.status(403).json({ error: 'Admin only' });
    const { points } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { points }, { new: true });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin - get all users
router.get('/admin/all', auth, async (req, res) => {
  try {
    const reqUser = await User.findById(req.user.id);
    if (!reqUser.isAdmin) return res.status(403).json({ error: 'Admin only' });
    const users = await User.find({}, '-password').sort({ points: -1 });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;