import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function AdminLeaderboard() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [newPoints, setNewPoints] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/user/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  const handleUpdatePoints = async (userId) => {
    if (!newPoints || isNaN(newPoints)) {
      setMsg('❌ Enter valid points number');
      return;
    }
    try {
      const res = await fetch(`${API}/user/admin/points/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ points: parseInt(newPoints) })
      });
      const data = await res.json();
      if (data._id) {
        setMsg('✅ Points updated!');
        setEditing(null);
        setNewPoints('');
        fetchUsers();
      }
    } catch {
      setMsg('❌ Update failed');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const rankBadge = (i) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>🏆 Manage Leaderboard</h1>
          <p>View all users and edit their coin balance</p>
        </div>
        <button className="btn-outline" onClick={fetchUsers}>
          🔄 Refresh
        </button>
      </div>

      {msg && (
        <div className={`admin-msg ${msg.startsWith('✅') ? 'msg-ok' : 'msg-fail'}`}>
          {msg}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Loading users...</div>
      ) : (
        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Email</th>
                <th>Wins</th>
                <th>Games</th>
                <th>Coins 🪙</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u._id} className="lb-row">
                  <td className="lb-rank">{rankBadge(i)}</td>
                  <td>
                    <div className="lb-player">
                      <span className="lb-avatar">
                        {u.username[0].toUpperCase()}
                      </span>
                      <div>
                        <div className="lb-username">{u.username}</div>
                        <div style={{ fontSize: '11px', color: '#8888aa' }}>
                          {u.isAdmin ? '👑 Admin' : 'User'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '13px', color: '#8888aa' }}>{u.email}</td>
                  <td className="lb-wins">{u.wins || 0}</td>
                  <td className="lb-games">{u.gamesPlayed || 0}</td>
                  <td className="lb-points">
                    {editing === u._id ? (
                      <input
                        className="form-input"
                        style={{ width: '80px', padding: '4px 8px', fontSize: '14px' }}
                        value={newPoints}
                        onChange={e => setNewPoints(e.target.value)}
                        type="number"
                        autoFocus
                      />
                    ) : (
                      u.points
                    )}
                  </td>
                  <td>
                    {editing === u._id ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-sm btn-primary"
                          onClick={() => handleUpdatePoints(u._id)}>
                          Save
                        </button>
                        <button className="btn-sm btn-outline"
                          onClick={() => { setEditing(null); setNewPoints(''); }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button className="btn-sm btn-outline"
                        onClick={() => { setEditing(u._id); setNewPoints(String(u.points)); }}>
                        ✏️ Edit Coins
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}