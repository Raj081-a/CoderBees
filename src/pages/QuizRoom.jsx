import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export default function QuizRoom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('lobby');
  const [roomId, setRoomId] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const advanceRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const socket = io(`${process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000'}/room`);
    socketRef.current = socket;

    socket.on('roomCreated', ({ roomId }) => {
      setRoomId(roomId);
      setIsAdmin(true);
      setParticipants([user.username]);
      setPhase('waiting');
    });

    socket.on('roomJoined', ({ roomId }) => {
      setRoomId(roomId);
      setIsAdmin(false);
      setPhase('waiting');
    });

    socket.on('roomError', ({ message }) => setError(message));

    socket.on('participantsUpdated', ({ participants }) => {
      setParticipants(participants);
    });

    socket.on('quizStarted', ({ questions }) => {
      setQuestions(questions);
      setCurrentQ(0);
      setScore(0);
      setSelected(null);
      setPhase('quiz');
      startTimer(questions, 0);
    });

    socket.on('quizResults', ({ results }) => {
      clearInterval(timerRef.current);
      clearTimeout(advanceRef.current);
      setResults(results);
      setPhase('results');
    });

    return () => {
      socket.disconnect();
      clearInterval(timerRef.current);
      clearTimeout(advanceRef.current);
    };
  }, []);

  const startTimer = (qs, qIdx) => {
    clearInterval(timerRef.current);
    setTimeLeft(15);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          scheduleAdvance(qs, qIdx);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const scheduleAdvance = (qs, qIdx) => {
    advanceRef.current = setTimeout(() => {
      advanceQuestion(qs, qIdx);
    }, 500);
  };

  const advanceQuestion = (qs, qIdx) => {
    const next = qIdx + 1;
    if (next >= qs.length) {
      socketRef.current?.emit('quizFinished', { roomId });
    } else {
      setCurrentQ(next);
      setSelected(null);
      startTimer(qs, next);
    }
  };

  const handleAnswer = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    clearInterval(timerRef.current);
    socketRef.current?.emit('submitRoomAnswer', {
      roomId,
      username: user.username,
      questionIndex: currentQ,
      answer: idx
    });
    advanceRef.current = setTimeout(() => {
      advanceQuestion(questions, currentQ);
    }, 1500);
  };

  const createRoom = () => {
    setError('');
    socketRef.current?.emit('createRoom', { username: user.username });
  };

  const joinRoom = () => {
    if (!joinInput.trim()) { setError('Enter a Room ID'); return; }
    setError('');
    socketRef.current?.emit('joinRoom', {
      roomId: joinInput.toUpperCase(),
      username: user.username
    });
  };

  const startQuiz = () => {
    socketRef.current?.emit('startQuiz', { roomId });
  };

  const timerColor = timeLeft > 8 ? '#43e97b' : timeLeft > 4 ? '#f7971e' : '#ff6584';
  const circumference = 2 * Math.PI * 36;
  const timerPct = (timeLeft / 15) * 100;

  return (
    <div className="quiz-page">

      {/* LOBBY */}
      {phase === 'lobby' && (
        <div className="quiz-lobby fade-up">
          <h1 className="quiz-title">🏠 Live Quiz Room</h1>
          <p className="quiz-subtitle">
            Real-time quiz with up to 60 players
          </p>
          {error && <div className="error-msg">{error}</div>}

          <div className="quiz-lobby-cards">
            {user?.isAdmin && (
              <div className="quiz-lobby-card">
                <div className="quiz-lobby-icon">🎮</div>
                <h3>Create Room</h3>
                <p>Start a new quiz room as admin. Get a shareable Room ID.</p>
                <button className="btn-primary" onClick={createRoom}>
                  Create Room
                </button>
              </div>
            )}
            <div className="quiz-lobby-card">
              <div className="quiz-lobby-icon">🚀</div>
              <h3>Join Room</h3>
              <p>Enter the 6-character Room ID shared by your admin.</p>
              <input
                className="room-input"
                value={joinInput}
                onChange={e => setJoinInput(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
              />
              <button className="btn-primary" onClick={joinRoom}>
                Join Room
              </button>
            </div>
          </div>

          <div className="quiz-info-row">
            <span>📝 Questions from DB</span>
            <span>⏱ 15s per question</span>
            <span>👥 Max 60 players</span>
          </div>
        </div>
      )}

      {/* WAITING ROOM */}
      {phase === 'waiting' && (
        <div className="quiz-waiting fade-up">
          <div className="room-id-display">
            <span>Room ID:</span>
            <span className="room-id-code">{roomId}</span>
            <button className="btn-sm btn-outline"
              onClick={() => {
                navigator.clipboard.writeText(roomId);
              }}>
              📋 Copy
            </button>
          </div>

          <div className="quiz-info-tags">
            <span>⏱ 15s per question</span>
            <span>👥 {participants.length}/60 players</span>
          </div>

          <div className="participants-section">
            <h3>Participants ({participants.length})</h3>
            <div className="participants-grid">
              {participants.map((p, i) => (
                <div key={i} className="participant-chip">
                  <span className="participant-avatar">
                    {p[0].toUpperCase()}
                  </span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>

          {isAdmin ? (
            <button className="btn-primary btn-large" onClick={startQuiz}>
              ▶ Start Quiz ({participants.length} players)
            </button>
          ) : (
            <div className="waiting-indicator">
              <div className="waiting-spinner">⏳</div>
              <p>Waiting for admin to start the quiz...</p>
            </div>
          )}
        </div>
      )}

      {/* QUIZ */}
      {phase === 'quiz' && questions.length > 0 && (
        <div className="quiz-active fade-up">
          <div className="quiz-top">
            <div className="quiz-progress">
              <div className="quiz-prog-bar">
                <div className="quiz-prog-fill"
                  style={{ width: `${(currentQ / questions.length) * 100}%` }} />
              </div>
              <span>Q {currentQ + 1} / {questions.length}</span>
            </div>
            <div className="quiz-score">Score: {score}</div>
            <div className="quiz-timer">
              <svg viewBox="0 0 80 80" width="80" height="80">
                <circle cx="40" cy="40" r="36"
                  fill="none" stroke="#222244" strokeWidth="6" />
                <circle cx="40" cy="40" r="36"
                  fill="none" stroke={timerColor} strokeWidth="6"
                  strokeDasharray={`${circumference * timerPct / 100} ${circumference}`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                  style={{ transition: 'stroke-dasharray 1s linear' }}
                />
                <text x="40" y="46" textAnchor="middle"
                  fill="#fff" fontSize="18" fontWeight="bold">
                  {timeLeft}
                </text>
              </svg>
            </div>
          </div>

          <div className="quiz-question-card">
            <p className="quiz-question">
              {questions[currentQ]?.question}
            </p>
            <div className="quiz-options">
              {questions[currentQ]?.options?.map((opt, i) => (
                <button
                  key={i}
                  className={`quiz-option ${selected === i ? 'quiz-selected' : ''}`}
                  onClick={() => handleAnswer(i)}
                  disabled={selected !== null}
                >
                  <span className="option-letter">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {phase === 'results' && (
        <div className="quiz-results fade-up">
          <h2 className="results-title">🏆 Quiz Results</h2>
          <div className="results-leaderboard">
            {results.map((r, i) => (
              <div
                key={r.username}
                className={`result-row ${r.username === user?.username ? 'current-user' : ''}`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <span className="result-rank">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <span className="result-avatar">
                  {r.username[0].toUpperCase()}
                </span>
                <span className="result-username">{r.username}</span>
                <span className="result-score">{r.score}/{r.total}</span>
                <span className="result-pct">{r.percentage}%</span>
              </div>
            ))}
          </div>
          <div className="result-actions">
            <button className="btn-primary" onClick={() => {
              setPhase('lobby');
              setResults([]);
              setRoomId('');
              setJoinInput('');
              setParticipants([]);
            }}>
              New Room
            </button>
            <button className="btn-outline" onClick={() => navigate('/')}>
              Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}