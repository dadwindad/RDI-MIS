import React, { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';
import { db, AuditLog } from '../services/db';

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    db.getAuditLogs().then(setLogs);
  }, []);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Global Audit Trail</h1>
          <p className="page-subtitle">FR-RES-02: Centralized inspection of actions from all Sub-apps and Core UI.</p>
        </div>
        <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} color="var(--accent-color)" />
          <span style={{ fontWeight: 600 }}>{logs.length} Total Events</span>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Clock size={14} />
                    {new Date(log.timestamp).toLocaleString('en-GB')}
                  </div>
                </td>
                <td style={{ fontWeight: 500 }}>{log.user_name}</td>
                <td>
                  <span style={{ 
                    backgroundColor: 'var(--bg-tertiary)', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '0.25rem', 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    color: log.action.includes('DELETE') ? 'var(--status-danger)' : 
                           log.action.includes('CREATE') ? 'var(--status-success)' : 'var(--accent-color)'
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{log.details}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogPage;
