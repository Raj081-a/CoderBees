import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { topics } from '../data/topics';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="home-hero">
          <div className="hero-glow" />
          <h1 className="hero-title">
            Master <span className="gradient-text">Data Structures</span><br />
            & Algorithms
          </h1>
          <p className="hero-sub">
            Voice-guided learning, interactive practice, AI feedback,
            and competitive matches — all in one hive. 🐝
          </p>
          {!user && (
            <div className="hero-cta">
              <button className="btn-primary btn-large" onClick={() => navigate('/register')}>
                Get Started Free
              </button>
              <button className="btn-outline btn-large" onClick={() => navigate('/login')}>
                Sign In
              </button>
            </div>
          )}
        </div>

        <div className="stats-row">
          {[
            { num: '7', label: 'DSA Topics' },
            { num: '250+', label: 'Practice Questions' },
            { num: '⚔️', label: 'Live Matches' },
            { num: '🔊', label: 'Voice Guided' },
          ].map((s, i) => (
            <div className="stat-card" key={i}>
              <span className="stat-num">{s.num}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <h2 className="section-title">Choose Your Topic</h2>
        <div className="topics-grid">
          {topics.map((topic, i) => (
            <div
              key={topic.id}
              className="topic-card"
              style={{ animationDelay: `${i * 0.08}s`, '--accent': topic.color }}
              onClick={() => navigate(`/topic/${topic.id}`)}
            >
              <div className="topic-icon">{topic.icon}</div>
              <h3 className="topic-name">{topic.name}</h3>
              <div className="topic-meta">
                <span className={`difficulty-badge diff-${topic.difficulty.toLowerCase()}`}>
                  {topic.difficulty}
                </span>
                <span className="q-count">{topic.questions} questions</span>
              </div>
              <div className="topic-concepts">
                {topic.concepts.slice(0, 2).map(c => (
                  <span key={c} className="concept-tag">{c}</span>
                ))}
              </div>
              <div className="topic-arrow">→</div>
            </div>
          ))}
        </div>

        <div className="features-section">
          <h2 className="section-title">Everything You Need</h2>
          <div className="features-grid">
            {[
              { icon: '🔊', title: 'Voice Learning', desc: 'Listen to explanations with animated line highlighting' },
              { icon: '📝', title: 'MCQ Practice', desc: '5 questions per topic with instant voice feedback' },
              { icon: '💻', title: 'Code & Compile', desc: 'Write code in C++, Java, Python with AI feedback' },
              { icon: '⚔️', title: 'Multiplayer', desc: 'Challenge opponents in real-time DSA battles' },
              { icon: '🏠', title: 'Quiz Rooms', desc: 'Join live quiz rooms with up to 60 players' },
              { icon: '🏆', title: 'Leaderboard', desc: 'Compete for the top spot globally' },
            ].map((f, i) => (
              <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <h4 className="feature-title">{f.title}</h4>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}