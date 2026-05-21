import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';

export default function AdminRoom() {
  const { user } = useAuth();
  const [phase, setPhase] = useState('create');
  const [roomId, setRoomId] = useState('');
  const [participants, setParticipants] = useState([]);
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
    const socket = io(`${process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000'}/room`);
    socketRef.current = socket;

    socket.on('roomCreated', ({ roomId }) => {
      setRoomId(roomId);
      setParticipants([user.username]);
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
          setTimeout(() => advanceQuestion(qs, qIdx), 500);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
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
      roomId, username: user.username,
      questionIndex: currentQ, answer: idx
    });
    advanceRef.current = setTimeout(() => {
      advanceQuestion(questions, currentQ);
    }, 1500);
  };

  const createRoom = () => {
    setError('');
    socketRef.current?.emit('createRoom', { username: user.username });
  };

  const startQuiz = () => {
    socketRef.current?.emit('startQuiz', { roomId });
  };

  const timerColor = timeLeft > 8 ? '#43e97b' : timeLeft > 4 ? '#f7971e' : '#ff6584';
  const circumference = 2 * Math.PI * 36;

  return (
    <div className="admin-page">
      {phase === 'create' && (
        <>
          <div className="admin-header">
            <div>
              <h1>🏠 Create Quiz Room</h1>
              <p>Create a live quiz room for students to join</p>
            </div>
          </div>
          {error && <div className="admin-msg msg-fail">{error}</div>}
          <div className="form-section" style={{ maxWidth: '500px' }}>
            <h3>Room Settings</h3>
            <div className="quiz-info-row" style={{ marginBottom: '24px' }}>
              <span>📝 Questions from DB</span>
              <span>⏱ 15s per question</span>
              <span>👥 Max 60 players</span>
            </div>
            <p style={{ color: '#8888aa', marginBottom: '24px', lineHeight: '1.6' }}>
              Click "Create Room" to generate a unique 6-character Room ID.
              Share this ID with students — they can join from the Room page.
            </p>
            <button className="btn-primary btn-large" onClick={createRoom}>
              🎮 Create Room
            </button>
          </div>
        </>
      )}

      {phase === 'waiting' && (
        <div className="quiz-waiting fade-up">
          <div className="room-id-display">
            <span>Share this Room ID:</span>
            <span className="room-id-code">{roomId}</span>
            <button className="btn-sm btn-outline"
              onClick={() => navigator.clipboard.writeText(roomId)}>
              📋 Copy
            </button>
          </div>
          <div className="quiz-info-tags">
            <span>⏱ 15s per question</span>
            <span>👥 {participants.length}/60 joined</span>
          </div>
          <div className="participants-section">
            <h3>Live Participants ({participants.length})</h3>
            <div className="participants-grid">
              {participants.map((p, i) => (
                <div key={i} className="participant-chip">
                  <span className="participant-avatar">{p[0].toUpperCase()}</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
          {error && <div className="admin-msg msg-fail">{error}</div>}
          <button className="btn-primary btn-large" onClick={startQuiz}>
            ▶ Start Quiz ({participants.length} players)
          </button>
        </div>
      )}

      {phase === 'quiz' && questions.length > 0 && (
        <div className="quiz-active fade-up" style={{ maxWidth: '700px', margin: '0 auto' }}>
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
                  strokeDasharray={`${circumference * (timeLeft / 15) * 100 / 100} ${circumference}`}
                  strokeLinecap="round" transform="rotate(-90 40 40)"
                  style={{ transition: 'stroke-dasharray 1s linear' }}
                />
                <text x="40" y="46" textAnchor="middle"
                  fill="#fff" fontSize="18" fontWeight="bold">{timeLeft}</text>
              </svg>
            </div>
          </div>
          <div className="quiz-question-card">
            <p className="quiz-question">{questions[currentQ]?.question}</p>
            <div className="quiz-options">
              {questions[currentQ]?.options?.map((opt, i) => (
                <button key={i}
                  className={`quiz-option ${selected === i ? 'quiz-selected' : ''}`}
                  onClick={() => handleAnswer(i)}
                  disabled={selected !== null}>
                  <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div className="quiz-results fade-up">
          <h2 className="results-title">🏆 Quiz Results</h2>
          <div className="results-leaderboard">
            {results.map((r, i) => (
              <div key={r.username}
                className={`result-row ${r.username === user?.username ? 'current-user' : ''}`}>
                <span className="result-rank">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <span className="result-avatar">{r.username[0].toUpperCase()}</span>
                <span className="result-username">{r.username}</span>
                <span className="result-score">{r.score}/{r.total}</span>
                <span className="result-pct">{r.percentage}%</span>
              </div>
            ))}
          </div>
          <div className="result-actions">
            <button className="btn-primary" onClick={() => {
              setPhase('create'); setResults([]);
              setRoomId(''); setParticipants([]);
            }}>
              Create New Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
}