import React from 'react';
import { useNavigate } from 'react-router-dom';
import { topics } from '../data/topics';

export default function Sidebar({ activeTopic }) {
  const navigate = useNavigate();
  const solved = JSON.parse(localStorage.getItem('solvedProblems') || '{}');

  const getSolvedCount = (topicId) => {
    return Object.keys(solved).filter(slug =>
      slug.startsWith(topicId) || solved[slug + '_topic'] === topicId
    ).length;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-title">DSA Topics</div>
      {topics.map((topic, i) => {
        const pct = 0;
        return (
          <div
            key={topic.id}
            className={`sidebar-item ${activeTopic === topic.id ? 'active' : ''}`}
            onClick={() => navigate(`/topic/${topic.id}`)}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="sidebar-item-header">
              <span className="sidebar-icon">{topic.icon}</span>
              <span className="sidebar-name">{topic.name}</span>
              <span className={`diff-dot diff-${topic.difficulty.toLowerCase()}`} />
            </div>
            <div className="sidebar-progress-bar">
              <div
                className="sidebar-progress-fill"
                style={{ width: `${pct}%`, background: topic.color }}
              />
            </div>
          </div>
        );
      })}
    </aside>
  );
}