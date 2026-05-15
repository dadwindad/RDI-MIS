import React, { useState, useEffect } from 'react';
import { Plus, UserCheck, UserX, Mail, Building, Trash2, Edit2, X, AlertCircle, Info } from 'lucide-react';
import { db, User } from '../services/db';

interface UserManagementProps {
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    username: '', password: '', name: '', email: '', dept: '', role: 'staff', status: 'Active'
  });
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void }>({
    show: false, title: '', message: '', onConfirm: () => {}
  });
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string }>({
    show: false, title: '', message: ''
  });

  useEffect(() => {
    db.getUsers().then(setUsers);
  }, []);

  const handleDelete = (id: string) => {
    if (id === currentUser.id) {
      setAlertDialog({
        show: true,
        title: "Cannot Delete Yourself",
        message: "For security reasons, you cannot delete your own account while logged in."
      });
      return;
    }
    
    setConfirmDialog({
      show: true,
      title: "Confirm Delete",
      message: "Are you sure you want to delete this user? This action cannot be undone.",
      onConfirm: async () => {
        await db.deleteUser(id);
        db.getUsers().then(setUsers);
      }
    });
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '', name: '', email: '', dept: '', role: 'staff', status: 'Active' });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({ ...user, password: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let result: { success: boolean, error?: string } = { success: false };
    if (editingUser) {
      result = await db.updateUser(editingUser.id, formData);
    } else {
      result = await db.addUser(formData as Omit<User, 'id'>);
    }
    
    if (result.success) {
      setShowModal(false);
      db.getUsers().then(setUsers);
    }
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">FR-MDM-01: Only Admin can add/edit/delete users. Others can only view.</p>
        </div>
        {isAdmin && (
          <button onClick={openAddModal} style={{ 
            backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', 
            padding: '0.75rem 1.5rem', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem',
            alignItems: 'center', cursor: 'pointer', fontWeight: 600
          }}>
            <Plus size={20} /> Add New User
          </button>
        )}
      </div>

      <div className="data-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name & Contact</th>
              <th>Department</th>
              <th>System Role</th>
              <th>Status</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ fontWeight: 500 }}>{user.id}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <Mail size={12} /> {user.email}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Username: {user.username}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building size={16} color="var(--text-secondary)" /> {user.dept}
                  </div>
                </td>
                <td>
                  <span style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem', textTransform: 'capitalize' }}>
                    {user.role}
                  </span>
                </td>
                <td>
                  {user.status === 'Active' ? (
                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><UserCheck size={14}/> Active</span>
                  ) : (
                    <span className="badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><UserX size={14}/> Inactive</span>
                  )}
                </td>
                {isAdmin && (
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEditModal(user)} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Edit2 size={16}/></button>
                      <button onClick={() => handleDelete(user.id)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-danger)', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Username</label>
                  <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Password {editingUser && '(leave blank to keep)'}</label>
                  <input type={editingUser ? "text" : "password"} required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }} />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Full Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Email</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Department</label>
                <input type="text" required value={formData.dept} onChange={e => setFormData({...formData, dept: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }}>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '0.25rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Dialog */}
      {confirmDialog.show && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1.5rem', width: '400px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid var(--border-color)' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <Trash2 size={32} />
            </div>
            <h3 style={{ marginTop: 0, fontSize: '1.25rem' }}>{confirmDialog.title}</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
              <button
                onClick={() => setConfirmDialog({ ...confirmDialog, show: false })}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ ...confirmDialog, show: false });
                }}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Dialog */}
      {alertDialog.show && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1.5rem', width: '400px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid var(--border-color)' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <AlertCircle size={32} />
            </div>
            <h3 style={{ marginTop: 0, fontSize: '1.25rem' }}>{alertDialog.title}</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{alertDialog.message}</p>
            <button
              onClick={() => setAlertDialog({ ...alertDialog, show: false })}
              style={{ width: '100%', marginTop: '2rem', padding: '0.75rem', borderRadius: '0.75rem', border: 'none', backgroundColor: 'var(--accent-color)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
