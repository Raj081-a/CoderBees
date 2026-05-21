import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { topics } from '../data/topics';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'https://coderbees-backend.onrender.com/api';

export default function ProblemsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [problems, setProblems] = useState([]);
  const [allProblems, setAllProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [solved, setSolved] = useState(() =>
    JSON.parse(localStorage.getItem('solvedProblems') || '{}')
  );

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const res = await fetch(`${API}/problems/all`);
      const data = await res.json();
      setAllProblems(Array.isArray(data) ? data : []);
    } catch {}
  };

  const fetchByTopic = async (topicId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/problems/topic/${topicId}`);
      const data = await res.json();
      setProblems(Array.isArray(data) ? data : []);
    } catch { setProblems([]); }
    setLoading(false);
  };

  const toggleSolved = (slug) => {
    const updated = { ...solved, [slug]: !solved[slug] };
    setSolved(updated);
    localStorage.setItem('solvedProblems', JSON.stringify(updated));
  };

  const getTopicStats = (topicId) => {
    const tp = allProblems.filter(p => p.topic === topicId);
    const sc = tp.filter(p => solved[p.slug]).length;
    return { total: tp.length, solvedCount: sc };
  };

  const displayProblems = selectedTopic ? problems : allProblems;

  return (
    <div className="problems-layout">
      {/* Left Panel - Topics */}
      <aside className="problems-sidebar">
        <h3 className="problems-sidebar-title">Topics</h3>
        <div className="topics-list">
          <div
            className={`topic-list-item ${!selectedTopic ? 'active' : ''}`}
            onClick={() => { setSelectedTopic(null); setProblems([]); }}
          >
            <div className="topic-list-row">
              <span>📋 All Problems</span>
              <span className="topic-count">{allProblems.length}</span>
            </div>
          </div>
          {topics.map(topic => {
            const { total, solvedCount } = getTopicStats(topic.id);
            const pct = total > 0 ? Math.round((solvedCount / total) * 100) : 0;
            return (
              <div
                key={topic.id}
                className={`topic-list-item ${selectedTopic === topic.id ? 'active' : ''}`}
                onClick={() => { setSelectedTopic(topic.id); fetchByTopic(topic.id); }}
              >
                <div className="topic-list-row">
                  <span>{topic.icon} {topic.name}</span>
                  <span className="topic-count">{solvedCount}/{total}</span>
                </div>
                <div className="topic-mini-progress">
                  <div className="topic-mini-fill"
                    style={{ width: `${pct}%`, background: topic.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Right Panel - Problems */}
      <main className="problems-main">
        <div className="problems-header">
          <h2>
            {selectedTopic
              ? `${topics.find(t => t.id === selectedTopic)?.icon} ${topics.find(t => t.id === selectedTopic)?.name} Problems`
              : 'All Problems'}
          </h2>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : displayProblems.length === 0 ? (
          <div className="empty-state">
            <p>No problems yet.</p>
            {user?.isAdmin && (
              <button className="btn-primary"
                onClick={() => navigate('/admin/problems')}>
                + Add Problems
              </button>
            )}
          </div>
        ) : (
          <table className="problems-table">
            <thead>
              <tr>
                <th>#</th>
                <th>✓</th>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Topic</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayProblems.map((problem, i) => (
                <tr
                  key={problem._id}
                  className={`problem-row ${solved[problem.slug] ? 'solved-row' : ''}`}
                  onClick={() => navigate(`/problem/${problem.slug}`)}
                >
                  <td className="problem-num">{i + 1}</td>
                  <td onClick={e => { e.stopPropagation(); toggleSolved(problem.slug); }}>
                    <span className={`solved-check ${solved[problem.slug] ? 'checked' : ''}`}>
                      {solved[problem.slug] ? '✓' : '○'}
                    </span>
                  </td>
                  <td className="problem-title">{problem.title}</td>
                  <td>
                    <span className={`difficulty-badge diff-${problem.difficulty?.toLowerCase()}`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="problem-topic">
                    {topics.find(t => t.id === problem.topic)?.icon} {problem.topic}
                  </td>
                  <td>
                    <span className={`status-badge ${solved[problem.slug] ? 'status-solved' : 'status-todo'}`}>
                      {solved[problem.slug] ? 'Solved' : 'Todo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}