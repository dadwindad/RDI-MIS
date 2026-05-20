import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import AppRegistry from './pages/AppRegistry';
import FiscalYear from './pages/FiscalYear';
import RoleMatrix from './pages/RoleMatrix';
import Organization from './pages/Organization';
import UserManagement from './pages/UserManagement';
import AuditLogPage from './pages/AuditLog';
import StorageGateway from './pages/StorageGateway';
import ApiDocs from './pages/ApiDocs';
import SettingsPage from './pages/Settings';
import Login from './pages/Login';
import PublicCalendarView from '../sub-apps/calendar-app/src/components/PublicCalendarView';
import { db, User } from './services/db';

const getNormalizedPath = (path: string) => {
  let normalized = path;
  if (normalized.startsWith('/rdi_mis')) {
    normalized = normalized.substring(8);
  }
  if (normalized === '') return '/';
  return normalized;
};

function App() {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [activeMenu, setActiveMenu] = React.useState(() => {
    const path = getNormalizedPath(window.location.pathname);
    if (path === '/' || path === '') return 'dashboard';
    if (path === '/pms' || path === '/calendar' || path === '/finance' || path === '/ec' || path === '/ip' || path === '/qa') {
      return 'org-' + path.substring(1);
    }
    return path.substring(1);
  });
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  React.useEffect(() => {
    const savedUser = localStorage.getItem('ricp_current_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

    const handlePathChange = () => {
      const path = getNormalizedPath(window.location.pathname);
      if (path === '/' || path === '') {
        setActiveMenu('dashboard');
      } else if (path === '/pms' || path === '/calendar' || path === '/finance' || path === '/ec' || path === '/ip' || path === '/qa') {
        setActiveMenu('org-' + path.substring(1));
      } else {
        setActiveMenu(path.substring(1));
      }
    };
    
    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  React.useEffect(() => {
    const normalizedCurrent = getNormalizedPath(window.location.pathname);
    if (normalizedCurrent === '/public-calendar') {
      return;
    }

    let path = '/';
    if (activeMenu === 'dashboard') {
      path = '/';
    } else if (activeMenu.startsWith('org-')) {
      path = '/' + activeMenu.substring(4);
    } else {
      path = '/' + activeMenu;
    }

    const fullNewPath = '/rdi_mis' + path;
    if (window.location.pathname !== fullNewPath) {
      window.history.pushState(null, '', fullNewPath);
    }
  }, [activeMenu]);

  React.useEffect(() => {
    if (currentUser && currentUser.role === 'staff') {
      if (['apps', 'fiscal-year', 'users', 'roles'].includes(activeMenu)) {
        setActiveMenu('dashboard');
      }
    }
  }, [activeMenu, currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('ricp_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ricp_current_user');
  };

  if (getNormalizedPath(window.location.pathname) === '/public-calendar') {
    return <PublicCalendarView />;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentUser={currentUser} />
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} currentUser={currentUser} setActiveMenu={setActiveMenu} />
        <main className="content-area">
          {activeMenu === 'dashboard' && <Dashboard setActiveMenu={setActiveMenu} />}
          {activeMenu.startsWith('org') && <Organization activeApp={activeMenu} setActiveMenu={setActiveMenu} />}
          {activeMenu === 'users' && currentUser.role !== 'staff' && <UserManagement currentUser={currentUser} />}
          {activeMenu === 'apps' && currentUser.role !== 'staff' && <AppRegistry currentUser={currentUser} setActiveMenu={setActiveMenu} />}
          {activeMenu === 'fiscal-year' && currentUser.role !== 'staff' && <FiscalYear currentUser={currentUser} />}
          {activeMenu === 'roles' && currentUser.role !== 'staff' && <RoleMatrix />}
          {activeMenu === 'audit' && <AuditLogPage />}
          {activeMenu === 'storage' && <StorageGateway currentUser={currentUser} />}
          {activeMenu === 'api-docs' && <ApiDocs />}
          {activeMenu === 'settings' && <SettingsPage />}
          
          {/* Placeholder for others */}
          {['dashboard', 'users', 'apps', 'fiscal-year', 'roles', 'audit', 'storage', 'api-docs', 'settings'].indexOf(activeMenu) === -1 && !activeMenu.startsWith('org') && (
            <div className="placeholder-page">
              <h2>{activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1).replace('-', ' ')}</h2>
              <p>Micro-Frontend Application Module loading...</p>
              <div className="loader"></div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
