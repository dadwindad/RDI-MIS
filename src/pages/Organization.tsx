import React, { useState, useEffect } from 'react';
import { Blocks, Calculator, FileCheck, Landmark, AppWindow } from 'lucide-react';
import ProjectDashboard from '../../sub-apps/pms-app/src/components/ProjectDashboard';
import CalendarView from '../../sub-apps/calendar-app/src/components/CalendarView';
import { db, AppRegistry as IAppRegistry } from '../services/db';

interface OrganizationProps {
  activeApp: string;
  setActiveMenu: (menu: string) => void;
}

const Organization: React.FC<OrganizationProps> = ({ activeApp, setActiveMenu }) => {
  const [apps, setApps] = useState<IAppRegistry[]>([]);

  useEffect(() => {
    const fetchApps = async () => {
      const data = await db.getApps();
      setApps(data.filter(app => app.status === 'Active'));
    };
    fetchApps();
  }, []);

  const getAppIcon = (id: string) => {
    if (id.includes('pms')) return <Blocks size={40} />;
    if (id.includes('finance')) return <Calculator size={40} />;
    if (id.includes('ec')) return <FileCheck size={40} />;
    if (id.includes('ip')) return <Landmark size={40} />;
    return <AppWindow size={40} />;
  };

  const getAppColor = (id: string) => {
    if (id.includes('pms')) return '#3b82f6';
    if (id.includes('finance')) return '#10b981';
    if (id.includes('ec')) return '#8b5cf6';
    if (id.includes('ip')) return '#f59e0b';
    return '#6366f1';
  };

  if (activeApp === 'org-pms') {
    return (
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => setActiveMenu('organization')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-secondary)' }}>
            ← Back to Organization Hub
          </button>
        </div>
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <ProjectDashboard />
        </div>
      </div>
    );
  }

  if (activeApp === 'org-calendar') {
    return (
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => setActiveMenu('organization')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-secondary)' }}>
            ← Back to Organization Hub
          </button>
        </div>
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <CalendarView />
        </div>
      </div>
    );
  }

  if (activeApp !== 'organization') {
    return (
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => setActiveMenu('organization')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-secondary)' }}>
            ← Back to Organization Hub
          </button>
        </div>
        <div className="placeholder-page" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2>{apps.find(a => a.app_id === activeApp)?.name || 'Unknown App'}</h2>
          <p>This Sub-App is currently offline or not connected to the Core Gateway.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Organization Apps</h1>
        <p className="page-subtitle">Select a sub-application to launch your workspace. Access is granted based on your role.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {apps.map(app => (
          <div 
            key={app.app_id} 
            onClick={() => setActiveMenu(app.app_id)}
            style={{ 
              backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border-color)', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer',
              transition: 'transform 0.2s, boxShadow 0.2s',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ color: getAppColor(app.app_id), marginBottom: '1rem' }}>
              {getAppIcon(app.app_id)}
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>{app.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0, wordBreak: 'break-all' }}>{app.api_endpoint}</p>
          </div>
        ))}
        {apps.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No Active Sub-Apps available. Please contact administrator to register apps in the App Registry.
          </div>
        )}
      </div>
    </div>
  );
};

export default Organization;
