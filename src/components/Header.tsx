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
        <div className="user-profile" onClick={onLogout} title="Click to Logout">
          <div className="avatar">{currentUser.name.substring(0, 2).toUpperCase()}</div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{currentUser.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{currentUser.role.toUpperCase()} • Log out</div>
          </div>
          <ChevronDown size={16} color="var(--text-secondary)" />
        </div>
      </div>
    </header>
  );
};

export default Header;
