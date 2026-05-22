const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Problem = require('../models/Problem');
const fetch = require('node-fetch');

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://127.0.0.1:2358';

const LANG_MAP = {
  cpp: 2,
  java: 4,
  python: 10
};


  async function judge0Run(code, languageId, stdin) {
  const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_code: code || '',
      language_id: languageId,
      stdin: stdin || ''
    })
  });

  const data = await res.json();

  console.log("Judge0 result:", data);

  return {
    stdout: (data.stdout || '').trim(),
    stderr: (data.stderr || '').trim(),
    compile_output: (data.compile_output || '').trim(),
    status: data.status?.description || 'Unknown',
    statusId: data.status?.id
  };
}

  const submitData = await submitRes.json();
  if (!submitData.token) {
    throw new Error(`No token: ${JSON.stringify(submitData)}`);
  }

  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 1000));

    const pollRes = await fetch(`${JUDGE0_URL}/submissions/${submitData.token}?base64_encoded=true`);
    const data = await pollRes.json();

    if (data.status && data.status.id <= 2) continue;

    const decode = (value) =>
      value ? Buffer.from(value, 'base64').toString('utf8').trim() : '';

    return {
      stdout: decode(data.stdout),
      stderr: decode(data.stderr),
      compile_output: decode(data.compile_output),
      status: data.status?.description || 'Unknown',
      statusId: data.status?.id
    };
  }

  throw new Error('Judge0 timeout');
}

// Run code
router.post('/run', async (req, res) => {
  try {
    const { slug, code, language } = req.body;

    const problem = await Problem.findOne({ slug });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const languageId = LANG_MAP[language];
    if (!languageId) return res.status(400).json({ error: 'Unsupported language' });

    const results = [];

    for (const tc of problem.testCases) {
      try {
        const result = await judge0Run(code, languageId, tc.input);

        const expected = (tc.output || '').trim();
        const stdout = result.stdout || '';
        const error = result.stderr || result.compile_output || '';

        results.push({
          input: tc.input,
          expected,
          actual: error ? `Error: ${error}` : stdout,
          passed: !error && stdout === expected,
          status: error ? 'Error' : stdout === expected ? 'Accepted' : 'Wrong Answer'
        });
      } catch (e) {
        results.push({
          input: tc.input,
          expected: (tc.output || '').trim(),
          actual: `Error: ${e.message}`,
          passed: false,
          status: 'Error'
        });
      }
    }

    res.json({
      results,
      allPassed: results.every(r => r.passed)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get all problems
router.get('/all', async (req, res) => {
  try {
    const problems = await Problem.find({}, '-testCases');
    res.json(problems);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get multiplayer problems
router.get('/multiplayer', async (req, res) => {
  try {
    const problems = await Problem.find({}, '-testCases');
    res.json(problems);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get by topic
router.get('/topic/:topic', async (req, res) => {
  try {
    const problems = await Problem.find({ topic: req.params.topic }, '-testCases');
    res.json(problems);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add problem
router.post('/add', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.isAdmin) return res.status(403).json({ error: 'Admin only' });

    const { title } = req.body;
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await Problem.findOne({ slug });
    if (existing) return res.status(400).json({ error: 'Problem already exists' });

    const problem = new Problem({ ...req.body, slug });
    await problem.save();

    res.json({ success: true, problem });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update problem
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.isAdmin) return res.status(403).json({ error: 'Admin only' });

    const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, problem });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete problem
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.isAdmin) return res.status(403).json({ error: 'Admin only' });

    await Problem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get by slug - keep this near the end
router.get('/:slug', async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug }, '-testCases');
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    res.json(problem);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
