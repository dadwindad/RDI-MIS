import React, { useState, useEffect } from 'react';
import logo from '../logo.png';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  CalendarDays, 
  Settings, 
  ShieldCheck,
  Blocks,
  FileBox,
  Activity,
  Code,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { db, AppRegistry } from '../services/db';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeMenu, setActiveMenu, isOpen }) => {
  const [activeApps, setActiveApps] = useState<AppRegistry[]>([]);
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false);
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);

  useEffect(() => {
    const fetchApps = async () => {
      const apps = await db.getApps();
      setActiveApps(apps.filter(app => app.status === 'Active'));
    };
    fetchApps();
  }, [activeMenu]); // Re-fetch when menu changes (like coming back from App Registry)

  useEffect(() => {
    if (activeMenu.startsWith('org')) {
      setIsOrgMenuOpen(true);
    }
  }, [activeMenu]);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header" style={{ height: 'var(--header-height)', display: 'flex', alignItems: 'center', padding: '0 1.25rem', gap: '0.75rem', overflow: 'hidden' }}>
        <img src={logo} alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-color)' }} />
        {isOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--accent-color)', lineHeight: 1 }}>RICP Core</span>
            <div style={{ display: 'flex' }}>
              <span style={{ fontSize: '0.55rem', color: '#ffffff', fontWeight: 800, whiteSpace: 'nowrap', backgroundColor: 'var(--accent-color)', padding: '1px 6px', borderRadius: '4px', letterSpacing: '0.03em' }}>สถาบันวิจัยและพัฒนา</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="sidebar-menu">
        <div className="menu-item active" onClick={() => setActiveMenu('dashboard')}>
          <LayoutDashboard size={20} />
          {isOpen && <span>Dashboard</span>}
        </div>

        <div className="menu-category">Workspace</div>
        <div 
          className={`menu-item ${activeMenu.startsWith('org') ? 'active' : ''}`} 
          onClick={() => {
            setActiveMenu('organization');
            setIsOrgMenuOpen(!isOrgMenuOpen);
          }}
        >
          <Building2 size={20} style={{ flexShrink: 0 }} />
          {isOpen && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>Organization Apps</span>
              {activeApps.length > 0 && (
                <div onClick={(e) => { e.stopPropagation(); setIsOrgMenuOpen(!isOrgMenuOpen); }} style={{ display: 'flex', alignItems: 'center' }}>
                  {isOrgMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              )}
            </div>
          )}
        </div>
        {isOpen && isOrgMenuOpen && activeApps.length > 0 && (
          <div style={{ paddingLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0', marginBottom: '0.5rem' }}>
            {activeApps.map(app => (
              <div 
                key={app.app_id}
                className={`menu-item ${activeMenu === app.app_id ? 'active' : ''}`} 
                onClick={(e) => { e.stopPropagation(); setActiveMenu(app.app_id); }} 
                style={{ padding: '0.25rem', fontSize: '0.875rem', minHeight: '32px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center' }}
                title={app.name}
              >
                {app.name}
              </div>
            ))}
          </div>
        )}

        <div className="menu-category">Master Data</div>
        <div className={`menu-item ${activeMenu === 'fiscal-year' ? 'active' : ''}`} onClick={() => setActiveMenu('fiscal-year')}>
          <CalendarDays size={20} />
          {isOpen && <span>Fiscal Year</span>}
        </div>

        <div className="menu-category">IAM</div>
        <div className={`menu-item ${activeMenu === 'users' ? 'active' : ''}`} onClick={() => setActiveMenu('users')}>
          <Users size={20} />
          {isOpen && <span>User Management</span>}
        </div>
        <div className={`menu-item ${activeMenu === 'roles' ? 'active' : ''}`} onClick={() => setActiveMenu('roles')}>
          <ShieldCheck size={20} />
          {isOpen && <span>Roles & Permissions</span>}
        </div>

        <div 
          className="menu-category" 
          onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span>System</span>
          {isOpen && (
            <div style={{ display: 'flex', alignItems: 'center', paddingRight: '1.5rem' }}>
              {isSystemMenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          )}
        </div>
        {isSystemMenuOpen && (
          <>
            <div className={`menu-item ${activeMenu === 'apps' ? 'active' : ''}`} onClick={() => setActiveMenu('apps')}>
              <Blocks size={20} />
              {isOpen && <span>App Registry</span>}
            </div>
            <div className={`menu-item ${activeMenu === 'storage' ? 'active' : ''}`} onClick={() => setActiveMenu('storage')}>
              <FileBox size={20} />
              {isOpen && <span>Storage Gateway</span>}
            </div>
            <div className={`menu-item ${activeMenu === 'audit' ? 'active' : ''}`} onClick={() => setActiveMenu('audit')}>
              <Activity size={20} />
              {isOpen && <span>Audit Logs</span>}
            </div>
            <div className={`menu-item ${activeMenu === 'api-docs' ? 'active' : ''}`} onClick={() => setActiveMenu('api-docs')}>
              <Code size={20} />
              {isOpen && <span>API Documentation</span>}
            </div>
            <div className={`menu-item ${activeMenu === 'settings' ? 'active' : ''}`} onClick={() => setActiveMenu('settings')}>
              <Settings size={20} />
              {isOpen && <span>Settings</span>}
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
