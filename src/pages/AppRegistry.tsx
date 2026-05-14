import React, { useState, useEffect } from 'react';
import { Blocks, Plus, Check, X, ShieldAlert, Edit2, Trash2, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { db, AppRegistry as IAppRegistry, User } from '../services/db';

interface AppRegistryProps {
  currentUser: User;
}

const AppRegistry: React.FC<AppRegistryProps> = ({ currentUser }) => {
  const [apps, setApps] = useState<IAppRegistry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<IAppRegistry>({ app_id: '', name: '', entry_url: '', api_endpoint: '', required_roles: '["admin"]', status: 'Maintenance' });
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const confirmAction = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  };

  const fetchApps = async () => {
    const data = await db.getApps();
    setApps(data);
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate JSON parsing for required_roles
    try {
      JSON.parse(formData.required_roles);
    } catch {
      showToast('Required Roles must be valid JSON array, e.g. ["admin","staff"]', 'error');
      return;
    }

    if (isEditing) {
      const success = await db.updateApp(formData.app_id, formData);
      if (success) {
        setIsModalOpen(false);
        fetchApps();
        showToast('App configured successfully!', 'success');
      } else {
        showToast('Failed to update App.', 'error');
      }
    } else {
      const success = await db.addApp(formData);
      if (success) {
        setIsModalOpen(false);
        fetchApps();
        showToast('App registered successfully!', 'success');
      } else {
        showToast('Failed to register. App ID may exist.', 'error');
      }
    }
  };

  const handleEdit = (app: IAppRegistry) => {
    setFormData(app);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    confirmAction(`Are you sure you want to completely deregister ${id}? This is irreversible.`, async () => {
      const success = await db.deleteApp(id);
      if (success) {
        fetchApps();
        showToast('App deregistered.', 'success');
      } else {
        showToast('Failed to delete.', 'error');
      }
      setConfirmDialog(null);
    });
  };

  const toggleStatus = async (app: IAppRegistry) => {
    const nextStatus = app.status === 'Active' ? 'Maintenance' : 'Active';
    confirmAction(`Change status of ${app.app_id} to ${nextStatus}?`, async () => {
      const success = await db.updateApp(app.app_id, { status: nextStatus });
      if (success) {
        fetchApps();
        showToast(`Status updated to ${nextStatus}`, 'success');
      }
      setConfirmDialog(null);
    });
  };

  const parseRoles = (jsonString: string) => {
    try { 
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } 
    catch { return []; }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">App Registry</h1>
          <p className="page-subtitle">FR-REG-01: Manage and register Micro-Frontend Sub-Apps.</p>
        </div>
        {currentUser.role === 'admin' && (
          <button onClick={() => { setIsEditing(false); setFormData({ app_id: 'org-', name: '', entry_url: '', api_endpoint: '', required_roles: '["admin"]', status: 'Maintenance' }); setIsModalOpen(true); }} style={{ 
            backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', 
            padding: '0.75rem 1.5rem', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem',
            alignItems: 'center', cursor: 'pointer', fontWeight: 600
          }}>
            <Plus size={20} /> Register New App
          </button>
        )}
      </div>

      <div className="dashboard-grid">
        {(apps || []).map(app => (
          <div key={app.app_id} className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Blocks size={20} color={app.status === 'Active' ? "var(--status-success)" : "var(--text-secondary)"} /> {app.name}
              </div>
              <span className={`badge ${app.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                {app.status}
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>App ID</div>
                <div style={{ fontWeight: 500, fontFamily: 'monospace' }}>{app.app_id}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Entry URL</div>
                <div style={{ fontWeight: 500, wordBreak: 'break-all' }}>{app.entry_url}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>API Endpoint</div>
                <div style={{ fontWeight: 500, wordBreak: 'break-all' }}>{app.api_endpoint}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Required Roles</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  {parseRoles(app.required_roles).map(r => (
                    <span key={r} style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                      <ShieldAlert size={12} style={{ display: 'inline', marginRight: '4px' }}/>{r}
                    </span>
                  ))}
                </div>
              </div>
              
              {currentUser.role === 'admin' && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(app)} style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--border-color)', background: 'transparent', borderRadius: '0.25rem', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => toggleStatus(app)} style={{ flex: 1, padding: '0.5rem', border: 'none', background: app.status === 'Active' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: app.status === 'Active' ? 'var(--status-warning)' : 'var(--status-success)', borderRadius: '0.25rem', cursor: 'pointer' }}>
                    {app.status === 'Active' ? 'Set Maintenance' : 'Set Active'}
                  </button>
                  <button onClick={() => handleDelete(app.app_id)} style={{ padding: '0.5rem', color: 'var(--status-danger)', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}><Trash2 size={16}/></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{isEditing ? 'Configure App' : 'Register New App'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>App ID (Must match Sidebar org- id)</label>
                <input type="text" value={formData.app_id} onChange={e => setFormData({...formData, app_id: e.target.value})} disabled={isEditing} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: isEditing ? 'var(--bg-tertiary)' : 'var(--bg-color)' }} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Remote Entry URL (MFE Source)</label>
                <input type="url" placeholder="http://localhost:3002/remoteEntry.js" value={formData.entry_url} onChange={e => setFormData({...formData, entry_url: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>API Endpoint Base</label>
                <input type="url" placeholder="http://localhost:3002" value={formData.api_endpoint} onChange={e => setFormData({...formData, api_endpoint: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Required Roles (JSON Array)</label>
                <input type="text" placeholder='["admin", "manager"]' value={formData.required_roles} onChange={e => setFormData({...formData, required_roles: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Initial Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'Active'|'Maintenance'})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>Save App</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
          backgroundColor: toast.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)',
          color: 'white', padding: '1rem 1.5rem', borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          transform: 'translateY(0)', opacity: 1, transition: 'all 0.3s ease-out'
        }}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontWeight: 500 }}>{toast.message}</span>
        </div>
      )}

      {/* Custom Confirm Dialog */}
      {confirmDialog && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: 'var(--status-warning)' }}>
              <AlertTriangle size={32} />
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Confirmation</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.5, fontSize: '1rem' }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setConfirmDialog(null)} style={{ padding: '0.6rem 1.5rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500, color: 'var(--text-primary)' }}>
                Cancel
              </button>
              <button onClick={confirmDialog.onConfirm} style={{ padding: '0.6rem 1.5rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppRegistry;
