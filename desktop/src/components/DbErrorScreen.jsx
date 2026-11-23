import React from 'react';
import { AlertTriangle, RefreshCw, Folder } from 'lucide-react';

export default function DbErrorScreen({ onRetry, envPathInfo }) {
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '560px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        padding: '36px',
        border: '1px solid #fee2e2'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: '#fee2e2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#dc2626',
          marginBottom: '20px'
        }}>
          <AlertTriangle size={32} />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
          Database Connection Failed
        </h2>

        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '20px' }}>
          The application could not connect to MongoDB Atlas using the configured connection string.
        </p>

        <div style={{
          background: '#f1f5f9',
          borderLeft: '4px solid #e11d48',
          padding: '14px 16px',
          borderRadius: '4px',
          marginBottom: '24px'
        }}>
          <p style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem', marginBottom: '4px' }}>
            Action Required:
          </p>
          <p style={{ fontSize: '0.9rem', color: '#334155' }}>
            <strong>Update MONGODB_URI in .env</strong> with your real MongoDB Atlas connection string and password.
          </p>
        </div>

        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '14px',
          fontSize: '0.85rem',
          color: '#475569',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: 600 }}>
            <Folder size={16} /> Environment Location:
          </div>
          <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: '#0f172a' }}>
            {envPathInfo?.loadedEnvPath || 'Checking configuration paths...'}
          </div>
          {envPathInfo?.overrideDir && (
            <p style={{ marginTop: '8px', fontSize: '0.8rem', color: '#64748b' }}>
              Override path: <code style={{ wordBreak: 'break-all' }}>{envPathInfo.overrideDir}/.env</code>
            </p>
          )}
        </div>

        <button
          onClick={onRetry}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
        >
          <RefreshCw size={18} /> Retry Connection
        </button>
      </div>
    </div>
  );
}
