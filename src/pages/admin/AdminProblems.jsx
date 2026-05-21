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

export default function AdminProblems() {
  const { token } = useAuth();
  const [problems, setProblems] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('list');

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
    setSaving(true);
    setMsg('');
    try {
      const payload = {
        ...form,
        constraints: form.constraints.split('\n').map(s => s.trim()).filter(Boolean),
        hints: form.hints.split('\n').map(s => s.trim()).filter(Boolean)
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
        setMsg(editId ? '✅ Problem updated!' : '✅ Problem added!');
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
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this problem?')) return;
    try {
      await fetch(`${API}/problems/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProblems();
    } catch {}
  };

  const cancelEdit = () => {
    setForm(emptyForm());
    setEditId(null);
    setView('list');
    setMsg('');
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>📝 Manage Problems</h1>
          <p>Add, edit or delete DSA problems</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className={`btn-${view === 'list' ? 'primary' : 'outline'}`}
            onClick={() => { setView('list'); cancelEdit(); }}
          >
            📋 Problem List ({problems.length})
          </button>
          <button
            className={`btn-${view === 'form' ? 'primary' : 'outline'}`}
            onClick={() => { setView('form'); setEditId(null); setForm(emptyForm()); }}
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
        <div className="admin-list">
          {problems.length === 0 ? (
            <div className="empty-state">
              <p>No problems yet. Click "Add Problem" to create one.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Topic</th>
                  <th>Difficulty</th>
                  <th>Examples</th>
                  <th>Test Cases</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((p, i) => (
                  <tr key={p._id}>
                    <td>{i + 1}</td>
                    <td className="admin-problem-title">{p.title}</td>
                    <td>
                      <span className="topic-tag">{p.topic}</span>
                    </td>
                    <td>
                      <span className={`difficulty-badge diff-${p.difficulty?.toLowerCase()}`}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td>{p.examples?.length || 0}</td>
                    <td>{p.testCases?.length || 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-sm btn-outline"
                          onClick={() => handleEdit(p)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn-sm btn-danger-sm"
                          onClick={() => handleDelete(p._id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                <label>Title</label>
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
              <label>Description</label>
              <textarea className="form-textarea" rows={5}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Describe the problem clearly..." />
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Constraints (one per line)</label>
                <textarea className="form-textarea" rows={4}
                  value={form.constraints}
                  onChange={e => set('constraints', e.target.value)}
                  placeholder={'1 <= n <= 10^4\n-10^9 <= nums[i] <= 10^9'} />
              </div>
              <div className="form-group">
                <label>Hints (one per line)</label>
                <textarea className="form-textarea" rows={4}
                  value={form.hints}
                  onChange={e => set('hints', e.target.value)}
                  placeholder={'Try using a hash map\nThink about two pointers'} />
              </div>
            </div>
          </div>

          {/* Examples */}
          <div className="form-section">
            <div className="section-header">
              <h3>📖 Examples (shown to users)</h3>
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
                      }))}>
                      ✕ Remove
                    </button>
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

          {/* Test Cases */}
          <div className="form-section">
            <div className="section-header">
              <h3>🔒 Test Cases (hidden, used for judging)</h3>
              <button className="btn-sm btn-outline"
                onClick={() => setForm(f => ({ ...f, testCases: [...f.testCases, emptyTc()] }))}>
                + Add Test Case
              </button>
            </div>
            {form.testCases.map((tc, i) => (
              <div key={i} className="example-form-card">
                <div className="example-form-header">
                  <strong>Test Case {i + 1}</strong>
                  {form.testCases.length > 1 && (
                    <button className="btn-danger-sm"
                      onClick={() => setForm(f => ({
                        ...f, testCases: f.testCases.filter((_, j) => j !== i)
                      }))}>
                      ✕ Remove
                    </button>
                  )}
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Input</label>
                    <input className="form-input" value={tc.input}
                      onChange={e => setTc(i, 'input', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Expected Output</label>
                    <input className="form-input" value={tc.output}
                      onChange={e => setTc(i, 'output', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Explanation (optional)</label>
                    <input className="form-input" value={tc.explanation}
                      onChange={e => setTc(i, 'explanation', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Starter Code */}
          <div className="form-section">
            <h3>💻 Starter Code</h3>
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
                  <textarea className="code-editor" rows={5}
                    value={form.starterCode[lang]}
                    onChange={e => setCode(lang, e.target.value)}
                    placeholder={`# ${lang} starter code here`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="admin-actions">
            <button className="btn-outline" onClick={cancelEdit}>
              Cancel
            </button>
            <button className="btn-primary btn-large"
              onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editId ? '💾 Update Problem' : '💾 Save Problem'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}