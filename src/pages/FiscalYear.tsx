import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, Lock, CheckCircle, Clock, X, Edit2, Trash2, AlertCircle, AlertTriangle } from 'lucide-react';
import { db, FiscalYear as IFiscalYear, User } from '../services/db';

interface FiscalYearProps {
  currentUser: User;
}

const FiscalYear: React.FC<FiscalYearProps> = ({ currentUser }) => {
  const [years, setYears] = useState<IFiscalYear[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<IFiscalYear>({ year: '', start_date: '', end_date: '', state: 'Planning', desc: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const confirmAction = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  };

  const fetchYears = async () => {
    const data = await db.getFiscalYears();
    setYears(data);
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      const success = await db.updateFiscalYear(formData.year, formData);
      if (success) {
        setIsModalOpen(false);
        setIsEditing(false);
        setFormData({ year: '', start_date: '', end_date: '', state: 'Planning', desc: '' });
        fetchYears();
        showToast('Fiscal Year updated successfully!', 'success');
      } else {
        showToast('Failed to update Fiscal Year.', 'error');
      }
    } else {
      const success = await db.addFiscalYear(formData);
      if (success) {
        setIsModalOpen(false);
        setFormData({ year: '', start_date: '', end_date: '', state: 'Planning', desc: '' });
        fetchYears();
        showToast('New Fiscal Year created successfully!', 'success');
      } else {
        showToast('Failed to save. Year may already exist.', 'error');
      }
    }
  };

  const handleEdit = (fy: IFiscalYear) => {
    setFormData(fy);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (year: string) => {
    confirmAction(`Are you sure you want to delete Fiscal Year ${year}? This action will hide it from the system.`, async () => {
      const success = await db.deleteFiscalYear(year);
      if (success) {
        fetchYears();
        showToast(`Fiscal Year ${year} deleted.`, 'success');
      } else {
        showToast('Failed to delete.', 'error');
      }
      setConfirmDialog(null);
    });
  };

  const handleStateCycle = (year: string, currentState: string) => {
    const nextStateMap: Record<string, string> = {
      'Planning': 'Active',
      'Active': 'Archived',
      'Archived': 'Planning'
    };
    const nextState = nextStateMap[currentState];
    
    if (nextState === 'Active') {
      confirmAction(`Are you sure you want to activate ${year}? This will automatically archive the currently active year.`, async () => {
        const success = await db.updateFiscalYearState(year, nextState);
        if (success) {
          fetchYears();
          showToast(`Fiscal Year ${year} is now Active.`, 'success');
        }
        setConfirmDialog(null);
      });
    } else {
      confirmAction(`Change state of Fiscal Year ${year} to ${nextState}?`, async () => {
        const success = await db.updateFiscalYearState(year, nextState);
        if (success) {
          fetchYears();
          showToast(`State changed to ${nextState}.`, 'success');
        }
        setConfirmDialog(null);
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    if (dateString.includes(' ') || dateString.includes('ต.ค.') || dateString.includes('ก.ย.')) return dateString;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const y = e.target.value;
    setFormData(prev => {
      const newData = { ...prev, year: y };
      if (y.length === 4) {
        const gregorianYear = parseInt(y) - 543;
        if (!isNaN(gregorianYear)) {
          newData.start_date = `${gregorianYear - 1}-10-01`;
          newData.end_date = `${gregorianYear}-09-30`;
        }
      }
      return newData;
    });
  };

  const getStateColor = (state: string) => {
    switch(state) {
      case 'Planning': return 'var(--status-warning)';
      case 'Active': return 'var(--status-success)';
      case 'Archived': return 'var(--text-secondary)';
      default: return 'var(--text-primary)';
    }
  };

  const getStateIcon = (state: string) => {
    switch(state) {
      case 'Planning': return <Clock size={16} />;
      case 'Active': return <CheckCircle size={16} />;
      case 'Archived': return <Lock size={16} />;
      default: return null;
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Fiscal Year Management</h1>
          <p className="page-subtitle">FR-MDM-02: Manage fiscal years and broadcast state to sub-apps.</p>
        </div>
        {currentUser.role === 'admin' && (
          <button onClick={() => { setIsEditing(false); setFormData({ year: '', start_date: '', end_date: '', state: 'Planning', desc: '' }); setIsModalOpen(true); }} style={{ 
            backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', 
            padding: '0.75rem 1.5rem', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem',
            alignItems: 'center', cursor: 'pointer', fontWeight: 600
          }}>
            <Plus size={20} /> New Fiscal Year
          </button>
        )}
      </div>

      <div className="data-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Period</th>
              <th>State</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {years.map(y => (
              <tr key={y.year}>
                <td style={{ fontWeight: 600, fontSize: '1.125rem' }}>{y.year}</td>
                <td>{formatDate(y.start_date)} - {formatDate(y.end_date)}</td>
                <td>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    color: getStateColor(y.state), backgroundColor: 'var(--bg-tertiary)',
                    padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: 500
                  }}>
                    {getStateIcon(y.state)} {y.state}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{y.desc}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleStateCycle(y.year, y.state)} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '0.25rem', cursor: 'pointer' }}>
                      Cycle State
                    </button>
                    {currentUser.role === 'admin' && (
                      <>
                        <button onClick={() => handleEdit(y)} style={{ padding: '0.25rem', color: 'var(--accent-color)', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '0.25rem', cursor: 'pointer' }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(y.year)} style={{ padding: '0.25rem', color: 'var(--status-danger)', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '0.25rem', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {years.length === 0 && (
              <tr><td colSpan={5} style={{textAlign:'center', padding: '2rem'}}>No Fiscal Years found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{isEditing ? 'Edit Fiscal Year' : 'Add New Fiscal Year'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Year (e.g. 2569)</label>
                <input type="text" placeholder="พ.ศ." value={formData.year} onChange={handleYearChange} disabled={isEditing} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: isEditing ? 'var(--bg-tertiary)' : 'var(--bg-color)' }} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Start Date</label>
                  <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>End Date</label>
                  <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Initial State</label>
                <select value={formData.state} onChange={e => setFormData({...formData, state: e.target.value as 'Planning'|'Active'|'Archived'})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                  <option value="Planning">Planning</option>
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Description</label>
                <textarea value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', resize: 'vertical', minHeight: '80px' }} required />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>Save Fiscal Year</button>
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

export default FiscalYear;
