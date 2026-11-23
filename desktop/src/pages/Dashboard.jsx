import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ShoppingBag, DollarSign, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

const STATUS_COLORS = {
  New: '#3b82f6',
  Preparing: '#f59e0b',
  Ready: '#10b981',
  Served: '#64748b'
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getStats();
      setStats(data);
      setError('');
    } catch (err) {
      setError(err.data?.message || 'Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Management Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Daily revenue metrics and real-time kitchen status distribution.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchStats}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="banner banner-error">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {loading && !stats ? (
        <div className="empty-state">
          <div className="spinner" style={{ marginBottom: '12px' }} />
          <p>Calculating sales and order statistics...</p>
        </div>
      ) : stats ? (
        <div>
          {/* Metric KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                background: '#e0f2fe',
                color: '#0284c7',
                padding: '14px',
                borderRadius: '10px'
              }}>
                <ShoppingBag size={28} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Today's Orders</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {stats.todayOrderCount}
                </div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                background: '#dcfce7',
                color: '#16a34a',
                padding: '14px',
                borderRadius: '10px'
              }}>
                <DollarSign size={28} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Today's Sales Revenue</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  ₹{stats.todayTotalSales.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                background: '#fae8ff',
                color: '#a855f7',
                padding: '14px',
                borderRadius: '10px'
              }}>
                <TrendingUp size={28} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Avg. Order Value</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  ₹{stats.todayOrderCount > 0 ? Math.round(stats.todayTotalSales / stats.todayOrderCount) : 0}
                </div>
              </div>
            </div>
          </div>

          {/* Recharts status distribution chart */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Orders by Status</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Current distribution of all incoming and fulfilled orders across workflow stages.
            </p>

            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.ordersPerStatus} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="status" stroke="#94a3b8" />
                  <YAxis allowDecimals={false} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(value) => [`${value} orders`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats.ordersPerStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#e11d48'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
