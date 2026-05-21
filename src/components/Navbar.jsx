import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userLinks = [
    { to: '/', label: '🏠 Home' },
    { to: '/problems', label: '💻 Problems' },
    { to: '/multiplayer', label: '⚔️ Match' },
    { to: '/room', label: '🏠 Room' },
    { to: '/leaderboard', label: '🏆 Leaderboard' },
    { to: '/buy-coins', label: '🪙 Buy Coins' },
  ];

  const adminLinks = [
  { to: '/admin/problems', label: '📝 Problems' },
  { to: '/admin/multiplayer', label: '⚔️ Multiplayer' },
  { to: '/admin/quiz', label: '❓ Quiz Qs' },
  { to: '/admin/leaderboard', label: '🏆 Leaderboard' },
  { to: '/admin/room', label: '🏠 Create Room' },
 ];

  const links = user?.isAdmin ? adminLinks : userLinks;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="brand-link">
          <span className="brand-icon">🐝</span>
          <span className="brand-text">CODER<span className="brand-accent">BEES</span></span>
        </Link>
      </div>

      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="navbar-right">
        {user && (
          <>
            <div className="user-badge">
              <span className="user-avatar">{user.username[0].toUpperCase()}</span>
              <span className="user-name">{user.username}</span>
              {!user.isAdmin && <span className="user-coins">🪙 {user.points}</span>}
              {user.isAdmin && <span className="admin-tag">ADMIN</span>}
            </div>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>

      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '✕' : '☰'}
      </button>
    </nav>
  );
}