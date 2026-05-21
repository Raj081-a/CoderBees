import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const TOPICS = ['general','arrays','linkedlist','stack','queue','trees','graph','sorting'];
const DIFFS = ['Easy','Medium','Hard'];

const emptyForm = () => ({
  question: '',
  options: ['', '', '', ''],
  answer: 0,
  topic: 'general',
  difficulty: 'Easy'
});

export default function AdminQuiz() {
  const { token } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('list');

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${API}/quiz/questions`);
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : []);
    } catch {}
  };

  const setOption = (i, val) => {
    const opts = [...form.options];
    opts[i] = val;
    setForm(f => ({ ...f, options: opts }));
  };

  const handleSave = async () => {
    if (!form.question || form.options.some(o => !o.trim())) {
      setMsg('❌ Question and all 4 options required');
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      const url = editId
        ? `${API}/quiz/${editId}`
        : `${API}/quiz/add`;
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setMsg(editId ? '✅ Question updated!' : '✅ Question added!');
        setForm(emptyForm());
        setEditId(null);
        setView('list');
        fetchQuestions();
      } else {
        setMsg(`❌ ${data.error}`);
      }
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
    setSaving(false);
  };

  const handleEdit = (q) => {
    setForm({
      question: q.question,
      options: q.options,
      answer: q.answer,
      topic: q.topic || 'general',
      difficulty: q.difficulty || 'Easy'
    });
    setEditId(q._id);
    setView('form');
    setMsg('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await fetch(`${API}/quiz/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchQuestions();
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
          <h1>❓ Manage Quiz Questions</h1>
          <p>These questions are used in Multiplayer matches and Quiz Rooms</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className={`btn-${view === 'list' ? 'primary' : 'outline'}`}
            onClick={() => { setView('list'); cancelEdit(); }}
          >
            📋 Questions ({questions.length})
          </button>
          <button
            className={`btn-${view === 'form' ? 'primary' : 'outline'}`}
            onClick={() => { setView('form'); setEditId(null); setForm(emptyForm()); }}
          >
            ➕ Add Question
          </button>
        </div>
      </div>

      {msg && (
        <div className={`admin-msg ${msg.startsWith('✅') ? 'msg-ok' : 'msg-fail'}`}>
          {msg}
        </div>
      )}

      {/* QUESTIONS LIST */}
      {view === 'list' && (
        <div className="admin-list">
          {questions.length === 0 ? (
            <div className="empty-state">
              <p>No quiz questions yet.</p>
              <p style={{ fontSize: '14px', marginTop: '8px', color: '#8888aa' }}>
                Add questions to use them in Multiplayer matches and Quiz Rooms.
              </p>
              <button className="btn-primary" style={{ marginTop: '16px' }}
                onClick={() => setView('form')}>
                + Add First Question
              </button>
            </div>
          ) : (
            <div className="quiz-questions-list">
              {questions.map((q, i) => (
                <div key={q._id} className="quiz-question-card-admin">
                  <div className="quiz-q-header">
                    <span className="quiz-q-num">Q{i + 1}</span>
                    <span className="topic-tag">{q.topic}</span>
                    <span className={`difficulty-badge diff-${q.difficulty?.toLowerCase()}`}>
                      {q.difficulty}
                    </span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                      <button className="btn-sm btn-outline"
                        onClick={() => handleEdit(q)}>
                        ✏️ Edit
                      </button>
                      <button className="btn-sm btn-danger-sm"
                        onClick={() => handleDelete(q._id)}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                  <p className="quiz-q-text">{q.question}</p>
                  <div className="quiz-q-options">
                    {q.options.map((opt, j) => (
                      <span key={j}
                        className={`quiz-q-opt ${j === q.answer ? 'correct-opt' : ''}`}>
                        {String.fromCharCode(65 + j)}. {opt}
                        {j === q.answer && ' ✓'}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUESTION FORM */}
      {view === 'form' && (
        <div className="admin-form">
          <div className="form-section">
            <h3>{editId ? '✏️ Edit Question' : '➕ Add New Question'}</h3>

            <div className="form-row-2">
              <div className="form-group">
                <label>Topic</label>
                <select className="form-select" value={form.topic}
                  onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}>
                  {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Difficulty</label>
                <select className="form-select" value={form.difficulty}
                  onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                  {DIFFS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Question</label>
              <textarea className="form-textarea" rows={3}
                value={form.question}
                onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                placeholder="What is the time complexity of binary search?" />
            </div>

            <div className="form-group">
              <label>Options (select the correct one)</label>
              <div className="options-form-grid">
                {form.options.map((opt, i) => (
                  <div key={i} className={`option-form-row ${form.answer === i ? 'correct-option-row' : ''}`}>
                    <button
                      className={`option-correct-btn ${form.answer === i ? 'selected' : ''}`}
                      onClick={() => setForm(f => ({ ...f, answer: i }))}
                      title="Mark as correct answer"
                    >
                      {form.answer === i ? '✓' : String.fromCharCode(65 + i)}
                    </button>
                    <input
                      className="form-input"
                      value={opt}
                      onChange={e => setOption(i, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    />
                  </div>
                ))}
              </div>
              <p className="option-hint">
                Click the letter button to mark correct answer.
                Currently correct: <strong>Option {String.fromCharCode(65 + form.answer)}</strong>
              </p>
            </div>
          </div>

          <div className="admin-actions">
            <button className="btn-outline" onClick={cancelEdit}>Cancel</button>
            <button className="btn-primary btn-large"
              onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editId ? '💾 Update Question' : '💾 Save Question'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}