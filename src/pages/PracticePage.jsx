import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { topics, practiceQuestions } from '../data/topics';

function speak(text) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  window.speechSynthesis.speak(u);
}

export default function PracticePage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const topic = topics.find(t => t.id === topicId);
  const questions = practiceQuestions[topicId] || [];

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    window.speechSynthesis.cancel();
    return () => window.speechSynthesis.cancel();
  }, [topicId]);

  if (!topic || questions.length === 0) {
    return <div className="error-page">Topic not found</div>;
  }

  const q = questions[current];
  const progress = (current / questions.length) * 100;

  const handleAnswer = (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.answer) {
      setScore(s => s + 1);
      speak('Correct! Well done.');
    } else {
      speak(`Incorrect. The correct answer is: ${q.options[q.answer]}`);
    }
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setDone(true);
      window.speechSynthesis.cancel();
    }
  };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const medal = pct === 100 ? '🏆' : pct >= 60 ? '🎯' : '📚';
    const msg = pct === 100 ? 'Perfect Score!' : pct >= 60 ? 'Good Job!' : 'Keep Practicing!';

    return (
      <div className="layout">
        <Sidebar activeTopic={topicId} />
        <main className="main-content center-content">
          <div className="results-card fade-up">
            <div className="result-medal">{medal}</div>
            <h2 className="result-title">{msg}</h2>
            <div className="result-circle">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none"
                  stroke="#222244" strokeWidth="10" />
                <circle cx="60" cy="60" r="54" fill="none"
                  stroke="#6c63ff" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 54 * pct / 100} ${2 * Math.PI * 54}`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)" />
                <text x="60" y="65" textAnchor="middle"
                  fill="#fff" fontSize="22" fontWeight="bold">
                  {pct}%
                </text>
              </svg>
            </div>
            <p className="result-score">{score} / {questions.length} correct</p>
            <div className="result-actions">
              <button className="btn-outline" onClick={() => {
                setCurrent(0); setScore(0);
                setSelected(null); setAnswered(false); setDone(false);
              }}>
                Retry
              </button>
              <button className="btn-primary"
                onClick={() => navigate(`/coding/${topicId}`)}>
                Next: Coding →
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar activeTopic={topicId} />
      <main className="main-content">
        <div className="practice-header">
          <h2>{topic.icon} {topic.name} — Practice</h2>
          <span className="practice-counter">
            Question {current + 1} / {questions.length}
          </span>
        </div>

        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="practice-card fade-up">
          <p className="practice-question">{q.q}</p>
          <div className="options-grid">
            {q.options.map((opt, i) => {
              let cls = 'option-btn';
              if (answered) {
                if (i === q.answer) cls += ' correct';
                else if (i === selected) cls += ' wrong';
              }
              return (
                <button key={i} className={cls}
                  onClick={() => handleAnswer(i)} disabled={answered}>
                  <span className="option-letter">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {answered && (
            <div className="answer-feedback">
              <p className={selected === q.answer ? 'feedback-correct' : 'feedback-wrong'}>
                {selected === q.answer
                  ? '✅ Correct!'
                  : `❌ Incorrect. Answer: ${q.options[q.answer]}`}
              </p>
              <button className="btn-primary" onClick={handleNext}>
                {current < questions.length - 1 ? 'Next Question →' : 'See Results'}
              </button>
            </div>
          )}
        </div>

        <div className="score-display">
          Score: {score} / {current + (answered ? 1 : 0)}
        </div>
      </main>
    </div>
  );
}