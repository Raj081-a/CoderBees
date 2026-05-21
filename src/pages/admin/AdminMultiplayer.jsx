import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'https://coderbees-backend.onrender.com/api';
const TOPICS = ['arrays','linkedlist','stack','queue','trees','graph','sorting'];
const DIFFS = ['Easy','Medium','Hard'];

const emptyEx = () => ({ input: '', output: '', explanation: '' });
const emptyTc = () => ({ input: '', output: '', explanation: '' });
const emptyForm = () => ({
  title: '', topic: 'arrays', difficulty: 'Easy',
  description: '', constraints: '', hints: '',
  examples: [emptyEx()], testCases: [emptyTc()],
  starterCode: { cpp: '', java: '', python: '' }
});

export default function AdminMultiplayer() {
  const { token } = useAuth();
  const [problems, setProblems] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [filterTopic, setFilterTopic] = useState('all');

  useEffect(() => { fetchProblems(); }, []);

  const fetchProblems = async () => {
    try {
      const res = await fetch(`${API}/problems/all`);
      const data = await res.json();
      setProblems(Array.isArray(data) ? data : []);
    } catch {}
  };

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const setEx = (i, field, val) => {
    const ex = [...form.examples];
    ex[i] = { ...ex[i], [field]: val };
    setForm(f => ({ ...f, examples: ex }));
  };
  const setTc = (i, field, val) => {
    const tc = [...form.testCases];
    tc[i] = { ...tc[i], [field]: val };
    setForm(f => ({ ...f, testCases: tc }));
  };
  const setCode = (lang, val) =>
    setForm(f => ({ ...f, starterCode: { ...f.starterCode, [lang]: val } }));

  const handleSave = async () => {
    if (!form.title || !form.description) {
      setMsg('❌ Title and description required');
      return;
    }
    if (form.testCases.filter(tc => tc.input && tc.output).length === 0) {
      setMsg('❌ At least one test case with input and output required');
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      const payload = {
        ...form,
        constraints: form.constraints.split('\n').map(s => s.trim()).filter(Boolean),
        hints: form.hints.split('\n').map(s => s.trim()).filter(Boolean),
        testCases: form.testCases.filter(tc => tc.input && tc.output)
      };
      const url = editId ? `${API}/problems/${editId}` : `${API}/problems/add`;
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setMsg(editId ? '✅ Problem updated!' : '✅ Problem added to Multiplayer!');
        setForm(emptyForm());
        setEditId(null);
        setView('list');
        fetchProblems();
      } else {
        setMsg(`❌ ${data.error}`);
      }
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
    setSaving(false);
  };

  const handleEdit = (problem) => {
    setForm({
      title: problem.title,
      topic: problem.topic,
      difficulty: problem.difficulty,
      description: problem.description,
      constraints: (problem.constraints || []).join('\n'),
      hints: (problem.hints || []).join('\n'),
      examples: problem.examples?.length ? problem.examples : [emptyEx()],
      testCases: problem.testCases?.length ? problem.testCases : [emptyTc()],
      starterCode: problem.starterCode || { cpp: '', java: '', python: '' }
    });
    setEditId(problem._id);
    setView('form');
    setMsg('');
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this problem from Multiplayer?')) return;
    try {
      await fetch(`${API}/problems/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProblems();
      setMsg('✅ Problem deleted!');
    } catch {}
  };

  const cancelEdit = () => {
    setForm(emptyForm());
    setEditId(null);
    setView('list');
    setMsg('');
  };

  const filtered = problems.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchTopic = filterTopic === 'all' || p.topic === filterTopic;
    return matchSearch && matchTopic;
  });

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>⚔️ Multiplayer Problems</h1>
          <p>Problems used in Multiplayer matches — random one given to both players</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className={`btn-${view === 'list' ? 'primary' : 'outline'}`}
            onClick={() => { setView('list'); cancelEdit(); }}
          >
            📋 All Problems ({problems.length})
          </button>
          <button
            className={`btn-${view === 'form' ? 'primary' : 'outline'}`}
            onClick={() => {
              setView('form');
              setEditId(null);
              setForm(emptyForm());
              setMsg('');
            }}
          >
            ➕ Add Problem
          </button>
        </div>
      </div>

      {msg && (
        <div className={`admin-msg ${msg.startsWith('✅') ? 'msg-ok' : 'msg-fail'}`}>
          {msg}
        </div>
      )}

      {/* PROBLEM LIST */}
      {view === 'list' && (
        <div>
          {/* Info Box */}
          <div className="multiplayer-info-box">
            <span>🎲 Random problem selected for each match</span>
            <span>👥 Both players get same problem</span>
            <span>🔒 Test cases hidden from players</span>
            <span>⏱ 30 minute timer</span>
          </div>

          {/* Filters */}
          <div className="admin-filters">
            <input
              className="form-input"
              style={{ maxWidth: '280px' }}
              placeholder="🔍 Search problems..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="form-select"
              style={{ maxWidth: '160px' }}
              value={filterTopic}
              onChange={e => setFilterTopic(e.target.value)}
            >
              <option value="all">All Topics</option>
              {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>No problems found.</p>
              <button className="btn-primary" style={{ marginTop: '16px' }}
                onClick={() => setView('form')}>
                + Add First Problem
              </button>
            </div>
          ) : (
            <div className="admin-list">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Topic</th>
                    <th>Difficulty</th>
                    <th>Test Cases</th>
                    <th>Languages</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p._id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td className="admin-problem-title">{p.title}</td>
                      <td><span className="topic-tag">{p.topic}</span></td>
                      <td>
                        <span className={`difficulty-badge diff-${p.difficulty?.toLowerCase()}`}>
                          {p.difficulty}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          color: (p.testCases?.length || 0) > 0 ? 'var(--green)' : 'var(--accent2)',
                          fontWeight: '600'
                        }}>
                          {p.testCases?.length || 0} cases
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {p.starterCode?.python && <span className="lang-badge">PY</span>}
                          {p.starterCode?.cpp && <span className="lang-badge">C++</span>}
                          {p.starterCode?.java && <span className="lang-badge">JV</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-sm btn-outline"
                            onClick={() => handleEdit(p)}>
                            ✏️ Edit
                          </button>
                          <button className="btn-sm btn-danger-sm"
                            onClick={() => handleDelete(p._id)}>
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PROBLEM FORM */}
      {view === 'form' && (
        <div className="admin-form">
          {/* Basic Info */}
          <div className="form-section">
            <h3>📋 Basic Info</h3>
            <div className="form-row-2">
              <div className="form-group">
                <label>Problem Title</label>
                <input className="form-input" value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="Two Sum" />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Topic</label>
                  <select className="form-select" value={form.topic}
                    onChange={e => set('topic', e.target.value)}>
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Difficulty</label>
                  <select className="form-select" value={form.difficulty}
                    onChange={e => set('difficulty', e.target.value)}>
                    {DIFFS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Problem Description</label>
              <textarea className="form-textarea" rows={5}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Describe the problem clearly with all details..." />
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Constraints (one per line)</label>
                <textarea className="form-textarea" rows={4}
                  value={form.constraints}
                  onChange={e => set('constraints', e.target.value)}
                  placeholder={'1 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9'} />
              </div>
              <div className="form-group">
                <label>Hints (one per line)</label>
                <textarea className="form-textarea" rows={4}
                  value={form.hints}
                  onChange={e => set('hints', e.target.value)}
                  placeholder={'Try using a hash map\nThink about O(n) solution'} />
              </div>
            </div>
          </div>

          {/* Examples - shown to players */}
          <div className="form-section">
            <div className="section-header">
              <h3>📖 Examples <span style={{fontSize:'13px',color:'var(--green)',fontWeight:'400'}}>(visible to players)</span></h3>
              <button className="btn-sm btn-outline"
                onClick={() => setForm(f => ({ ...f, examples: [...f.examples, emptyEx()] }))}>
                + Add Example
              </button>
            </div>
            {form.examples.map((ex, i) => (
              <div key={i} className="example-form-card">
                <div className="example-form-header">
                  <strong>Example {i + 1}</strong>
                  {form.examples.length > 1 && (
                    <button className="btn-danger-sm"
                      onClick={() => setForm(f => ({
                        ...f, examples: f.examples.filter((_, j) => j !== i)
                      }))}>✕ Remove</button>
                  )}
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Input</label>
                    <input className="form-input" value={ex.input}
                      onChange={e => setEx(i, 'input', e.target.value)}
                      placeholder="nums = [2,7,11], target = 9" />
                  </div>
                  <div className="form-group">
                    <label>Output</label>
                    <input className="form-input" value={ex.output}
                      onChange={e => setEx(i, 'output', e.target.value)}
                      placeholder="[0,1]" />
                  </div>
                  <div className="form-group">
                    <label>Explanation</label>
                    <input className="form-input" value={ex.explanation}
                      onChange={e => setEx(i, 'explanation', e.target.value)}
                      placeholder="Because 2+7=9" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Test Cases - hidden from players */}
          <div className="form-section">
            <div className="section-header">
              <h3>🔒 Test Cases <span style={{fontSize:'13px',color:'var(--accent2)',fontWeight:'400'}}>(hidden from players — used for judging)</span></h3>
              <button className="btn-sm btn-outline"
                onClick={() => setForm(f => ({ ...f, testCases: [...f.testCases, emptyTc()] }))}>
                + Add Test Case
              </button>
            </div>
            <div className="testcase-hint">
              ⚠️ Input/Output will NOT be shown to players — only Pass ✅ or Fail ❌ will be shown
            </div>
            {form.testCases.map((tc, i) => (
              <div key={i} className="example-form-card">
                <div className="example-form-header">
                  <strong>Test Case {i + 1}</strong>
                  {form.testCases.length > 1 && (
                    <button className="btn-danger-sm"
                      onClick={() => setForm(f => ({
                        ...f, testCases: f.testCases.filter((_, j) => j !== i)
                      }))}>✕ Remove</button>
                  )}
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Input (stdin format)</label>
                    <textarea className="form-textarea" rows={3}
                      value={tc.input}
                      onChange={e => setTc(i, 'input', e.target.value)}
                      placeholder={'[2,7,11,15]\n9'} />
                  </div>
                  <div className="form-group">
                    <label>Expected Output</label>
                    <textarea className="form-textarea" rows={3}
                      value={tc.output}
                      onChange={e => setTc(i, 'output', e.target.value)}
                      placeholder="[0,1]" />
                  </div>
                  <div className="form-group">
                    <label>Note (admin only)</label>
                    <textarea className="form-textarea" rows={3}
                      value={tc.explanation}
                      onChange={e => setTc(i, 'explanation', e.target.value)}
                      placeholder="Basic test case" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Starter Code */}
          <div className="form-section">
            <h3>💻 Starter Code <span style={{fontSize:'13px',color:'var(--text-muted)',fontWeight:'400'}}>(shown to players in editor)</span></h3>
            {['python', 'cpp', 'java'].map(lang => (
              <div key={lang} className="form-group">
                <label>{lang.toUpperCase()}</label>
                <div className="editor-card">
                  <div className="editor-titlebar">
                    <div className="titlebar-dots">
                      <span className="dot dot-red" />
                      <span className="dot dot-yellow" />
                      <span className="dot dot-green" />
                    </div>
                    <span className="editor-lang">{lang}</span>
                  </div>
                  <textarea className="code-editor" rows={6}
                    value={form.starterCode[lang]}
                    onChange={e => setCode(lang, e.target.value)}
                    placeholder={
                      lang === 'python'
                        ? '# Read input\nimport sys\ndata = sys.stdin.read().split()\n\n# Your solution here\n'
                        : lang === 'cpp'
                        ? '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Read input and solve\n    return 0;\n}\n'
                        : 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Read input and solve\n    }\n}\n'
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="admin-actions">
            <button className="btn-outline" onClick={cancelEdit}>Cancel</button>
            <button className="btn-primary btn-large"
              onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editId ? '💾 Update Problem' : '💾 Add to Multiplayer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}