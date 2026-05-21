const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const QuizQuestion = require('../models/QuizQuestion');

// Get all quiz questions
router.get('/questions', async (req, res) => {
  try {
    const questions = await QuizQuestion.find({});
    res.json(questions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get random questions for match/quiz
router.get('/random/:count', async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 10;
    const questions = await QuizQuestion.aggregate([{ $sample: { size: count } }]);
    res.json(questions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add question - admin only
router.post('/add', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.isAdmin) return res.status(403).json({ error: 'Admin only' });

    const question = new QuizQuestion(req.body);
    await question.save();
    res.json({ success: true, question });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update question - admin only
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.isAdmin) return res.status(403).json({ error: 'Admin only' });

    const question = await QuizQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, question });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete question - admin only
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.isAdmin) return res.status(403).json({ error: 'Admin only' });

    await QuizQuestion.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;