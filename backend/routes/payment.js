const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User');

const packages = [
  { id: 'starter', name: '🥉 Starter', coins: 100, price: 29 },
  { id: 'pro', name: '🥈 Pro', coins: 300, price: 79 },
  { id: 'elite', name: '🥇 Elite', coins: 700, price: 169 },
  { id: 'legend', name: '👑 Legend', coins: 1500, price: 299 }
];

router.get('/packages', (req, res) => res.json(packages));

router.post('/create-order', auth, async (req, res) => {
  try {
    const { packageId } = req.body;
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return res.status(400).json({ error: 'Invalid package' });
    res.json({ orderId: 'demo_' + Date.now(), amount: pkg.price * 100, currency: 'INR', demo: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/verify', auth, async (req, res) => {
  try {
    const { packageId } = req.body;
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return res.status(400).json({ error: 'Invalid package' });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { points: pkg.coins } },
      { new: true }
    );
    res.json({ success: true, newPoints: user.points, coinsAdded: pkg.coins });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;