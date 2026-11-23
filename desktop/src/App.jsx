import React, { useState, useEffect } from 'react';
import { getAuthToken, setAuthToken, getAdminUser, setAdminUser, api } from './services/api';
import Login from './pages/Login';
import LiveOrders from './pages/LiveOrders';
import MenuManagement from './pages/MenuManagement';
import OrderHistory from './pages/OrderHistory';
import Dashboard from './pages/Dashboard';
import DbErrorScreen from './components/DbErrorScreen';
import {
  UtensilsCrossed,
  LayoutDashboard,
  Clock,
  BookOpen,
  History,
  LogOut,
  UserCheck
} from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(getAuthToken());
  const [adminUser, setAdminUserState] = useState(getAdminUser());
  const [activeTab, setActiveTab] = useState('live'); // 'live', 'menu', 'history', 'dashboard'
  const [dbConnected, setDbConnected] = useState(true);
  const [checkingDb, setCheckingDb] = useState(true);
  const [envPathInfo, setEnvPathInfo] = useState(null);

  // Check DB health and get env info from Electron IPC
  const checkHealth = async () => {
    setCheckingDb(true);
    try {
      if (window.electronAPI && window.electronAPI.getEnvPath) {
        const info = await window.electronAPI.getEnvPath();
        setEnvPathInfo(info);
      }

      const res = await api.getHealth();
      setDbConnected(Boolean(res.dbConnected));
    } catch (err) {
      console.warn('Health check failed:', err);
      // If server is starting or mongo failed
      setDbConnected(false);
    } finally {
      setCheckingDb(false);
    }
  };

  useEffect(() => {
    checkHealth();

    const handleLogout = () => {
      setToken(null);
      setAdminUserState(null);
    };

    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  const handleLoginSuccess = (user) => {
    setToken(getAuthToken());
    setAdminUserState(user);
    setActiveTab('live');
  };

  const handleLogoutClick = () => {
    setAuthToken(null);
    setAdminUser(null);
    setToken(null);
    setAdminUserState(null);
  };

  // If DB connection fails, show clear friendly error screen
  if (!checkingDb && !dbConnected) {
    return <DbErrorScreen onRetry={checkHealth} envPathInfo={envPathInfo} />;
  }

  // If no auth token, redirect to Login
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-title">
            <UtensilsCrossed size={22} color="var(--accent)" />
            <span>CanteenKart</span>
            <span className="brand-badge">PRO</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            <Clock size={18} />
            <span>Live Orders</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            <BookOpen size={18} />
            <span>Menu Catalog</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            <span>Order History</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={14} color="#10b981" />
              <span>Signed in as</span>
            </div>
            <div className="user-name">@{adminUser?.username || 'admin'}</div>
          </div>
          <button className="logout-btn" onClick={handleLogoutClick}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">
            {activeTab === 'live' && 'Live Kitchen Orders'}
            {activeTab === 'menu' && 'Menu Catalog Management'}
            {activeTab === 'history' && 'Past Orders Audit'}
            {activeTab === 'dashboard' && 'Analytics & Sales Dashboard'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span>Backend Connected</span>
          </div>
        </header>

        <section className="page-body">
          {activeTab === 'live' && <LiveOrders />}
          {activeTab === 'menu' && <MenuManagement />}
          {activeTab === 'history' && <OrderHistory />}
          {activeTab === 'dashboard' && <Dashboard />}
        </section>
      </main>
    </div>
  );
}
