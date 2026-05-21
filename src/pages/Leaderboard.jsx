import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function Leaderboard() {
  const { user } = useAuth();
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBoard(); }, []);

  const fetchBoard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/user/leaderboard`);
      const data = await res.json();
      setBoard(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  const rankBadge = (i) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1 className="leaderboard-title">🏆 Global Leaderboard</h1>
        <p className="leaderboard-sub">Top 50 players ranked by coins</p>
        <button className="btn-outline btn-sm" onClick={fetchBoard}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : board.length === 0 ? (
        <div className="empty-state">
          <p>No players yet. Register and play to appear here!</p>
        </div>
      ) : (
        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Wins</th>
                <th>Games</th>
                <th>Coins 🪙</th>
              </tr>
            </thead>
            <tbody>
              {board.map((player, i) => (
                <tr
                  key={player._id}
                  className={`lb-row
                    ${player.username === user?.username ? 'lb-current' : ''}
                    ${i === 0 ? 'lb-top1' : i === 1 ? 'lb-top2' : i === 2 ? 'lb-top3' : ''}
                  `}
                >
                  <td className="lb-rank">{rankBadge(i)}</td>
                  <td>
                    <div className="lb-player">
                      <span className="lb-avatar">
                        {player.username[0].toUpperCase()}
                      </span>
                      <span className="lb-username">{player.username}</span>
                      {player.username === user?.username && (
                        <span className="lb-you">You</span>
                      )}
                    </div>
                  </td>
                  <td className="lb-wins">{player.wins || 0}</td>
                  <td className="lb-games">{player.gamesPlayed || 0}</td>
                  <td className="lb-points">{player.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}