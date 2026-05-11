import React from 'react';
import { Menu, Search, Bell, ChevronDown } from 'lucide-react';
import { User } from '../services/db';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  onLogout: () => void;
  currentUser: User;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen, onLogout, currentUser }) => {
  return (
    <header className="header">
      <div className="header-left">
        <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu size={20} />
        </button>
        <div className="search-bar">
          <Search size={18} color="var(--text-secondary)" />
          <input type="text" placeholder="Search across platforms..." />
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
