import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function MultiplayerMatch() {
  const { user, token, updatePoints } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('lobby');
  const [match, setMatch] = useState(null);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [result, setResult] = useState(null);
  const [codeResults, setCodeResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [waitingOpponent, setWaitingOpponent] = useState(false);
  const [opponentSubmitted, setOpponentSubmitted] = useState(false);
  const [matchError, setMatchError] = useState('');
  const socketRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user) navigate('/login');
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const timerColor = timeLeft > 600 ? '#43e97b' : timeLeft > 180 ? '#f7971e' : '#ff6584';

  const connectSocket = () => {
    const socket = io(`${process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000'}/match`);
    socketRef.current = socket;

    socket.on('queueJoined', () => setPhase('queue'));

    socket.on('matchError', ({ message }) => {
      setMatchError(message);
      setPhase('lobby');
    });

    socket.on('matchStart', (data) => {
      setMatch(data);
      setPhase('match');
      setTimeLeft(1800);
      setCode(data.problem.starterCode?.[language] || getDefault(language));
      setCodeResults([]);
      setWaitingOpponent(false);
      setOpponentSubmitted(false);

      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    });

    socket.on('codeResult', ({ results, allPassed }) => {
      setCodeResults(results);
      setSubmitting(false);
      if (!allPassed) setWaitingOpponent(false);
    });

    socket.on('waitingForOpponent', () => {
      setWaitingOpponent(true);
      setSubmitting(false);
    });

    socket.on('opponentSubmitted', ({ passed }) => {
      setOpponentSubmitted(true);
    });

    socket.on('matchEnd', (data) => {
      clearInterval(timerRef.current);
      setResult(data);
      setPhase('result');
      if (data.pointsChange && user) {
        updatePoints(user.points + data.pointsChange);
      }
    });

    socket.on('matchAbandoned', (data) => {
      clearInterval(timerRef.current);
      setResult({ ...data, result: 'abandoned' });
      setPhase('result');
      if (data.pointsChange && user) updatePoints(user.points + data.pointsChange);
    });

    return socket;
  };

  const getDefault = (lang) => {
    if (lang === 'python') return '# Write your solution here\n\n';
    if (lang === 'cpp') return '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution\n    return 0;\n}\n';
    if (lang === 'java') return 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your solution\n    }\n}\n';
    return '';
  };

  const joinQueue = () => {
    if (!user || user.points < 10) return;
    setMatchError('');
    const socket = connectSocket();
    socket.emit('joinQueue', { userId: user.id, username: user.username });
  };

  const cancelQueue = () => {
    socketRef.current?.emit('cancelQueue');
    socketRef.current?.disconnect();
    setPhase('lobby');
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (match) {
      setCode(match.problem.starterCode?.[lang] || getDefault(lang));
    }
  };

  const submitCode = async () => {
    if (submitting || waitingOpponent) return;
    setSubmitting(true);
    setCodeResults([]);

    try {
      const res = await fetch(`${API}/problems/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          slug: match.problem.slug,
          code,
          language
        })
      });
      const data = await res.json();

      // Results ko socket se bhejo
      socketRef.current?.emit('submitCode', {
        matchId: match.matchId,
        userId: user.id,
        results: data.results || [],
        allPassed: data.allPassed || false,
        language
      });

    } catch (e) {
      setSubmitting(false);
      setCodeResults([{
        passed: false,
        status: 'Error',
        input: '(hidden)',
        expected: '(hidden)',
        actual: 'Server error'
      }]);
    }
  };

  const leaveMatch = () => {
    if (!window.confirm('Are you sure? Leaving costs 20 coins!')) return;
    socketRef.current?.emit('leaveMatch', {
      matchId: match.matchId,
      userId: user.id
    });
    clearInterval(timerRef.current);
    setResult({ result: 'left', pointsChange: -20 });
    setPhase('result');
    if (user) updatePoints(Math.max(0, user.points - 20));
  };

  return (
    <div className="match-page">

      {/* LOBBY */}
      {phase === 'lobby' && (
        <div className="match-lobby fade-up">
          <div className="lobby-card">
            <h1 className="lobby-title">⚔️ Multiplayer Match</h1>
            {matchError && <div className="error-msg">{matchError}</div>}
            <div className="rules-card">
              <h3>Rules</h3>
              <ul>
                <li>Entry fee: <strong>10 🪙 coins</strong></li>
                <li>Solve the DSA problem before opponent</li>
                <li>All test cases must pass to win</li>
                <li><strong>30 minute</strong> timer</li>
                <li>Winner takes <strong>20 coins</strong></li>
                <li>Leaving costs <strong>20 coins penalty</strong></li>
              </ul>
            </div>
            <div className="coins-display">
              Your coins: <strong>{user?.points} 🪙</strong>
            </div>
            <button
              className="btn-primary btn-large"
              onClick={joinQueue}
              disabled={!user || user.points < 10}
            >
              {user?.points < 10 ? '❌ Not enough coins' : '⚔️ Join Queue (10 🪙)'}
            </button>
            {user?.points < 10 && (
              <button className="btn-outline btn-sm"
                style={{ marginTop: '12px' }}
                onClick={() => navigate('/buy-coins')}>
                Buy Coins
              </button>
            )}
          </div>
        </div>
      )}

      {/* QUEUE */}
      {phase === 'queue' && (
        <div className="match-queue fade-up">
          <div className="queue-card">
            <div className="queue-spinner">⚔️</div>
            <h2>Finding Opponent...</h2>
            <p>Waiting for another player to join</p>
            <div className="queue-dots">
              <span /><span /><span />
            </div>
            <button className="btn-outline" onClick={cancelQueue}>Cancel</button>
          </div>
        </div>
      )}

      {/* MATCH */}
      {phase === 'match' && match && (
        <div className="match-coding-arena fade-up">

          {/* Top Bar */}
          <div className="match-topbar">
            <div className="vs-info">
              <span className="player-name p1">{match.player1}</span>
              <span className="vs-badge">VS</span>
              <span className="player-name p2">{match.player2}</span>
            </div>
            <div className="match-timer" style={{ color: timerColor }}>
              ⏱ {formatTime(timeLeft)}
            </div>
            <div className="match-meta">
              <span className={`difficulty-badge diff-${match.problem.difficulty?.toLowerCase()}`}>
                {match.problem.difficulty}
              </span>
              <span className="topic-tag">{match.problem.topic}</span>
            </div>
          </div>

          {/* Main Layout */}
          <div className="match-main">

            {/* Left — Problem */}
            <div className="match-problem">
              <h2 className="match-problem-title">{match.problem.title}</h2>
              <p className="match-problem-desc">{match.problem.description}</p>

              {match.problem.constraints?.length > 0 && (
                <div className="match-constraints">
                  <h4>Constraints:</h4>
                  <ul>
                    {match.problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}

              {match.problem.examples?.length > 0 && (
                <div className="match-examples">
                  <h4>Examples:</h4>
                  {match.problem.examples.map((ex, i) => (
                    <div key={i} className="example-card">
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

              <div className="match-testcase-info">
                🔒 {match.problem.testCaseCount} hidden test cases
              </div>

              {/* Code Results */}
              {codeResults.length > 0 && (
                <div className="match-results">
                  <h4>Test Results:</h4>
                  {codeResults.map((r, i) => (
                    <div key={i} className={`match-result-row ${r.passed ? 'tc-pass' : 'tc-fail'}`}>
                      <span>{r.passed ? '✅' : '❌'} Test {i + 1}</span>
                      <span className="tc-status">{r.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Opponent Status */}
              {opponentSubmitted && !waitingOpponent && (
                <div className="opponent-status">
                  ⚡ Opponent has submitted!
                </div>
              )}

              {waitingOpponent && (
                <div className="waiting-opponent">
                  ✅ Code submitted! Waiting for opponent...
                </div>
              )}
            </div>

            {/* Right — Editor */}
            <div className="match-editor">
              <div className="editor-card" style={{ height: '100%' }}>
                <div className="editor-titlebar">
                  <div className="titlebar-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-yellow" />
                    <span className="dot dot-green" />
                  </div>
                  <select className="lang-select" value={language}
                    onChange={e => handleLanguageChange(e.target.value)}>
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                  </select>
                  <button className="btn-danger btn-sm btn-outline"
                    onClick={leaveMatch}>
                    🚪 Leave (-20🪙)
                  </button>
                </div>
                <textarea
                  className="code-editor match-code-editor"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  spellCheck={false}
                />
                <div className="editor-footer">
                  <span style={{ fontSize: '13px', color: '#8888aa' }}>
                    {match.problem.testCaseCount} test cases
                  </span>
                  <button
                    className="btn-run"
                    onClick={submitCode}
                    disabled={submitting || waitingOpponent || timeLeft === 0}
                  >
                    {submitting ? '⏳ Running...' :
                     waitingOpponent ? '✅ Submitted' :
                     '▶ Submit Code'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESULT */}
      {phase === 'result' && result && (
        <div className="match-result fade-up">
          <div className="result-card-match">
            <div className="result-emoji">
              {result.result === 'win' && '🏆'}
              {result.result === 'loss' && '💀'}
              {result.result === 'draw' && '🤝'}
              {result.result === 'timeout' && '⏰'}
              {result.result === 'both_wrong' && '😅'}
              {(result.result === 'left' || result.result === 'abandoned') && '🚪'}
            </div>
            <h2 className="result-heading">
              {result.result === 'win' && '🎉 You Won!'}
              {result.result === 'loss' && 'You Lost'}
              {result.result === 'draw' && 'Draw!'}
              {result.result === 'timeout' && "Time's Up!"}
              {result.result === 'both_wrong' && 'Both Failed'}
              {result.result === 'left' && 'You Left'}
              {result.result === 'abandoned' && 'Opponent Left!'}
            </h2>

            {result.pointsChange !== undefined && result.pointsChange !== 0 && (
              <div className={`points-change ${result.pointsChange > 0 ? 'positive' : 'negative'}`}>
                {result.pointsChange > 0 ? '+' : ''}{result.pointsChange} 🪙
              </div>
            )}

            <div className="result-actions">
              <button className="btn-primary" onClick={() => {
                setPhase('lobby');
                setResult(null);
                setMatch(null);
                setCode('');
                setCodeResults([]);
                setWaitingOpponent(false);
              }}>
                Play Again
              </button>
              <button className="btn-outline" onClick={() => navigate('/')}>
                Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}