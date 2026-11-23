import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';

const CATEGORIES = ['Snacks', 'Meals', 'Drinks', 'Desserts'];

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Snacks');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminMenu();
      setMenuItems(data);
      setError('');
    } catch (err) {
      setError(err.data?.message || 'Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setPrice('');
    setCategory('Snacks');
    setImageUrl('');
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setName(item.name);
    setPrice(item.price);
    setCategory(item.category);
    setImageUrl(item.imageUrl || '');
    setDescription(item.description || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormSaving(true);
    try {
      const payload = {
        name,
        price: Number(price),
        category,
        imageUrl,
        description
      };

      if (editingItem) {
        await api.updateMenuItem(editingItem._id, payload);
      } else {
        await api.createMenuItem(payload);
      }
      setShowModal(false);
      fetchMenu();
    } catch (err) {
      alert(err.data?.message || 'Failed to save menu item');
    } finally {
      setFormSaving(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      const updated = await api.updateMenuItem(item._id, { isAvailable: !item.isAvailable });
      setMenuItems(prev => prev.map(it => it._id === item._id ? updated : it));
    } catch (err) {
      alert('Failed to toggle availability: ' + err.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    try {
      await api.deleteMenuItem(item._id);
      setMenuItems(prev => prev.filter(it => it._id !== item._id));
    } catch (err) {
      alert('Failed to delete item: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Menu Catalog Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Manage food & beverage items, prices, categories and kitchen availability.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Add New Item
        </button>
      </div>

      {error && (
        <div className="banner banner-error">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <div className="spinner" style={{ marginBottom: '12px' }} />
          <p>Loading menu items...</p>
        </div>
      ) : menuItems.length === 0 ? (
        <div className="card empty-state">
          <h3>No Menu Items Found</h3>
          <p>Get started by adding items to your menu or run the seed script.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Availability</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map(item => (
                <tr key={item._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '6px' }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.description}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      background: '#f1f5f9',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 500
                    }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{item.price}</td>
                  <td>
                    {item.isAvailable ? (
                      <span style={{ color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} /> Available
                      </span>
                    ) : (
                      <span style={{ color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <X size={14} /> Sold Out
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${item.isAvailable ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => handleToggleAvailability(item)}
                    >
                      {item.isAvailable ? 'Mark Sold Out' : 'Mark Available'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(item)}>
                        <Edit2 size={13} /> Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Masala Chai"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="40"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Short description of the item"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formSaving}>
                  {formSaving ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
