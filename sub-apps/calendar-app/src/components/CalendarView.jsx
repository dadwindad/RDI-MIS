import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, FileText, Filter, Plus, ChevronLeft, ChevronRight, X, Users, AlertCircle, ChevronDown, Settings, Edit2, LayoutDashboard } from 'lucide-react';
import './Calendar.css';
import KanbanBoard from './KanbanBoard';

const CalendarView = () => {
  const [viewMode, setViewMode] = useState('calendar');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [participantFilter, setParticipantFilter] = useState([]); // Array of core_user_id
  const [isUserFilterOpen, setIsUserFilterOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date('2026-05-01T00:00:00'));
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ id: null, title: '', type: 'ประชุมภายใน', start_date: '', end_date: '', deadline: '', location: '', participants: [] });
  const [fileToUpload, setFileToUpload] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [isManagingTypes, setIsManagingTypes] = useState(false);
  const [newType, setNewType] = useState({ name: '', color_bg: 'rgba(59, 130, 246, 0.1)', color_text: '#2563eb', color_border: '#3b82f6' });
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: '', type: 'info' });
  const [confirmInfo, setConfirmInfo] = useState({ isOpen: false, message: '', onConfirm: null });

  const showAlert = (message, type = 'info') => {
    setAlertInfo({ isOpen: true, message, type });
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmInfo({ isOpen: true, message, onConfirm });
  };

  const [filterOrder, setFilterOrder] = useState([]);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  useEffect(() => {
    const allFilterNames = ['all', ...activityTypes.map(t => t.name)];
    const savedOrderStr = localStorage.getItem('calendar_filter_order');
    let currentOrder = [];

    if (savedOrderStr) {
      const savedOrder = JSON.parse(savedOrderStr);
      currentOrder = savedOrder.filter(name => allFilterNames.includes(name));
      allFilterNames.forEach(name => {
        if (!currentOrder.includes(name)) {
          currentOrder.push(name);
        }
      });
    } else {
      currentOrder = allFilterNames;
    }

    setFilterOrder(currentOrder);
  }, [activityTypes]);

  const onDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newOrder = [...filterOrder];
    const itemToMove = newOrder[draggedItemIndex];
    newOrder.splice(draggedItemIndex, 1);
    newOrder.splice(index, 0, itemToMove);

    setDraggedItemIndex(index);
    setFilterOrder(newOrder);
  };

  const onDragEnd = () => {
    setDraggedItemIndex(null);
    localStorage.setItem('calendar_filter_order', JSON.stringify(filterOrder));
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3801/api/users');
      const data = await res.json();
      const filtered = data
        .filter(u => u.role === 'manager' || u.role === 'staff')
        .map(u => ({ core_user_id: u.id, display_name: u.name }));
      setAvailableUsers(filtered);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  };

  const fetchActivityTypes = async () => {
    try {
      const res = await fetch('http://localhost:3803/api/activity-types');
      const data = await res.json();
      setActivityTypes(data);
    } catch (e) {
      console.error('Failed to fetch activity types:', e);
    }
  };

  const handleAddType = async () => {
    if (!newType.name.trim()) return showAlert('กรุณาระบุชื่อประเภท', 'warning');
    try {
      const payload = btoa(JSON.stringify({ id: 'user-1', name: 'Test User', role: 'admin' }));
      const token = `Bearer dummyHeader.${payload}.dummySignature`;

      const url = editingTypeId ? `http://localhost:3803/api/activity-types/${editingTypeId}` : 'http://localhost:3803/api/activity-types';
      const method = editingTypeId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(newType)
      });
      if (!res.ok) throw new Error('Failed to save type');
      setNewType({ name: '', color_bg: 'rgba(59, 130, 246, 0.1)', color_text: '#2563eb', color_border: '#3b82f6' });
      setEditingTypeId(null);
      fetchActivityTypes();
    } catch (e) {
      console.error(e);
      showAlert('เกิดข้อผิดพลาดในการบันทึกประเภท', 'error');
    }
  };

  const handleDeleteType = async (id) => {
    showConfirm('คุณแน่ใจหรือไม่ว่าต้องการลบประเภทนี้?', async () => {
      try {
        const payload = btoa(JSON.stringify({ id: 'user-1', name: 'Test User', role: 'admin' }));
        const token = `Bearer dummyHeader.${payload}.dummySignature`;

        const res = await fetch(`http://localhost:3803/api/activity-types/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': token }
        });
        if (!res.ok) throw new Error('Failed to delete type');
        fetchActivityTypes();
      } catch (e) {
        console.error(e);
        showAlert('เกิดข้อผิดพลาดในการลบประเภท', 'error');
      }
    });
  };

  useEffect(() => {
    fetchUsers();
    fetchActivityTypes();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const payload = btoa(JSON.stringify({ id: 'user-1', name: 'Test User', role: 'admin' }));
      const token = `Bearer dummyHeader.${payload}.dummySignature`;

      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

      const response = await fetch(`http://localhost:3803/api/calendar/events?start_date=${start}&end_date=${end}`, {
        headers: { 'Authorization': token }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setEvents(data);
      } else {
        console.error('API Error:', data);
        setEvents([]);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'calendar') {
      fetchEvents();
    }
  }, [currentDate, viewMode]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const openAddEvent = (date) => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date - tzoffset)).toISOString().slice(0, -1);
    const dateStr = localISOTime.split('T')[0];
    setNewEvent({ id: null, title: '', type: 'ประชุมภายใน', start_date: dateStr, end_date: '', deadline: '', location: '', participants: [] });
    setFileToUpload(null);
    setIsAddingEvent(true);
  };

  const openEditEvent = (event) => {
    setNewEvent({
      id: event.id,
      title: event.title,
      type: event.type,
      start_date: event.start_date ? event.start_date.split('T')[0] : '',
      end_date: event.end_date ? event.end_date.split('T')[0] : '',
      deadline: event.deadline ? event.deadline.split('T')[0] : '',
      location: event.location || '',
      participants: event.participants || []
    });
    setFileToUpload(null);
    setSelectedEvent(null);
    setIsAddingEvent(true);
  };

  const submitNewEvent = async (e) => {
    e.preventDefault();


    try {
      // Get current user from localStorage for token
      let userName = 'Test User';
      const savedUser = localStorage.getItem('ricp_current_user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          userName = user.name || 'Test User';
        } catch (e) {
          console.error('Failed to parse current user for token', e);
        }
      }

      const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ id: 'user-1', name: userName, role: 'admin' }))));
      const token = `Bearer dummyHeader.${payload}.dummySignature`;

      let storage_path = newEvent.storage_path;

      if (fileToUpload) {
        const formData = new FormData();
        formData.append('appSource', 'calendar');
        formData.append('activity', newEvent.title);

        // Get current user from localStorage
        let uploaderName = 'Unknown User';
        const savedUser = localStorage.getItem('ricp_current_user');
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser);
            uploaderName = user.name || 'Unknown User';
          } catch (e) {
            console.error('Failed to parse current user', e);
          }
        }
        formData.append('uploader', uploaderName);

        formData.append('file', fileToUpload);

        const uploadRes = await fetch('http://localhost:3801/api/storage/upload', {
          method: 'POST',
          headers: {
            'Authorization': token,
            'x-user-name': encodeURIComponent(uploaderName)
          },
          body: formData
        });

        if (!uploadRes.ok) {
          throw new Error('Upload failed');
        }

        const uploadData = await uploadRes.json();
        storage_path = `http://localhost:3801${uploadData.path}`;
      }

      const url = newEvent.id ? `http://localhost:3803/api/activities/${newEvent.id}` : 'http://localhost:3803/api/activities';
      const method = newEvent.id ? 'PUT' : 'POST';

      const actRes = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ ...newEvent, storage_path })
      });

      if (!actRes.ok) {
        const errData = await actRes.json();
        throw new Error(errData.error || 'Activity creation failed');
      }

      // Log to central Audit Log
      try {
        const action = newEvent.id ? 'UPDATE_ACTIVITY' : 'CREATE_ACTIVITY';
        const details = `${newEvent.id ? 'แก้ไข' : 'สร้าง'}กิจกรรม: ${newEvent.title}`;
        await fetch('http://localhost:3801/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_name: userName, action, details })
        });
      } catch (auditErr) {
        console.error('Failed to log audit:', auditErr);
      }

      setIsAddingEvent(false);
      setNewEvent({ id: null, title: '', type: 'ประชุมภายใน', start_date: '', end_date: '', deadline: '', location: '', participants: [] });
      setFileToUpload(null);
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      showAlert('เกิดข้อผิดพลาดในการบันทึกกิจกรรม', 'error');
    }
  };

  const handleDeleteEvent = async (id) => {
    showConfirm('คุณแน่ใจหรือไม่ว่าต้องการลบกิจกรรมนี้?', async () => {
      try {
        // Get current user from localStorage for token
        let userName = 'Test User';
        const savedUser = localStorage.getItem('ricp_current_user');
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser);
            userName = user.name || 'Test User';
          } catch (e) {
            console.error('Failed to parse current user for token', e);
          }
        }

        const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ id: 'user-1', name: userName, role: 'admin' }))));
        const token = `Bearer dummyHeader.${payload}.dummySignature`;

        const res = await fetch(`http://localhost:3803/api/activities/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': token }
        });
        if (!res.ok) throw new Error('Failed to delete activity');

        // Log to central Audit Log
        try {
          const eventToDelete = events.find(e => e.id === id);
          const title = eventToDelete ? eventToDelete.title : id;
          await fetch('http://localhost:3801/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_name: userName, action: 'DELETE_ACTIVITY', details: `ลบกิจกรรม: ${title}` })
          });
        } catch (auditErr) {
          console.error('Failed to log audit:', auditErr);
        }

        setSelectedEvent(null);
        fetchEvents();
      } catch (e) {
        console.error(e);
        showAlert('เกิดข้อผิดพลาดในการลบกิจกรรม', 'error');
      }
    });
  };

  const safeEvents = Array.isArray(events) ? events : [];
  const filteredEvents = safeEvents.filter(event => {
    // 1. Filter by Type
    let matchType = true;
    if (filter !== 'all') {
      if (filter === 'document') {
        matchType = event.event_type === 'document';
      } else {
        matchType = event.type === filter || (filter === 'ประชุมภายใน' && (!event.type || event.type === ''));
      }
    }

    // 2. Filter by Participants
    let matchParticipants = true;
    if (participantFilter.length > 0) {
      if (event.event_type === 'activity') {
        if (event.participants) {
          matchParticipants = participantFilter.some(userId =>
            event.participants.some(p => p.core_user_id === userId)
          );
        } else {
          matchParticipants = false;
        }
      }
      // Documents ignore participant filter and remain visible
    }

    return matchType && matchParticipants;
  });

  const getEventsForDay = (date) => {
    if (!date) return [];

    const parseDateStr = (dateStr) => {
      if (!dateStr) return null;
      const part = dateStr.split('T')[0];
      const [y, m, d] = part.split('-').map(Number);
      return new Date(y, m - 1, d).getTime();
    };

    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const dayEvents = [];

    filteredEvents.forEach(event => {
      const s = parseDateStr(event.start_date);
      const e = parseDateStr(event.end_date) || s;
      const dl = parseDateStr(event.deadline);

      const inRange = s && e && d >= s && d <= e;
      const isDeadline = dl && d === dl;

      if (inRange || isDeadline) {
        dayEvents.push({
          ...event,
          is_deadline_day: isDeadline
        });
      }
    });

    return dayEvents;
  };

  const getActivityTypeClass = (type) => {
    switch (type) {
      case 'ประชุมภายใน': return 'activity-internal';
      case 'ประชุมภายนอก': return 'activity-external';
      case 'ไปราชการ': return 'activity-trip';
      case 'ลงพื้นที่': return 'activity-field';
      default: return 'activity';
    }
  };

  const getActivityColor = (type) => {
    const found = activityTypes.find(t => t.name === type);
    if (found) {
      return { bg: found.color_bg, text: found.color_text, border: found.color_border };
    }
    switch (type) {
      case 'ประชุมภายใน': return { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', border: '#3b82f6' };
      case 'ประชุมภายนอก': return { bg: 'rgba(139, 92, 246, 0.1)', text: '#7c3aed', border: '#8b5cf6' };
      case 'ไปราชการ': return { bg: 'rgba(20, 184, 166, 0.1)', text: '#0d9488', border: '#14b8a6' };
      case 'ลงพื้นที่': return { bg: 'rgba(236, 72, 153, 0.1)', text: '#db2777', border: '#ec4899' };
      case 'document': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706', border: '#f59e0b' };
      default: return { bg: 'var(--bg-secondary)', text: 'var(--text-primary)', border: 'var(--border-color)' };
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(year, month, i));

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

  const currentUser = JSON.parse(localStorage.getItem('ricp_current_user') || '{}');

  return (
    <div className="calendar-container">
      <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', paddingBottom: '0' }}>
        <div style={{ paddingBottom: '1rem' }}>
          <h1 className="calendar-title">
            {viewMode === 'kanban' ? 'Workflow Board' : 'Smart Office & Calendar'}
          </h1>
          <p className="calendar-subtitle">
            {viewMode === 'kanban' ? 'ระบบจัดการสถานะหนังสือสารบรรณ (e-Document)' : 'จัดการกำหนดการและเอกสารธุรการ (Unified Calendar View)'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: '0.5rem' }}>
          <button 
            onClick={() => setViewMode('calendar')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
              backgroundColor: viewMode === 'calendar' ? 'var(--bg-secondary)' : 'transparent',
              boxShadow: viewMode === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontWeight: viewMode === 'calendar' ? 600 : 400,
              color: viewMode === 'calendar' ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            <CalendarIcon size={18} /> ปฏิทิน
          </button>
          <button 
            onClick={() => setViewMode('kanban')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
              backgroundColor: viewMode === 'kanban' ? 'var(--bg-secondary)' : 'transparent',
              boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontWeight: viewMode === 'kanban' ? 600 : 400,
              color: viewMode === 'kanban' ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            <LayoutDashboard size={18} /> ระบบติดตาม
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <KanbanBoard currentUser={currentUser} />
      ) : (
        <>
          <div className="calendar-toolbar">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Type Filter (Buttons) */}
              <div className="calendar-filters">
                {filterOrder.map((t, index) => (
                  <button
                    key={t}
                    draggable
                    onDragStart={(e) => onDragStart(e, index)}
                    onDragOver={(e) => onDragOver(e, index)}
                    onDragEnd={onDragEnd}
                    onClick={() => setFilter(t)}
                    className={`calendar-filter-btn ${filter === t ? 'active' : ''}`}
                    style={{ cursor: 'grab' }}
                  >
                    {t === 'all' ? 'ทั้งหมด' : t}
                  </button>
                ))}
              </div>

              {/* Participant Filter (Dropdown) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                <button
                  onClick={() => setIsUserFilterOpen(!isUserFilterOpen)}
                  className="calendar-dropdown-btn"
                >
                  <Users size={16} />
                  <span>
                    {participantFilter.length === 0 ? 'กรองตามรายชื่อ' : `เลือกแล้ว (${participantFilter.length})`}
                  </span>
                  <ChevronDown size={14} style={{ marginLeft: 'auto' }} />
                </button>
                {isUserFilterOpen && (
                  <div className="calendar-dropdown-menu">
                    {availableUsers.map(user => (
                      <label key={user.core_user_id} className="calendar-dropdown-item">
                        <input
                          type="checkbox"
                          checked={participantFilter.includes(user.core_user_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setParticipantFilter([...participantFilter, user.core_user_id]);
                            } else {
                              setParticipantFilter(participantFilter.filter(id => id !== user.core_user_id));
                            }
                          }}
                        />
                        <span>{user.display_name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="calendar-controls">
              <button onClick={prevMonth} className="calendar-icon-btn">
                <ChevronLeft size={24} />
              </button>
              <div className="calendar-month-year">
                {monthNames[month]} {year + 543}
              </div>
              <button onClick={nextMonth} className="calendar-icon-btn">
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className="calendar-grid-wrapper">
            {loading && (
              <div className="calendar-modal-overlay">
                <div className="loader"></div>
              </div>
            )}

            <div className="calendar-grid-header">
              {dayNames.map(day => (
                <div key={day} className="calendar-day-name">
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarDays.map((date, idx) => {
                const dayEvents = getEventsForDay(date);
                const isToday = date && date.toDateString() === new Date().toDateString();

                return (
                  <div key={idx} className={`calendar-cell ${!date ? 'empty' : ''}`}>
                    {date && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', position: 'relative' }}>
                          <span className={`calendar-date-number ${isToday ? 'today' : ''}`}>
                            {date.getDate()}
                          </span>
                          <button
                            className="calendar-cell-add-btn"
                            onClick={(e) => { e.stopPropagation(); openAddEvent(date); }}
                            title="เพิ่มกิจกรรม"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {dayEvents.map(event => {
                          const colors = getActivityColor(event.event_type === 'document' ? 'document' : event.type);
                          const eventClass = event.event_type === 'document' ? 'document' : '';

                          const eventStart = new Date(event.start_date);
                          const eventEnd = event.end_date ? new Date(event.end_date) : eventStart;

                          const currentDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
                          const startDateTime = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate()).getTime();
                          const endDateTime = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate()).getTime();

                          const continuesPrev = currentDateTime > startDateTime;
                          const continuesNext = currentDateTime < endDateTime;

                          return (
                            <div
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className={`calendar-event ${eventClass} ${continuesPrev ? 'continues-prev' : ''} ${continuesNext ? 'continues-next' : ''} ${event.is_deadline_day ? 'is-deadline' : ''}`}
                              title={event.title}
                              style={{
                                justifyContent: 'space-between',
                                backgroundColor: colors.bg,
                                color: colors.text,
                                borderLeftColor: colors.border,
                                borderLeftWidth: '3px',
                                borderLeftStyle: 'solid'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', overflow: 'hidden' }}>
                                {event.is_deadline_day ? <Clock size={12} style={{ color: '#ef4444' }} /> : (event.event_type === 'activity' ? <CalendarIcon size={12} /> : <AlertCircle size={12} />)}
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {event.is_deadline_day ? `[DL] ${event.title}` : event.title}
                                </span>
                              </div>
                              {event.storage_path && (
                                <FileText
                                  size={12}
                                  style={{ flexShrink: 0, cursor: 'pointer', color: 'var(--accent-color)' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(event.storage_path, '_blank');
                                  }}
                                  title="เปิดดูไฟล์แนบ"
                                />
                              )}
                            </div>
                          )
                        })}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Modal */}
          {selectedEvent && (
            <div className="calendar-modal-overlay">
              <div className="calendar-modal">
                <div className="calendar-modal-header">
                  <h3 className="calendar-title" style={{ fontSize: '1.25rem' }}>{selectedEvent.title}</h3>
                  <button onClick={() => setSelectedEvent(null)} className="calendar-icon-btn">
                    <X size={20} />
                  </button>
                </div>

                <div className="calendar-modal-body">
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <Clock size={18} style={{ color: 'var(--text-secondary)' }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>วันที่</div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {new Date(selectedEvent.start_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                        {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date && ` - ${new Date(selectedEvent.end_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`}
                      </div>
                    </div>
                  </div>

                  {selectedEvent.event_type === 'activity' && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>ประเภทกิจกรรม</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{selectedEvent.type || 'ไม่ระบุ'}</div>
                      </div>
                    </div>
                  )}

                  {selectedEvent.deadline && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <Clock size={18} style={{ color: '#ef4444' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>วัน Deadline</div>
                        <div style={{ color: '#ef4444' }}>
                          {new Date(selectedEvent.deadline).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedEvent.event_type === 'activity' && selectedEvent.location && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <MapPin size={18} style={{ color: 'var(--text-secondary)' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>สถานที่</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{selectedEvent.location}</div>
                      </div>
                    </div>
                  )}

                  {selectedEvent.event_type === 'activity' && selectedEvent.participants && selectedEvent.participants.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <Users size={18} style={{ color: 'var(--text-secondary)' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>ผู้เข้าร่วม</div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          {selectedEvent.participants.map(p => p.display_name).join(', ')}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <FileText size={18} style={{ color: 'var(--text-secondary)' }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>ไฟล์แนบ / เอกสารต้นเรื่อง</div>
                      {selectedEvent.storage_path ? (
                        <a href="#" onClick={(e) => { e.preventDefault(); window.open(selectedEvent.storage_path, '_blank'); }} style={{ color: 'var(--accent-color)' }}>
                          เปิดดูไฟล์แนบ
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>ไม่มีไฟล์แนบ</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="calendar-modal-footer">
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'space-between' }}>
                    {selectedEvent.event_type === 'activity' ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => openEditEvent(selectedEvent)} className="calendar-btn-primary">
                          แก้ไขกิจกรรม
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(selectedEvent.id)}
                          className="calendar-btn-secondary"
                          style={{ color: '#ef4444', borderColor: '#ef4444' }}
                        >
                          ลบกิจกรรม
                        </button>
                      </div>
                    ) : <div></div>}
                    <button onClick={() => setSelectedEvent(null)} className="calendar-btn-secondary">
                      ปิดหน้าต่าง
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Event Modal */}
          {isAddingEvent && (
            <div className="calendar-modal-overlay">
              <div className="calendar-modal">
                <div className="calendar-modal-header">
                  <h3 className="calendar-title" style={{ fontSize: '1.25rem' }}>{newEvent.id ? 'แก้ไขกิจกรรม' : 'สร้างกิจกรรมใหม่'}</h3>
                  <button onClick={() => setIsAddingEvent(false)} className="calendar-icon-btn">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={submitNewEvent} className="calendar-modal-body">
                  <div className="calendar-form-group">
                    <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>หัวข้อกิจกรรม</label>
                    <input required type="text" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="เช่น ลงพื้นที่เก็บข้อมูล" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="calendar-form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>ประเภท</label>
                        <button
                          type="button"
                          onClick={() => setIsManagingTypes(true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-color)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                          title="จัดการประเภท"
                        >
                          <Settings size={16} />
                        </button>
                      </div>
                      <select
                        value={newEvent.type}
                        onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                        style={{
                          backgroundColor: getActivityColor(newEvent.type).bg,
                          color: getActivityColor(newEvent.type).text,
                          borderColor: getActivityColor(newEvent.type).border,
                          fontWeight: 600,
                          outline: 'none'
                        }}
                      >
                        {activityTypes.map(t => (
                          <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="calendar-form-group">
                      <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>ไฟล์แนบ (ไม่จำเป็น)</label>
                      <input type="file" onChange={e => setFileToUpload(e.target.files[0])} style={{ padding: '0.25rem' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="calendar-form-group">
                      <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>วันที่เริ่ม</label>
                      <input required type="date" value={newEvent.start_date} onChange={e => setNewEvent({ ...newEvent, start_date: e.target.value })} />
                    </div>
                    <div className="calendar-form-group">
                      <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>วันที่สิ้นสุด</label>
                      <input type="date" value={newEvent.end_date} onChange={e => setNewEvent({ ...newEvent, end_date: e.target.value })} />
                    </div>
                    <div className="calendar-form-group">
                      <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>วัน Deadline</label>
                      <input type="date" value={newEvent.deadline} onChange={e => setNewEvent({ ...newEvent, deadline: e.target.value })} />
                    </div>
                  </div>

                  <div className="calendar-form-group">
                    <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>ผู้เข้าร่วมกิจกรรม</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
                      {availableUsers.map(user => (
                        <label key={user.core_user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={newEvent.participants.some(p => p.core_user_id === user.core_user_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewEvent({ ...newEvent, participants: [...newEvent.participants, user] });
                              } else {
                                setNewEvent({ ...newEvent, participants: newEvent.participants.filter(p => p.core_user_id !== user.core_user_id) });
                              }
                            }}
                          />
                          <span style={{ fontSize: '0.875rem' }}>{user.display_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="calendar-form-group">
                    <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>สถานที่</label>
                    <input type="text" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="ระบุสถานที่" />
                  </div>

                  <div className="calendar-modal-footer">
                    <button type="button" onClick={() => setIsAddingEvent(false)} className="btn-secondary">
                      ยกเลิก
                    </button>
                    <button type="submit" className="calendar-btn-primary">
                      บันทึกกิจกรรม
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Manage Types Modal */}
          {isManagingTypes && (
            <div className="calendar-modal-overlay">
              <div className="calendar-modal">
                <div className="calendar-modal-header">
                  <h3 className="calendar-title" style={{ fontSize: '1.25rem' }}>จัดการประเภทกิจกรรม</h3>
                  <button onClick={() => setIsManagingTypes(false)} className="calendar-icon-btn">
                    <X size={20} />
                  </button>
                </div>

                <div className="calendar-modal-body">
                  {/* List of Types */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {activityTypes.map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: t.color_bg, color: t.color_text }}>
                        <span style={{ fontWeight: 600 }}>{t.name}</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => {
                              setEditingTypeId(t.id);
                              setNewType({ name: t.name, color_bg: t.color_bg, color_text: t.color_text, color_border: t.color_border });
                            }}
                            style={{ background: 'none', border: 'none', color: t.color_text, cursor: 'pointer' }}
                            title="แก้ไขประเภทนี้"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteType(t.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            title="ลบประเภทนี้"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Type Form */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                    <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>{editingTypeId ? 'แก้ไขประเภท' : 'เพิ่มประเภทใหม่'}</h4>
                    <div className="calendar-form-group">
                      <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>ชื่อประเภท</label>
                      <input type="text" value={newType.name} onChange={e => setNewType({ ...newType, name: e.target.value })} placeholder="เช่น อบรมภายนอก" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <div className="calendar-form-group">
                        <label style={{ fontWeight: 600, fontSize: '0.75rem' }}>สีพื้นหลัง</label>
                        <input type="color" value={newType.color_bg.startsWith('rgba') ? '#ffffff' : newType.color_bg} onChange={e => setNewType({ ...newType, color_bg: e.target.value })} />
                      </div>
                      <div className="calendar-form-group">
                        <label style={{ fontWeight: 600, fontSize: '0.75rem' }}>สีตัวอักษร</label>
                        <input type="color" value={newType.color_text} onChange={e => setNewType({ ...newType, color_text: e.target.value })} />
                      </div>
                      <div className="calendar-form-group">
                        <label style={{ fontWeight: 600, fontSize: '0.75rem' }}>สีเส้นขอบ</label>
                        <input type="color" value={newType.color_border} onChange={e => setNewType({ ...newType, color_border: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      {editingTypeId && (
                        <button
                          onClick={() => {
                            setEditingTypeId(null);
                            setNewType({ name: '', color_bg: 'rgba(59, 130, 246, 0.1)', color_text: '#2563eb', color_border: '#3b82f6' });
                          }}
                          className="calendar-btn-secondary"
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          ยกเลิก
                        </button>
                      )}
                      <button
                        onClick={handleAddType}
                        className="calendar-btn-primary"
                        style={{ flex: 2, justifyContent: 'center' }}
                      >
                        {editingTypeId ? 'บันทึกการแก้ไข' : 'เพิ่มประเภท'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="calendar-modal-footer">
                  <button onClick={() => setIsManagingTypes(false)} className="calendar-btn-secondary">
                    ปิดหน้าต่าง
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
                    <h3 className="calendar-title" style={{ fontSize: '1.25rem' }}>ยืนยันการดำเนินการ</h3>
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
        </>
      )}
    </div>
  );
};

export default CalendarView;
