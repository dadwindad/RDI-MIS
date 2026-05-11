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
import { db, User } from './services/db';

function App() {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [activeMenu, setActiveMenu] = React.useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  React.useEffect(() => {
    const savedUser = localStorage.getItem('ricp_current_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('ricp_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ricp_current_user');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} currentUser={currentUser} setActiveMenu={setActiveMenu} />
        <main className="content-area">
          {activeMenu === 'dashboard' && <Dashboard setActiveMenu={setActiveMenu} />}
          {activeMenu.startsWith('org') && <Organization activeApp={activeMenu} setActiveMenu={setActiveMenu} />}
          {activeMenu === 'users' && <UserManagement currentUser={currentUser} />}
          {activeMenu === 'apps' && <AppRegistry currentUser={currentUser} />}
          {activeMenu === 'fiscal-year' && <FiscalYear currentUser={currentUser} />}
          {activeMenu === 'roles' && <RoleMatrix />}
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
