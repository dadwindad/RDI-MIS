import React, { useState, useEffect } from 'react';
import { Clock, Tag, User, Filter, Search, ChevronDown, Plus, X, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import './Calendar.css';

const KanbanBoard = ({ currentUser }) => {
  const [boardData, setBoardData] = useState({
    PENDING: [],
    IN_PROGRESS: [],
    WAITING_SIGN: [],
    COMPLETED: []
  });
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newDoc, setNewDoc] = useState({
    doc_no: '',
    title: '',
    type: 'รับ',
    fiscal_year: '2569',
    due_date: '',
    confidential_level: 'ปกติ',
    assignee_core_user_ids: '[]'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [movingCardId, setMovingCardId] = useState(null);
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: '', type: 'info' });
  const [confirmInfo, setConfirmInfo] = useState({ isOpen: false, message: '', onConfirm: null });

  const showAlert = (message, type = 'info') => {
    setAlertInfo({ isOpen: true, message, type });
  };
  const [filters, setFilters] = useState({
    type: 'all',
    confidential_level: 'all',
    fiscal_year: 'all'
  });
  const [availableUsers, setAvailableUsers] = useState([]);

  const generateMockToken = () => {
    const userStr = localStorage.getItem('ricp_current_user');
    const user = userStr ? JSON.parse(userStr) : { id: 'user-1', name: 'Unknown', role: 'staff' };
    // Support UTF-8 characters (like Thai) in btoa
    const jsonStr = JSON.stringify(user);
    const payload = btoa(unescape(encodeURIComponent(jsonStr)));
    return `dummyHeader.${payload}.dummySignature`;
  };

  const fetchBoardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3803/api/smart-office/documents/board', {
        headers: {
          'Authorization': `Bearer ${generateMockToken()}`
        }
      });
      const data = await response.json();
      setBoardData(data);
    } catch (error) {
      console.error('Failed to fetch board data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3801/api/users');
      const data = await res.json();
      // Filter only manager and staff as per user request
      const filtered = data.filter(u => u.role === 'manager' || u.role === 'staff');
      setAvailableUsers(filtered);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  };

  useEffect(() => {
    fetchBoardData();
    fetchUsers();
  }, []);

  const handleDragStart = (e, cardId, sourceStatus) => {
    e.dataTransfer.setData('cardId', cardId);
    e.dataTransfer.setData('sourceStatus', sourceStatus);
  };

  const handleDrop = async (e, targetStatus) => {
    const cardId = e.dataTransfer.getData('cardId');
    const sourceStatus = e.dataTransfer.getData('sourceStatus');

    if (sourceStatus === targetStatus) return;

    // Role-Based Access Control check on Frontend
    const userRole = currentUser?.role || 'staff';

    if (userRole === 'executive') {
      if (sourceStatus !== 'WAITING_SIGN' || targetStatus !== 'COMPLETED') {
        showAlert('ผู้บริหารสามารถอนุมัติเอกสารได้เท่านั้น (ลากจาก รอผู้บริหารลงนาม -> เสร็จสิ้น)', 'warning');
        return;
      }
    } else if (userRole === 'admin' || userRole === 'staff') {
      if (targetStatus === 'COMPLETED') {
        showAlert('เฉพาะผู้บริหารเท่านั้นที่สามารถอนุมัติเอกสารได้', 'warning');
        return;
      }
    } else {
      showAlert('คุณไม่มีสิทธิ์ในการเปลี่ยนสถานะเอกสาร', 'error');
      return;
    }

    setMovingCardId(cardId);

    try {
      const response = await fetch(`http://localhost:3803/api/smart-office/documents/${cardId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${generateMockToken()}`
        },
        body: JSON.stringify({ new_status: targetStatus })
      });

      if (response.ok) {
        fetchBoardData();
      } else {
        const text = await response.text();
        let message = text;
        try {
          const json = JSON.parse(text);
          if (json.error) message = json.error;
        } catch (e) { }

        // Translate common errors
        if (message.includes('Invalid state transition')) {
          message = 'ไม่สามารถย้ายสถานะข้ามขั้นได้ กรุณาย้ายตามลำดับ';
        }

        showAlert(message, 'error');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setMovingCardId(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const getConfidentialColor = (level) => {
    switch (level) {
      case 'ลับ': return '#ef4444';
      case 'ลับมาก': return '#dc2626';
      case 'ปกติ': return '#10b981';
      default: return 'var(--text-secondary)';
    }
  };

  const columns = [
    { id: 'PENDING', title: 'รอรับเรื่อง' },
    { id: 'IN_PROGRESS', title: 'กำลังดำเนินการ' },
    { id: 'WAITING_SIGN', title: 'รอผู้บริหารลงนาม' },
    { id: 'COMPLETED', title: 'เสร็จสิ้น' }
  ];

  const getAssigneeName = (userId) => {
    // Check current user from localStorage
    const savedUser = localStorage.getItem('ricp_current_user');
    if (savedUser) {
      try {
        const currUser = JSON.parse(savedUser);
        if (String(userId) === String(currUser.id)) return currUser.name;
      } catch (e) {
        console.error('Failed to parse current user', e);
      }
    }
    
    if (userId === 'user-1') return 'เจ้าหน้าที่ ธุรการ'; // Fallback for mock user
    const user = availableUsers.find(u => String(u.id) === String(userId) || String(u.core_user_id) === String(userId));
    return user ? user.name || user.display_name : 'ไม่ระบุ';
  };

  const getAssigneesNames = (idsJson) => {
    try {
      const ids = JSON.parse(idsJson);
      if (!Array.isArray(ids) || ids.length === 0) return 'ไม่ระบุ';
      return ids.map(id => getAssigneeName(id)).join(', ');
    } catch (e) {
      return 'ไม่ระบุ';
    }
  };

  return (
    <div className="calendar-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem' }}>


      {/* Filters */}
      <div className="calendar-toolbar" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', width: '100%' }}>
          {/* ส่วนตัวกรอง (ชิดซ้าย) */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>ตัวกรอง:</span>
            </div>

            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              style={{ padding: '0.375rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
            >
              <option value="all">ทุกประเภท</option>
              <option value="รับ">หนังสือรับ</option>
              <option value="ส่ง">หนังสือส่ง</option>
              <option value="เวียน">หนังสือเวียน</option>
            </select>

            <select
              value={filters.confidential_level}
              onChange={(e) => setFilters({ ...filters, confidential_level: e.target.value })}
              style={{ padding: '0.375rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
            >
              <option value="all">ทุกระดับความลับ</option>
              <option value="ปกติ">ปกติ</option>
              <option value="ลับ">ลับ</option>
              <option value="ลับมาก">ลับมาก</option>
            </select>
          </div>

          {/* ส่วนสร้างงาน (ชิดขวา) */}
          <button
            onClick={() => setIsCreating(true)}
            className="calendar-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Plus size={16} />
            <span>สร้างงาน</span>
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>กำลังโหลดข้อมูล...</div>
      )}

      <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 160px)', overflowX: 'auto', paddingBottom: '1rem' }}>
        {columns.map(col => {
          const cards = boardData[col.id] || [];
          const filteredCards = cards.filter(doc => {
            const matchType = filters.type === 'all' || doc.type === filters.type;
            const matchConf = filters.confidential_level === 'all' || doc.confidential_level === filters.confidential_level;
            return matchType && matchConf;
          });

          return (
            <div
              key={col.id}
              onDrop={(e) => handleDrop(e, col.id)}
              onDragOver={handleDragOver}
              style={{
                flex: '1',
                minWidth: '300px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                border: '1px solid var(--border-color)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{col.title}</h3>
                <span style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid var(--border-color)'
                }}>
                  {filteredCards.length}
                </span>
              </div>

              <div style={{ flex: '1', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredCards.map(doc => {
                  const isDraggable = col.id !== 'COMPLETED' || currentUser?.role === 'admin';

                  return (
                    <div
                      key={doc.id}
                      draggable={isDraggable}
                      onDragStart={(e) => handleDragStart(e, doc.id, col.id)}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '0.375rem',
                        padding: '0.75rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        cursor: isDraggable ? 'grab' : 'not-allowed',
                        border: '1px solid var(--border-color)',
                        opacity: movingCardId === doc.id ? 0.5 : 1,
                        position: 'relative',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (isDraggable) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isDraggable) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                        }
                      }}
                    >
                      {movingCardId === doc.id && (
                        <div style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0', backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.375rem' }}>
                          <div className="loader" style={{ width: '20px', height: '20px' }}></div>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {doc.doc_no}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{
                            backgroundColor: `${getConfidentialColor(doc.confidential_level)}20`,
                            color: getConfidentialColor(doc.confidential_level),
                            padding: '0.1rem 0.375rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }}>
                            {doc.confidential_level}
                          </span>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setEditingDoc(doc); 
                              setIsEditing(true); 
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                            title="แก้ไขการ์ด"
                          >
                            <Edit2 size={12} style={{ color: 'var(--text-secondary)' }} />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setConfirmInfo({
                                isOpen: true,
                                message: `คุณแน่ใจหรือไม่ว่าต้องการลบการ์ดงาน "${doc.title}"?`,
                                onConfirm: async () => {
                                  try {
                                    const response = await fetch(`http://localhost:3803/api/documents/${doc.id}`, {
                                      method: 'DELETE',
                                      headers: {
                                        'Authorization': `Bearer ${generateMockToken()}`
                                      }
                                    });
                                    if (response.ok) {
                                      fetchBoardData();
                                      showAlert('ลบการ์ดงานสำเร็จ', 'info');
                                    } else {
                                      const text = await response.text();
                                      showAlert(`เกิดข้อผิดพลาด: ${text}`, 'error');
                                    }
                                  } catch (error) {
                                    console.error('Failed to delete document:', error);
                                    showAlert(`Failed to delete document: ${error.message}`, 'error');
                                  }
                                }
                              });
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                            title="ลบการ์ด"
                          >
                            <Trash2 size={12} style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        {doc.title}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} />
                          <span>สร้างเมื่อ: {doc.created_at ? new Date(doc.created_at).toLocaleDateString('th-TH') : 'ไม่ระบุ'}</span>
                        </div>
                        {doc.received_at && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} style={{ color: '#10b981' }} />
                            <span>รับงาน: {new Date(doc.received_at).toLocaleDateString('th-TH')}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <User size={12} />
                          <span>สร้างโดย: {getAssigneeName(doc.created_by_core_user_id)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                          <User size={12} style={{ color: '#3b82f6' }} />
                          <span>มอบให้: {getAssigneesNames(doc.assignee_core_user_ids)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <Clock size={12} style={{ color: '#ef4444' }} />
                          <span>ครบกำหนด: {doc.due_date ? new Date(doc.due_date).toLocaleDateString('th-TH') : 'ไม่มีกำหนด'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="calendar-modal-overlay" style={{ zIndex: 1000 }}>
          <div className="calendar-modal" style={{ maxWidth: '500px' }}>
            <div className="calendar-modal-header">
              <h3 className="calendar-title">สร้างงาน / ลงทะเบียนเอกสาร</h3>
              <button onClick={() => setIsCreating(false)} className="calendar-icon-btn">
                <X size={20} />
              </button>
            </div>
            <div className="calendar-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="calendar-form-group">
                <label className="calendar-form-label">เลขที่หนังสือ</label>
                <input
                  type="text"
                  className="calendar-form-input"
                  value={newDoc.doc_no}
                  onChange={(e) => setNewDoc({ ...newDoc, doc_no: e.target.value })}
                  placeholder="เช่น อว 1234/56"
                />
              </div>
              <div className="calendar-form-group">
                <label className="calendar-form-label">หัวเรื่อง</label>
                <input
                  type="text"
                  className="calendar-form-input"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  placeholder="กรอกหัวเรื่อง"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="calendar-form-group" style={{ flex: 1 }}>
                  <label className="calendar-form-label">ประเภท</label>
                  <select
                    className="calendar-form-input"
                    value={newDoc.type}
                    onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}
                  >
                    <option value="รับ">หนังสือรับ</option>
                    <option value="ส่ง">หนังสือส่ง</option>
                    <option value="เวียน">หนังสือเวียน</option>
                  </select>
                </div>
                <div className="calendar-form-group" style={{ flex: 1 }}>
                  <label className="calendar-form-label">ระดับความลับ</label>
                  <select
                    className="calendar-form-input"
                    value={newDoc.confidential_level}
                    onChange={(e) => setNewDoc({ ...newDoc, confidential_level: e.target.value })}
                  >
                    <option value="ปกติ">ปกติ</option>
                    <option value="ลับ">ลับ</option>
                    <option value="ลับมาก">ลับมาก</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="calendar-form-group" style={{ flex: 1 }}>
                  <label className="calendar-form-label">ปีงบประมาณ</label>
                  <input
                    type="text"
                    className="calendar-form-input"
                    value={newDoc.fiscal_year}
                    onChange={(e) => setNewDoc({ ...newDoc, fiscal_year: e.target.value })}
                  />
                </div>
                <div className="calendar-form-group" style={{ flex: 1 }}>
                  <label className="calendar-form-label">วันครบกำหนด</label>
                  <input
                    type="date"
                    className="calendar-form-input"
                    value={newDoc.due_date}
                    onChange={(e) => setNewDoc({ ...newDoc, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="calendar-form-group">
                <label className="calendar-form-label">มอบหมายให้ (เลือกได้มากกว่า 1 คน)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '0.25rem' }}>
                  {availableUsers.map(user => (
                    <label key={user.id || user.core_user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <input
                        type="checkbox"
                        checked={newDoc.assignee_core_user_ids ? JSON.parse(newDoc.assignee_core_user_ids).map(String).includes(String(user.id || user.core_user_id)) : false}
                        onChange={(e) => {
                          const currentIds = newDoc.assignee_core_user_ids ? JSON.parse(newDoc.assignee_core_user_ids).map(String) : [];
                          const userId = String(user.id || user.core_user_id);
                          let newIds = [];
                          if (e.target.checked) {
                            newIds = [...currentIds, userId];
                          } else {
                            newIds = currentIds.filter(id => String(id) !== userId);
                          }
                          setNewDoc({ ...newDoc, assignee_core_user_ids: JSON.stringify(newIds) });
                        }}
                      />
                      <span>{user.name || user.display_name} ({user.role})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="calendar-modal-footer">
              <button onClick={() => setIsCreating(false)} className="calendar-btn-secondary">
                ยกเลิก
              </button>
              <button
                onClick={async () => {
                  if (!newDoc.doc_no || !newDoc.title) {
                    showAlert('กรุณากรอกเลขที่หนังสือและหัวเรื่อง', 'warning');
                    return;
                  }
                  try {
                    const response = await fetch('http://localhost:3803/api/documents', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${generateMockToken()}`
                      },
                      body: JSON.stringify(newDoc)
                    });
                    if (response.ok) {
                      setIsCreating(false);
                      setNewDoc({ doc_no: '', title: '', type: 'รับ', fiscal_year: '2569', due_date: '', confidential_level: 'ปกติ' });
                      fetchBoardData();
                    } else {
                      const text = await response.text();
                      showAlert(`เกิดข้อผิดพลาด: ${text}`, 'error');
                    }
                  } catch (error) {
                    console.error('Failed to create document:', error);
                    alert(`Failed to create document: ${error.message}`);
                  }
                }}
                className="calendar-btn-primary"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && editingDoc && (
        <div className="calendar-modal-overlay" style={{ zIndex: 1000 }}>
          <div className="calendar-modal" style={{ maxWidth: '500px' }}>
            <div className="calendar-modal-header">
              <h3 className="calendar-title">แก้ไขการ์ดงาน</h3>
              <button onClick={() => { setIsEditing(false); setEditingDoc(null); }} className="calendar-icon-btn">
                <X size={20} />
              </button>
            </div>
            <div className="calendar-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="calendar-form-group">
                <label className="calendar-form-label">เลขที่หนังสือ</label>
                <input
                  type="text"
                  className="calendar-form-input"
                  value={editingDoc.doc_no}
                  onChange={(e) => setEditingDoc({ ...editingDoc, doc_no: e.target.value })}
                  placeholder="เช่น อว 1234/56"
                />
              </div>
              <div className="calendar-form-group">
                <label className="calendar-form-label">หัวเรื่อง</label>
                <input
                  type="text"
                  className="calendar-form-input"
                  value={editingDoc.title}
                  onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  placeholder="กรอกหัวเรื่อง"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="calendar-form-group" style={{ flex: 1 }}>
                  <label className="calendar-form-label">ประเภท</label>
                  <select
                    className="calendar-form-input"
                    value={editingDoc.type}
                    onChange={(e) => setEditingDoc({ ...editingDoc, type: e.target.value })}
                  >
                    <option value="รับ">หนังสือรับ</option>
                    <option value="ส่ง">หนังสือส่ง</option>
                    <option value="เวียน">หนังสือเวียน</option>
                  </select>
                </div>
                <div className="calendar-form-group" style={{ flex: 1 }}>
                  <label className="calendar-form-label">ระดับความลับ</label>
                  <select
                    className="calendar-form-input"
                    value={editingDoc.confidential_level}
                    onChange={(e) => setEditingDoc({ ...editingDoc, confidential_level: e.target.value })}
                  >
                    <option value="ปกติ">ปกติ</option>
                    <option value="ลับ">ลับ</option>
                    <option value="ลับมาก">ลับมาก</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="calendar-form-group" style={{ flex: 1 }}>
                  <label className="calendar-form-label">ปีงบประมาณ</label>
                  <input
                    type="text"
                    className="calendar-form-input"
                    value={editingDoc.fiscal_year}
                    onChange={(e) => setEditingDoc({ ...editingDoc, fiscal_year: e.target.value })}
                  />
                </div>
                <div className="calendar-form-group" style={{ flex: 1 }}>
                  <label className="calendar-form-label">วันครบกำหนด</label>
                  <input
                    type="date"
                    className="calendar-form-input"
                    value={editingDoc.due_date ? editingDoc.due_date.substring(0, 10) : ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="calendar-form-group">
                <label className="calendar-form-label">มอบหมายให้ (เลือกได้มากกว่า 1 คน)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '0.25rem' }}>
                  {availableUsers.map(user => (
                    <label key={user.id || user.core_user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <input
                        type="checkbox"
                        checked={editingDoc.assignee_core_user_ids ? JSON.parse(editingDoc.assignee_core_user_ids).map(String).includes(String(user.id || user.core_user_id)) : false}
                        onChange={(e) => {
                          const currentIds = editingDoc.assignee_core_user_ids ? JSON.parse(editingDoc.assignee_core_user_ids).map(String) : [];
                          const userId = String(user.id || user.core_user_id);
                          let newIds = [];
                          if (e.target.checked) {
                            newIds = [...currentIds, userId];
                          } else {
                            newIds = currentIds.filter(id => String(id) !== userId);
                          }
                          setEditingDoc({ ...editingDoc, assignee_core_user_ids: JSON.stringify(newIds) });
                        }}
                      />
                      <span>{user.name || user.display_name} ({user.role})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="calendar-modal-footer">
              <button onClick={() => { setIsEditing(false); setEditingDoc(null); }} className="calendar-btn-secondary">
                ยกเลิก
              </button>
              <button
                onClick={async () => {
                  if (!editingDoc.doc_no || !editingDoc.title) {
                    showAlert('กรุณากรอกเลขที่หนังสือและหัวเรื่อง', 'warning');
                    return;
                  }
                  try {
                    const response = await fetch(`http://localhost:3803/api/documents/${editingDoc.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${generateMockToken()}`
                      },
                      body: JSON.stringify(editingDoc)
                    });
                    if (response.ok) {
                      setIsEditing(false);
                      setEditingDoc(null);
                      fetchBoardData();
                      showAlert('แก้ไขข้อมูลสำเร็จ', 'info');
                    } else {
                      const text = await response.text();
                      showAlert(`เกิดข้อผิดพลาด: ${text}`, 'error');
                    }
                  } catch (error) {
                    console.error('Failed to update document:', error);
                    showAlert(`Failed to update document: ${error.message}`, 'error');
                  }
                }}
                className="calendar-btn-primary"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertInfo.isOpen && (
        <div className="calendar-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="calendar-modal" style={{ maxWidth: '400px' }}>
            <div className="calendar-modal-header" style={{ borderBottom: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {alertInfo.type === 'error' && <AlertCircle size={24} style={{ color: '#ef4444' }} />}
                {alertInfo.type === 'warning' && <AlertCircle size={24} style={{ color: '#f59e0b' }} />}
                {alertInfo.type === 'info' && <AlertCircle size={24} style={{ color: '#3b82f6' }} />}
                <h3 className="calendar-title" style={{ fontSize: '1.25rem' }}>
                  {alertInfo.type === 'error' ? 'ข้อผิดพลาด' : (alertInfo.type === 'warning' ? 'คำเตือน' : 'แจ้งเตือน')}
                </h3>
              </div>
              <button onClick={() => setAlertInfo({ ...alertInfo, isOpen: false })} className="calendar-icon-btn">
                <X size={20} />
              </button>
            </div>
            <div className="calendar-modal-body" style={{ padding: '0.5rem 1.5rem 1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.5' }}>{alertInfo.message}</p>
            </div>
            <div className="calendar-modal-footer" style={{ borderTop: 'none', justifyContent: 'flex-end', paddingTop: '0' }}>
              <button onClick={() => setAlertInfo({ ...alertInfo, isOpen: false })} className="calendar-btn-primary">
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmInfo.isOpen && (
        <div className="calendar-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="calendar-modal" style={{ maxWidth: '400px' }}>
            <div className="calendar-modal-header" style={{ borderBottom: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertCircle size={24} style={{ color: '#f59e0b' }} />
                <h3 className="calendar-title" style={{ fontSize: '1.25rem' }}>ยืนยันการลบ</h3>
              </div>
              <button onClick={() => setConfirmInfo({ ...confirmInfo, isOpen: false })} className="calendar-icon-btn">
                <X size={20} />
              </button>
            </div>
            <div className="calendar-modal-body" style={{ padding: '0.5rem 1.5rem 1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.5' }}>{confirmInfo.message}</p>
            </div>
            <div className="calendar-modal-footer" style={{ borderTop: 'none', justifyContent: 'flex-end', paddingTop: '0', gap: '0.5rem' }}>
              <button onClick={() => setConfirmInfo({ ...confirmInfo, isOpen: false })} className="calendar-btn-secondary">
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  if (confirmInfo.onConfirm) confirmInfo.onConfirm();
                  setConfirmInfo({ ...confirmInfo, isOpen: false });
                }}
                className="calendar-btn-primary"
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
