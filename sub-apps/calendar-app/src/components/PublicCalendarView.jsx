import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, ChevronDown, X, Users, Filter, FileText, AlertCircle } from 'lucide-react';
import './Calendar.css';

const PublicCalendarView = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activityTypes, setActivityTypes] = useState([]);
  const [filterOrder, setFilterOrder] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [participantFilter, setParticipantFilter] = useState([]);
  const [isUserFilterOpen, setIsUserFilterOpen] = useState(false);

  const fetchActivityTypes = async () => {
    try {
      const res = await fetch('/rdi_mis/api/calendar/activity-types');
      const data = await res.json();
      setActivityTypes(data);
    } catch (e) {
      console.error('Failed to fetch activity types:', e);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

      const response = await fetch(`/rdi_mis/api/calendar/public/events?start_date=${start}&end_date=${end}`);
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

  const fetchUsers = async () => {
    try {
      const res = await fetch('/rdi_mis/api/users');
      const data = await res.json();
      const filtered = data
        .filter(u => u.role === 'manager' || u.role === 'staff')
        .map(u => ({ core_user_id: u.id, display_name: u.name }));
      setAvailableUsers(filtered);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  };

  useEffect(() => {
    fetchActivityTypes();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  useEffect(() => {
    const allFilterNames = ['all', ...activityTypes.map(t => t.name).filter(name => name !== 'ลากิจ/ลาป่วย')];
    setFilterOrder(allFilterNames);
  }, [activityTypes]);

  const safeEvents = Array.isArray(events) ? events : [];
  const filteredEvents = safeEvents.filter(event => {
    const matchType = filter === 'all' || event.type === filter || (filter === 'ประชุมภายใน' && (!event.type || event.type === ''));
    const matchUser = participantFilter.length === 0 || (event.participants && event.participants.some(p => participantFilter.includes(p.core_user_id)));
    return matchType && matchUser;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(year, month, i));

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

  return (
    <div className="calendar-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <div className="calendar-header">
        <div>
          <h1 className="calendar-title">ปฏิทินกิจกรรมสถาบันวิจัยและพัฒนา</h1>
          <p className="calendar-subtitle">รายการกิจกรรมสำหรับบุคคลทั่วไป</p>
        </div>
      </div>

      <div className="calendar-toolbar">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="calendar-filters">
            {filterOrder.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`calendar-filter-btn ${filter === t ? 'active' : ''}`}
              >
                {t === 'all' ? 'ทั้งหมด' : t}
              </button>
            ))}
          </div>

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

        <div className="calendar-navigation" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="calendar-icon-btn"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.borderColor = 'var(--accent-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <ChevronLeft size={18} style={{ color: 'var(--text-primary)' }} />
          </button>

          <h2 className="calendar-month-title" style={{ minWidth: '150px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 600, margin: '0 0.5rem' }}>
            {monthNames[month]} {year + 543}
          </h2>

          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="calendar-icon-btn"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.borderColor = 'var(--accent-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <ChevronRight size={18} style={{ color: 'var(--text-primary)' }} />
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
            if (!date) return <div key={`empty-${idx}`} className="calendar-cell empty"></div>;

            const dayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

            const dayEvents = filteredEvents.filter(e => {
              const start = e.start_date ? e.start_date.split('T')[0] : '';
              const end = e.end_date ? e.end_date.split('T')[0] : start;
              return dayStr >= start && dayStr <= end;
            });

            const isToday = dayStr === todayStr;

            return (
              <div key={dayStr} className="calendar-cell">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', position: 'relative' }}>
                  <span
                    className={`calendar-date-number ${isToday ? 'today' : ''}`}
                    style={isToday ? {
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-color, #2563eb)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.875rem'
                    } : {}}
                  >
                    {date.getDate()}
                  </span>
                </div>

                {dayEvents.map(event => {
                  const typeInfo = activityTypes.find(t => t.name === event.type);
                  const bg = typeInfo ? typeInfo.color_bg : 'rgba(59, 130, 246, 0.1)';
                  const text = typeInfo ? typeInfo.color_text : '#2563eb';
                  const border = typeInfo ? typeInfo.color_border : '#3b82f6';

                  const eventClass = event.event_type === 'document' ? 'document' : '';

                  // Calculate continuesPrev and continuesNext
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
                      className={`calendar-event ${eventClass} ${continuesPrev ? 'continues-prev' : ''} ${continuesNext ? 'continues-next' : ''}`}
                      title={event.title}
                      style={{
                        justifyContent: 'space-between',
                        backgroundColor: bg,
                        color: text,
                        borderLeftColor: border,
                        borderLeftWidth: '3px',
                        borderLeftStyle: 'solid'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', overflow: 'hidden' }}>
                        {event.event_type === 'activity' ? <CalendarIcon size={12} /> : <AlertCircle size={12} />}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {event.title}
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
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Modal */}
      {selectedEvent && (
        <div className="calendar-modal-overlay">
          <div className="calendar-modal" style={{ maxWidth: '500px' }}>
            <div className="calendar-modal-header">
              <h3 className="calendar-title">{selectedEvent.title}</h3>
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
            <div className="calendar-modal-footer" style={{ justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedEvent(null)} className="calendar-btn-primary">ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicCalendarView;
