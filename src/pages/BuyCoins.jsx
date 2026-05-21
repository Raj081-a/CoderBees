import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'https://coderbees-backend.onrender.com/api';

const packages = [
  { id: 'starter', name: '🥉 Starter', coins: 100, price: 29, desc: 'Perfect to start' },
  { id: 'pro', name: '🥈 Pro', coins: 300, price: 79, desc: 'Most popular', popular: true },
  { id: 'elite', name: '🥇 Elite', coins: 700, price: 169, desc: 'For serious players' },
  { id: 'legend', name: '👑 Legend', coins: 1500, price: 299, desc: 'Best value' }
];

export default function BuyCoins() {
  const { user, token, updatePoints } = useAuth();
  const [loading, setLoading] = useState(null);
  const [message, setMessage] = useState('');

  const handleBuy = async (pkg) => {
    if (!user) return;
    setLoading(pkg.id);
    setMessage('');
    try {
      const orderRes = await fetch(`${API}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ packageId: pkg.id })
      });
      const orderData = await orderRes.json();

      if (orderData.demo) {
        const verifyRes = await fetch(`${API}/payment/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ packageId: pkg.id, demo: true })
        });
        const vData = await verifyRes.json();
        if (vData.success) {
          updatePoints(vData.newPoints);
          setMessage(`✅ ${pkg.coins} coins added successfully! (Demo Mode)`);
        }
      }
    } catch {
      setMessage('❌ Something went wrong. Try again.');
    }
    setLoading(null);
  };

  return (
    <div className="buy-coins-page">
      <div className="buy-header">
        <h1 className="buy-title">🪙 Buy Coins</h1>
        <p className="buy-sub">Coins are used for Multiplayer Matches only</p>
        {user && (
          <div className="current-coins">
            Current balance: <strong>{user.points} 🪙</strong>
          </div>
        )}
      </div>

      {message && (
        <div className={`payment-msg ${message.startsWith('✅') ? 'msg-ok' : 'msg-fail'}`}>
          {message}
        </div>
      )}

      <div className="packages-grid">
        {packages.map(pkg => (
          <div key={pkg.id}
            className={`package-card ${pkg.popular ? 'package-popular' : ''}`}>
            {pkg.popular && <div className="popular-badge">Most Popular</div>}
            <div className="package-name">{pkg.name}</div>
            <div className="package-coins">
              {pkg.coins.toLocaleString()}
              <span> coins</span>
            </div>
            <div className="package-price">₹{pkg.price}</div>
            <div className="package-desc">{pkg.desc}</div>
            <button
              className="btn-primary"
              onClick={() => handleBuy(pkg)}
              disabled={!user || loading === pkg.id}
            >
              {loading === pkg.id ? 'Processing...' : `Buy for ₹${pkg.price}`}
            </button>
          </div>
        ))}
      </div>

      <div className="payment-note">
        <p>🔒 Currently running in Demo Mode</p>
        <p>Coins will be added instantly without payment</p>
      </div>
    </div>
  );
}