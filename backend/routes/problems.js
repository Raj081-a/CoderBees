const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Problem = require('../models/Problem');
const fetch = require('node-fetch');

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://127.0.0.1:2358';
const LANG_MAP = {
  cpp: 54,
  java: 62,
  python: 71
};

// Judge0 submit + poll
async function judge0Run(code, languageId, stdin) {
  // Submit
  const submitRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_code: Buffer.from(code).toString('base64'),
      language_id: languageId,
      stdin: Buffer.from(stdin || '').toString('base64')
    })
  });

  const text = await submitRes.text();
  console.log("Judge0 raw response:", text);
  let submitData;
  try {
    submitData = JSON.parse(text);
  } catch(e) {
    throw new Error(`Judge0 submit failed: ${text}`);
  }

  const token = submitData.token;
  if (!token) throw new Error(`No token: ${JSON.stringify(submitData)}`);

  // Poll until done
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 1500));

    const pollRes = await fetch(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=true`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    const pollText = await pollRes.text();
    let data;
    try {
      data = JSON.parse(pollText);
    } catch(e) {
      continue;
    }

    // 1=queued, 2=processing — keep waiting
    if (data.status && data.status.id <= 2) continue;

    // Decode outputs
    const stdout = data.stdout
      ? Buffer.from(data.stdout, 'base64').toString('utf8')
      : '';
    const stderr = data.stderr
      ? Buffer.from(data.stderr, 'base64').toString('utf8')
      : '';
    const compile_output = data.compile_output
      ? Buffer.from(data.compile_output, 'base64').toString('utf8')
      : '';

    return {
      stdout: stdout.trim(),
      stderr: (stderr || compile_output || '').trim(),
      status: data.status?.description || 'Unknown',
      statusId: data.status?.id
    };
  }

  throw new Error('Judge0 timeout');
}

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

// Get by slug
router.get('/:slug', async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug }, '-testCases');
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    res.json(problem);
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

// RUN CODE
// router.post('/run',  async (req, res) => {
//   try {
//     const { slug, code, language } = req.body;
//     const problem = await Problem.findOne({ slug });
//     if (!problem) return res.status(404).json({ error: 'Problem not found' });

//     const languageId = LANG_MAP[language] || 71;
//     const results = [];

//     for (const tc of problem.testCases) {
//       try {
//         const result = await judge0Run(code, languageId, tc.input);
//         const expected = (tc.output || '').trim();
//         const actual = result.stdout;
//         const hasError = result.stderr && result.stderr.length > 0;

//         results.push({
//           input: tc.input,
//           expected,
//           actual: hasError ? `Error: ${result.stderr.substring(0, 300)}` : actual,
//           passed: !hasError && actual === expected,
//           status: result.status
//         });
//       } catch (e) {
//         results.push({
//           input: tc.input,
//           expected: tc.output,
//           actual: `Error: ${e.message}`,
//           passed: false,
//           status: 'Error'
//         });
//       }
//     }

//     res.json({
//       results,
//       allPassed: results.every(r => r.passed)
//     });

//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

router.post('/run', async (req, res) => {
  try {
    const { slug, code, language } = req.body;

    const problem = await Problem.findOne({ slug });
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const languageId = LANG_MAP[language];
    if (!languageId) {
      return res.status(400).json({ error: 'Unsupported language' });
    }

    const results = [];

    for (const tc of problem.testCases) {
      try {
        const result = await judge0Run(code, languageId, tc.input);

        const expected = (tc.output || '').trim();
        const actual = result.stdout || '';
        const error = result.stderr || '';

        results.push({
          input: tc.input,
          expected,
          actual: error ? `Error: ${error}` : actual,
          passed: !error && actual === expected,
          status: error ? 'Error' : actual === expected ? 'Accepted' : 'Wrong Answer'
        });
      } catch (e) {
        results.push({
          input: tc.input,
          expected: tc.output,
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

module.exports = router;