import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Clock, CheckCircle2, ChevronRight, User, Hash, AlertCircle, RefreshCw } from 'lucide-react';

const COLUMNS = ['New', 'Preparing', 'Ready', 'Served'];

const NEXT_STATUS = {
  New: 'Preparing',
  Preparing: 'Ready',
  Ready: 'Served'
};

export default function LiveOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.getAdminOrders();
      setOrders(data);
      setError('');
    } catch (err) {
      setError(err.data?.message || 'Failed to fetch orders');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvanceStatus = async (orderId, currentStatus) => {
    const nextStatus = NEXT_STATUS[currentStatus];
    if (!nextStatus) return;

    setUpdatingId(orderId);
    try {
      await api.updateOrderStatus(orderId, nextStatus);
      // Immediately reflect state locally
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: nextStatus } : o));
    } catch (err) {
      alert(`Could not update order status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Live Orders Kanban</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Board auto-refreshes every 5 seconds. Advance orders as kitchen progresses.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => fetchOrders()}>
          <RefreshCw size={14} /> Refresh Now
        </button>
      </div>

      {error && (
        <div className="banner banner-error">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {loading && orders.length === 0 ? (
        <div className="empty-state">
          <div className="spinner" style={{ marginBottom: '12px' }} />
          <p>Loading live orders...</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          flex: 1,
          minHeight: '600px',
          alignItems: 'start'
        }}>
          {COLUMNS.map(col => {
            const colOrders = orders.filter(o => o.status === col);
            return (
              <div key={col} style={{
                background: '#f1f5f9',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '500px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid rgba(0,0,0,0.06)'
                }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{col}</span>
                  <span className={`badge badge-${col}`}>{colOrders.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                  {colOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '0.85rem' }}>
                      No orders {col.toLowerCase()}
                    </div>
                  ) : (
                    colOrders.map(order => (
                      <div key={order._id} className="card" style={{ padding: '14px', borderLeft: `4px solid var(--status-${col.toLowerCase()})` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Hash size={16} color="var(--accent)" /> Table {order.tableNumber}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {order.customerName && (
                          <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={13} /> {order.customerName}
                          </div>
                        )}

                        <div style={{
                          background: '#f8fafc',
                          borderRadius: '6px',
                          padding: '8px',
                          marginBottom: '10px',
                          fontSize: '0.82rem'
                        }}>
                          {order.items.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>{it.quantity}x {it.name}</span>
                              <span style={{ color: '#64748b' }}>₹{it.price * it.quantity}</span>
                            </div>
                          ))}
                          <div style={{
                            borderTop: '1px solid #e2e8f0',
                            marginTop: '6px',
                            paddingTop: '6px',
                            fontWeight: 700,
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: 'var(--text-main)'
                          }}>
                            <span>Total</span>
                            <span style={{ color: 'var(--accent)' }}>₹{order.totalAmount}</span>
                          </div>
                        </div>

                        {NEXT_STATUS[col] && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', justifyContent: 'center' }}
                            disabled={updatingId === order._id}
                            onClick={() => handleAdvanceStatus(order._id, col)}
                          >
                            {updatingId === order._id ? (
                              <span className="spinner" style={{ width: '14px', height: '14px' }} />
                            ) : (
                              <>Move to {NEXT_STATUS[col]} <ChevronRight size={14} /></>
                            )}
                          </button>
                        )}
                        {col === 'Served' && (
                          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} /> Order completed
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
