import React, { useState, useEffect } from 'react';
import { Blocks, Calculator, FileCheck, Landmark, AppWindow, BarChart3, Move, Check, ArrowLeft, ArrowRight, GripVertical } from 'lucide-react';
import ProjectDashboard from '../../sub-apps/pms-app/src/components/ProjectDashboard';
import CalendarView from '../../sub-apps/calendar-app/src/components/CalendarView';
import QAMetrics from '../../sub-apps/qa-app/src/components/QAMetrics';
import { db, AppRegistry as IAppRegistry } from '../services/db';

interface OrganizationProps {
  activeApp: string;
  setActiveMenu: (menu: string) => void;
}

const Organization: React.FC<OrganizationProps> = ({ activeApp, setActiveMenu }) => {
  const [apps, setApps] = useState<IAppRegistry[]>([]);
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const draggedRef = React.useRef(false);

  useEffect(() => {
    const fetchApps = async () => {
      const data = await db.getApps();
      const activeApps = data.filter(app => app.status === 'Active');

      // Load saved order from localStorage
      const savedOrder = localStorage.getItem('ricp_app_order');
      if (savedOrder) {
        try {
          const orderArr = JSON.parse(savedOrder);
          if (Array.isArray(orderArr)) {
            activeApps.sort((a, b) => {
              const indexA = orderArr.indexOf(a.app_id);
              const indexB = orderArr.indexOf(b.app_id);
              if (indexA === -1 && indexB === -1) return 0;
              if (indexA === -1) return 1;
              if (indexB === -1) return -1;
              return indexA - indexB;
            });
          }
        } catch (e) {
          console.error("Failed to parse app order", e);
        }
      }
      setApps(activeApps);
    };
    fetchApps();
  }, []);

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    draggedRef.current = true;
    setDraggedAppId(appId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', appId);
  };

  const handleDragOver = (e: React.DragEvent, targetAppId: string) => {
    e.preventDefault();
    if (!draggedAppId || draggedAppId === targetAppId) return;

    const draggedIdx = apps.findIndex(app => app.app_id === draggedAppId);
    const targetIdx = apps.findIndex(app => app.app_id === targetAppId);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      const updatedApps = [...apps];
      const [draggedApp] = updatedApps.splice(draggedIdx, 1);
      updatedApps.splice(targetIdx, 0, draggedApp);
      setApps(updatedApps);

      const newOrder = updatedApps.map(a => a.app_id);
      localStorage.setItem('ricp_app_order', JSON.stringify(newOrder));
    }
  };

  const handleDragEnd = () => {
    setDraggedAppId(null);
    setTimeout(() => {
      draggedRef.current = false;
    }, 50);
  };

  const handleCardClick = (appId: string) => {
    if (draggedRef.current) return;
    setActiveMenu(appId);
  };

  const getAppIcon = (id: string) => {
    if (id.includes('pms')) return <Blocks size={40} />;
    if (id.includes('finance')) return <Calculator size={40} />;
    if (id.includes('ec')) return <FileCheck size={40} />;
    if (id.includes('ip')) return <Landmark size={40} />;
    if (id.includes('qa')) return <BarChart3 size={40} />;
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

  if (activeApp === 'org-qa') {
    return (
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => setActiveMenu('organization')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-secondary)' }}>
            ← Back to Organization Hub
          </button>
        </div>
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <QAMetrics setActiveMenu={setActiveMenu} />
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
        <p className="page-subtitle">Select a sub-application to launch your workspace. Drag the cards to reorder them as desired.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {apps.map((app, idx) => (
          <div 
            key={app.app_id} 
            draggable={true}
            onDragStart={(e) => handleDragStart(e, app.app_id)}
            onDragOver={(e) => handleDragOver(e, app.app_id)}
            onDragEnd={handleDragEnd}
            onClick={() => handleCardClick(app.app_id)}
            className={`app-card-draggable ${draggedAppId === app.app_id ? 'dragging' : ''}`}
            style={{ 
              backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border-color)', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'grab',
              transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              opacity: draggedAppId === app.app_id ? 0.4 : 1,
              position: 'relative'
            }}
          >
            <div className="grip-handle-container">
              <GripVertical size={18} />
            </div>
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
