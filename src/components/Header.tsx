import React, { useState } from 'react';
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    if (q.trim() === '') {
      setResults([]);
      return;
    }
    const filtered = searchItems.filter(item => 
      item.title.toLowerCase().includes(q.toLowerCase())
    );
    setResults(filtered);
  };

  const handleSelectResult = (menu: string) => {
    setActiveMenu(menu);
    setQuery('');
    setResults([]);
  };

  return (
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
              position: 'absolute', 
              top: '100%', 
              left: 0, 
              right: 0, 
              backgroundColor: 'var(--bg-color)', 
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', 
              borderRadius: '0.5rem', 
              marginTop: '0.5rem', 
              zIndex: 1000,
              overflow: 'hidden',
              border: '1px solid var(--border-color)'
            }}>
              {results.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleSelectResult(item.menu)}
                  style={{ 
                    padding: '0.75rem 1rem', 
                    cursor: 'pointer', 
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
        <button className="toggle-btn">
          <Bell size={20} />
        </button>
        <div className="user-profile" onClick={() => setShowLogoutConfirm(true)} title="Click to Logout">
          <div className="avatar">{currentUser.name.substring(0, 2).toUpperCase()}</div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{currentUser.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{currentUser.role.toUpperCase()} • Log out</div>
          </div>
          <ChevronDown size={16} color="var(--text-secondary)" />
        </div>
      </div>
      
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            width: '400px',
            maxWidth: '90%',
            textAlign: 'center',
            border: '1px solid var(--border-color)',
          }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 600 }}>ยืนยันการออกจากระบบ</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>คุณต้องการออกจากระบบใช่หรือไม่?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: 'var(--status-danger)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="header-animation-line" />
    </header>
  );
};

export default Header;
