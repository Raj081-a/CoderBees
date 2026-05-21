import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function ProblemDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('description');
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [solved, setSolved] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [revealedHints, setRevealedHints] = useState(0);

  useEffect(() => {
    fetchProblem();
    const s = JSON.parse(localStorage.getItem('solvedProblems') || '{}');
    setSolved(!!s[slug]);
  }, [slug]);

  useEffect(() => {
    if (problem) {
      setCode(problem.starterCode?.[language] || getDefault(language));
    }
  }, [language, problem]);

  const fetchProblem = async () => {
    try {
      const res = await fetch(`${API}/problems/${slug}`);
      const data = await res.json();
      setProblem(data);
      setCode(data.starterCode?.python || getDefault('python'));
    } catch {}
    setLoading(false);
  };

  const getDefault = (lang) => {
    if (lang === 'python') return '# Write your solution here\n\ndef solution():\n    pass\n';
    if (lang === 'cpp') return '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution\n    return 0;\n}\n';
    if (lang === 'java') return 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your solution\n    }\n}\n';
    return '';
  };

  const runCode = async () => {
    setRunning(true);
    setTab('results');
    setAttempts(a => a + 1);
    try {
      const res = await fetch(`${API}/problems/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ slug, code, language })
      });
      const data = await res.json();
      setResults(data.results || []);
      if (data.allPassed) {
        setSolved(true);
        const s = JSON.parse(localStorage.getItem('solvedProblems') || '{}');
        s[slug] = true;
        localStorage.setItem('solvedProblems', JSON.stringify(s));
      }
    } catch {
      setResults([{
        input: 'N/A', expected: 'N/A',
        actual: 'Server error - is backend running?',
        passed: false
      }]);
    }
    setRunning(false);
  };

  const toggleSolved = () => {
    const newSolved = !solved;
    setSolved(newSolved);
    const s = JSON.parse(localStorage.getItem('solvedProblems') || '{}');
    if (newSolved) s[slug] = true;
    else delete s[slug];
    localStorage.setItem('solvedProblems', JSON.stringify(s));
  };

  if (loading) return <div className="loading-page"><div className="loading-spinner-lg">🐝</div></div>;
  if (!problem) return <div className="error-page">Problem not found</div>;

  const allPassed = results.length > 0 && results.every(r => r.passed);

  return (
    <div className="problem-detail-layout">
      {/* Left Panel */}
      <div className="problem-left">
        <div className="problem-detail-header">
          <h2 className="problem-detail-title">{problem.title}</h2>
          <div className="problem-detail-meta">
            <span className={`difficulty-badge diff-${problem.difficulty?.toLowerCase()}`}>
              {problem.difficulty}
            </span>
            <span className="problem-topic-tag">{problem.topic}</span>
            {solved && <span className="solved-badge">✓ Solved</span>}
          </div>
        </div>

        <div className="problem-tabs">
          {['description', 'examples', 'hints', 'results'].map(t => (
            <button
              key={t}
              className={`problem-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'results' && results.length > 0 && (
                <span className={`tab-badge ${allPassed ? 'badge-ok' : 'badge-fail'}`}>
                  {results.filter(r => r.passed).length}/{results.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="problem-tab-content">
          {tab === 'description' && (
            <div className="problem-description">
              <p>{problem.description}</p>
              {problem.constraints?.length > 0 && (
                <div className="constraints-section">
                  <h4>Constraints:</h4>
                  <ul>
                    {problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
              <div className="attempt-info">
                <span>Attempts: {attempts}</span>
                <button
                  className={`btn-sm ${solved ? 'btn-outline' : 'btn-primary'}`}
                  onClick={toggleSolved}
                >
                  {solved ? '✓ Mark Unsolved' : 'Mark Solved'}
                </button>
              </div>
            </div>
          )}

          {tab === 'examples' && (
            <div className="examples-list">
              {problem.examples?.map((ex, i) => (
                <div key={i} className="example-card">
                  <h4>Example {i + 1}</h4>
                  <div className="example-row">
                    <strong>Input:</strong> <code>{ex.input}</code>
                  </div>
                  <div className="example-row">
                    <strong>Output:</strong> <code>{ex.output}</code>
                  </div>
                  {ex.explanation && (
                    <div className="example-row">
                      <strong>Explanation:</strong> {ex.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'hints' && (
            <div className="hints-section">
              {problem.hints?.slice(0, revealedHints).map((hint, i) => (
                <div key={i} className="hint-card">
                  <strong>Hint {i + 1}:</strong> {hint}
                </div>
              ))}
              {revealedHints < (problem.hints?.length || 0) ? (
                <button className="btn-outline"
                  onClick={() => setRevealedHints(r => r + 1)}>
                  Reveal Hint {revealedHints + 1}
                </button>
              ) : (
                <p className="hints-done">All hints revealed!</p>
              )}
              {revealedHints === 0 && (
                <p className="hint-prompt">Click button to reveal hints one by one.</p>
              )}
            </div>
          )}

          {tab === 'results' && (
            <div className="results-list">
              {results.length === 0 ? (
                <p className="results-empty">Run your code to see results.</p>
              ) : (
                <>
                  <div className={`results-summary ${allPassed ? 'summary-ok' : 'summary-fail'}`}>
                    {allPassed
                      ? '🎉 All test cases passed!'
                      : `${results.filter(r => r.passed).length}/${results.length} passed`}
                  </div>
                  {results.map((r, i) => (
                    <div key={i} className={`test-case-card ${r.passed ? 'tc-pass' : 'tc-fail'}`}>
                      <div className="tc-header">
                        <span>{r.passed ? '✅' : '❌'} Test {i + 1}</span>
                        <span className="tc-status">{r.status}</span>
                      </div>
                      <div className="tc-row"><strong>Input:</strong> <code>{r.input}</code></div>
                      <div className="tc-row"><strong>Expected:</strong> <code>{r.expected}</code></div>
                      <div className="tc-row"><strong>Got:</strong> <code>{r.actual}</code></div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Editor */}
      <div className="problem-right">
        <div className="editor-card" style={{height:'100%', borderRadius:0, border:'none'}}>
          <div className="editor-titlebar">
            <div className="titlebar-dots">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
            </div>
            <select className="lang-select" value={language}
              onChange={e => setLanguage(e.target.value)}>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
          </div>
          <textarea
            className="code-editor code-editor-full"
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
          />
          <div className="editor-footer">
            <button className="btn-outline btn-sm"
              onClick={() => navigate('/problems')}>
              ← Back
            </button>
            <button className="btn-run" onClick={runCode} disabled={running}>
              {running ? '⏳ Running...' : '▶ Run & Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}