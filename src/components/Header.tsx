import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Menu, Search, Bell, ChevronDown } from 'lucide-react';
import { User } from '../services/db';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  onLogout: () => void;
  currentUser: User;
  setActiveMenu: (menu: string) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen, onLogout, currentUser, setActiveMenu }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ title: string; menu: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchItems = [
    { title: 'Dashboard / ภาพรวมระบบ', menu: 'dashboard' },
    { title: 'Project Management System (PMS) / ระบบจัดการโครงการ', menu: 'org-pms' },
    { title: 'App Registry / จัดการ Sub-Apps', menu: 'apps' },
    { title: 'Storage Gateway / จัดการไฟล์', menu: 'storage' },
    { title: 'User Management / จัดการผู้ใช้งาน', menu: 'users' },
    { title: 'Audit Logs / บันทึกกิจกรรม', menu: 'audit' },
    { title: 'API Documentation / คู่มือนักพัฒนา', menu: 'api-docs' },
  ];

  const handleSearch = (q: string) => {
    setQuery(q);
    if (q.trim() === '') { setResults([]); return; }
    setResults(searchItems.filter(item => item.title.toLowerCase().includes(q.toLowerCase())));
  };

  const handleSelectResult = (menu: string) => {
    setActiveMenu(menu);
    setQuery('');
    setResults([]);
  };

  return (
    <>
      <header className="header" style={{ position: 'relative' }}>
      <div className="header-left">
        <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu size={20} />
        </button>
        <div className="search-bar" style={{ position: 'relative' }}>
          <Search size={18} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search across platforms..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
          />
          {results.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              backgroundColor: 'var(--bg-color)',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
              borderRadius: '0.5rem', marginTop: '0.5rem', zIndex: 1000,
              overflow: 'hidden', border: '1px solid var(--border-color)'
            }}>
              {results.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectResult(item.menu)}
                  style={{
                    padding: '0.75rem 1rem', cursor: 'pointer',
                    borderBottom: idx === results.length - 1 ? 'none' : '1px solid var(--border-color)',
                    fontSize: '0.875rem'
                  }}
                  className="search-result-item"
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {item.title}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        <button className="toggle-btn"><Bell size={20} /></button>

        {/* User profile with dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div
            className="user-profile"
            onClick={() => setShowDropdown(prev => !prev)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <div className="avatar">{currentUser.name.substring(0, 2).toUpperCase()}</div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{currentUser.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{currentUser.role.toUpperCase()}</div>
            </div>
            <ChevronDown
              size={16}
              color="var(--text-secondary)"
              style={{ transition: 'transform 0.2s', transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </div>

          {/* Dropdown menu */}
          {showDropdown && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
              width: '180px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              zIndex: 9999,
              animation: 'dropdownFadeIn 0.15s ease',
            }}>
              <button
                onClick={() => { setShowDropdown(false); setShowProfileModal(true); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '0.75rem 1rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.875rem', color: 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                👤 โปรไฟล์
              </button>
              <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }} />
              <button
                onClick={() => { setShowDropdown(false); setShowLogoutConfirm(true); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '0.75rem 1rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.875rem', color: 'var(--status-danger)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                🚪 ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logout confirm modal */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          paddingTop: '10px', overflowY: 'auto', zIndex: 99998,
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', width: '400px', maxWidth: '90%',
            textAlign: 'center', border: '1px solid var(--border-color)',
          }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 600 }}>ยืนยันการออกจากระบบ</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>คุณต้องการออกจากระบบใช่หรือไม่?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setShowLogoutConfirm(false)} style={{
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
              }}>ยกเลิก</button>
              <button onClick={() => { setShowLogoutConfirm(false); onLogout(); }} style={{
                padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none',
                backgroundColor: 'var(--status-danger)', color: '#ffffff',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
              }}>ออกจากระบบ</button>
            </div>
          </div>
        </div>
      )}

      <div className="header-animation-line" />
    </header>

    {/* Logout confirm modal — rendered via portal to escape header stacking context */}
    {showLogoutConfirm && ReactDOM.createPortal(
      <div style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '10px', overflowY: 'auto', zIndex: 99998,
      }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', width: '400px', maxWidth: '90%',
          textAlign: 'center', border: '1px solid var(--border-color)',
        }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 600 }}>ยืนยันการออกจากระบบ</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>คุณต้องการออกจากระบบใช่หรือไม่?</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => setShowLogoutConfirm(false)} style={{
              padding: '0.5rem 1rem', borderRadius: '0.5rem',
              border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
            }}>ยกเลิก</button>
            <button onClick={() => { setShowLogoutConfirm(false); onLogout(); }} style={{
              padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none',
              backgroundColor: 'var(--status-danger)', color: '#ffffff',
              cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
            }}>ออกจากระบบ</button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* Profile edit modal — rendered via portal to escape header stacking context */}
    {showProfileModal && ReactDOM.createPortal(
      <div style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '10px', overflowY: 'auto', zIndex: 99999,
      }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', width: '420px', maxWidth: '95%',
          border: '1px solid var(--border-color)',
        }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.25rem', fontWeight: 600 }}>✏️ แก้ไขข้อมูลผู้ใช้</h3>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement;
            const fd = new FormData(form);
            const newUsername = ((fd.get('username') as string) || '').trim();
            const newName = ((fd.get('name') as string) || '').trim();
            const newPassword = ((fd.get('password') as string) || '').trim();
            const confirmPwd = ((fd.get('confirm') as string) || '').trim();
            if (newPassword && newPassword !== confirmPwd) {
              alert('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
              return;
            }
            try {
              const body: any = { username: newUsername, name: newName };
              if (newPassword) body.password = newPassword;
              const resp = await fetch(`/rdi_mis/api/users/${currentUser.id}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });
              const data = await resp.json();
              if (data.success && data.user) {
                // Sync localStorage with latest from DB
                const stored = localStorage.getItem('ricp_current_user');
                const localUser = stored ? JSON.parse(stored) : {};
                const updated = { ...localUser, ...data.user };
                if (newPassword) updated.password = newPassword;
                localStorage.setItem('ricp_current_user', JSON.stringify(updated));
                alert('บันทึกสำเร็จ!');
                window.location.reload();
              } else {
                alert('เกิดข้อผิดพลาด: ' + (data.error || 'Unknown error'));
              }
            } catch (err: any) {
              alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์: ' + err.message);
            }
          }}>
            {[
              { label: 'Username', name: 'username', type: 'text', defaultValue: currentUser.username },
              { label: 'ชื่อ-นามสกุล', name: 'name', type: 'text', defaultValue: currentUser.name },
              { label: 'รหัสผ่านใหม่ (ไม่บังคับ)', name: 'password', type: 'password', defaultValue: '' },
              { label: 'ยืนยันรหัสผ่าน', name: 'confirm', type: 'password', defaultValue: '' },
            ].map(field => (
              <div key={field.name} style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{field.label}</label>
                <input
                  name={field.name}
                  type={field.type}
                  defaultValue={field.defaultValue}
                  placeholder={field.type === 'password' ? '••••••••' : ''}
                  style={{
                    width: '100%', padding: '0.55rem 0.75rem',
                    borderRadius: '0.5rem', border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                    fontSize: '0.875rem', outline: 'none',
                  }}
                />
              </div>
            ))}
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              * Role และ Department สามารถแก้ไขได้โดย Administrator เท่านั้น
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => setShowProfileModal(false)} style={{
                padding: '0.5rem 1.25rem', borderRadius: '0.5rem',
                border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.875rem',
              }}>ยกเลิก</button>
              <button type="submit" style={{
                padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none',
                backgroundColor: 'var(--accent-color)', color: '#fff',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
              }}>บันทึก</button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )}
  </>
  );
};

export default Header;
