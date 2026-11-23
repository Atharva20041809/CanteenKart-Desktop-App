import React, { useState } from 'react';
import { api, setAuthToken, setAdminUser } from '../services/api';
import { Lock, User, AlertCircle, UtensilsCrossed } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login(username, password);
      setAuthToken(res.token);
      setAdminUser(res.admin);
      onLoginSuccess(res.admin);
    } catch (err) {
      setError(err.data?.message || err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '12px',
        padding: '36px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            marginBottom: '12px'
          }}>
            <UtensilsCrossed size={28} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>CanteenKart</h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px' }}>
            Desktop Admin Management Portal
          </p>
        </div>

        {error && (
          <div className="banner banner-error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} /> Username
            </label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={15} /> Password
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '0.95rem' }}
          >
            {loading ? <span className="spinner" style={{ width: '18px', height: '18px' }} /> : 'Sign In to Dashboard'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
          Default seed: <code>admin</code> / <code>demo_admin_password</code>
        </div>
      </div>
    </div>
  );
}
