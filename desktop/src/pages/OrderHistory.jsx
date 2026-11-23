import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Filter, Calendar, AlertCircle } from 'lucide-react';

const STATUS_OPTIONS = ['All', 'New', 'Preparing', 'Ready', 'Served'];

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;

      const data = await api.getAdminOrders(params);
      setOrders(data);
      setError('');
    } catch (err) {
      setError(err.data?.message || 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, dateFilter]);

  const resetFilters = () => {
    setStatusFilter('All');
    setDateFilter('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Order History & Audit</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Browse and filter all past customer orders by date and completion status.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter Status:</span>
          <select
            className="form-select"
            style={{ width: '140px', padding: '6px 10px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter Date:</span>
          <input
            type="date"
            className="form-input"
            style={{ width: '160px', padding: '6px 10px' }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        {(statusFilter !== 'All' || dateFilter) && (
          <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {error && (
        <div className="banner banner-error">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <div className="spinner" style={{ marginBottom: '12px' }} />
          <p>Loading order history...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="card empty-state">
          <h3>No Orders Found</h3>
          <p>No orders match the selected filters.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Table</th>
                <th>Customer</th>
                <th>Date & Time</th>
                <th>Items Ordered</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>
                    #{order._id.substring(order._id.length - 6)}
                  </td>
                  <td style={{ fontWeight: 700 }}>Table {order.tableNumber}</td>
                  <td>{order.customerName || <span style={{ color: '#94a3b8' }}>Guest</span>}</td>
                  <td>
                    <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      {order.items.map((it, idx) => (
                        <span key={idx}>
                          {it.quantity}x {it.name}
                          {idx < order.items.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{order.totalAmount}</td>
                  <td>
                    <span className={`badge badge-${order.status}`}>{order.status}</span>
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
