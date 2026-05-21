import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { topics } from '../data/topics';

export default function TopicPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [speaking, setSpeaking] = useState(false);
  const [currentLine, setCurrentLine] = useState(-1);
  const lineTimersRef = useRef([]);

  const topicIndex = topics.findIndex(t => t.id === topicId);
  const topic = topics[topicIndex];

  useEffect(() => {
    return () => stopSpeaking();
  }, [topicId]);

  if (!topic) return <div className="error-page">Topic not found</div>;

  const lines = topic.explanation.split('\n').filter(l => l.trim());

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    lineTimersRef.current.forEach(clearTimeout);
    lineTimersRef.current = [];
    setSpeaking(false);
    setCurrentLine(-1);
  };

  const startSpeaking = () => {
    stopSpeaking();
    setSpeaking(true);
    const fullText = lines.join('. ');
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const avgCharsPerSec = 12;
    let elapsed = 0;
    lines.forEach((line, i) => {
      const delay = elapsed * 1000;
      const t = setTimeout(() => setCurrentLine(i), delay);
      lineTimersRef.current.push(t);
      elapsed += line.length / avgCharsPerSec;
    });

    utterance.onend = () => { setSpeaking(false); setCurrentLine(-1); };
    utterance.onerror = () => { setSpeaking(false); setCurrentLine(-1); };
    window.speechSynthesis.speak(utterance);
  };

  const prevTopic = topicIndex > 0 ? topics[topicIndex - 1] : null;
  const nextTopic = topicIndex < topics.length - 1 ? topics[topicIndex + 1] : null;

  return (
    <div className="layout">
      <Sidebar activeTopic={topicId} />
      <main className="main-content">
        <div className="topic-header" style={{ '--accent': topic.color }}>
          <div className="topic-header-icon">{topic.icon}</div>
          <div className="topic-header-info">
            <h1 className="topic-header-title">{topic.name}</h1>
            <div className="topic-header-meta">
              <span className={`difficulty-badge diff-${topic.difficulty.toLowerCase()}`}>
                {topic.difficulty}
              </span>
              <span className="q-count">{topic.questions} questions</span>
              {topic.concepts.map(c => (
                <span key={c} className="concept-tag">{c}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="voice-controls">
          {!speaking ? (
            <button className="btn-voice" onClick={startSpeaking}>
              <span>🔊</span> Listen to Explanation
            </button>
          ) : (
            <button className="btn-voice btn-voice-stop" onClick={stopSpeaking}>
              <span>⏹</span> Stop
              <span className="speaking-indicator">
                <span /><span /><span /><span />
              </span>
            </button>
          )}
        </div>

        <div className="explanation-card">
          {lines.map((line, i) => (
            <p
              key={i}
              className={`explanation-line
                ${currentLine === i ? 'line-active' : ''}
                ${currentLine > i ? 'line-done' : ''}
              `}
            >
              {line}
            </p>
          ))}
        </div>

        <div className="topic-nav">
          {prevTopic ? (
            <button className="btn-outline"
              onClick={() => navigate(`/topic/${prevTopic.id}`)}>
              ← {prevTopic.icon} {prevTopic.name}
            </button>
          ) : <div />}

          <button className="btn-primary btn-large"
            onClick={() => navigate(`/practice/${topicId}`)}>
            Start Practice →
          </button>

          {nextTopic ? (
            <button className="btn-outline"
              onClick={() => navigate(`/topic/${nextTopic.id}`)}>
              {nextTopic.icon} {nextTopic.name} →
            </button>
          ) : <div />}
        </div>
      </main>
    </div>
  );
}