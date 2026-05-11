import React, { useState, useEffect } from 'react';
import { Users, Blocks, Activity, Server, ArrowUpRight, ArrowDownRight, FolderGit2, Wallet } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [apps, setApps] = useState([]);
  const [projects, setProjects] = useState([]);
  const [storageFiles, setStorageFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Apps
        const appsRes = await fetch('http://localhost:3001/api/apps');
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setApps(appsData);
        }

        // Fetch Storage Files
        const storageRes = await fetch('http://localhost:3001/api/storage/files');
        if (storageRes.ok) {
          const storageData = await storageRes.json();
          setStorageFiles(storageData);
        }

        // Fetch Projects
        const mockPayload = { id: 1, name: 'Admin', role: 'admin' };
        const token = "header." + btoa(JSON.stringify(mockPayload)) + ".signature";
        const pmsRes = await fetch('http://localhost:3002/api/pms/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (pmsRes.ok) {
          const pmsData = await pmsRes.json();
          setProjects(pmsData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeAppsCount = apps.filter(a => a.status === 'Active').length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget_amount || 0), 0);
  const totalStorageSize = storageFiles.reduce((sum, f) => sum + (f.size || 0), 0);
  const formatCurrency = (val: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(val || 0);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Platform Overview</h1>
        <p className="page-subtitle">Welcome to Research Institute Core Platform (RICP) OS</p>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Registered Sub-Apps</div>
            <div className="card-icon"><Blocks size={24} /></div>
          </div>
          <div className="card-value">{apps.length > 0 ? apps.length : '...'}</div>
          <div className="card-trend trend-up">
            <ArrowUpRight size={16} />
            <span>{activeAppsCount} Active Apps</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Total Projects (PMS)</div>
            <div className="card-icon"><FolderGit2 size={24} /></div>
          </div>
          <div className="card-value">{projects.length > 0 ? projects.length : '...'}</div>
          <div className="card-trend trend-up">
            <ArrowUpRight size={16} />
            <span>Across all fiscal years</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Total Allocated Budget</div>
            <div className="card-icon"><Wallet size={24} /></div>
          </div>
          <div className="card-value" style={{ fontSize: '1.5rem' }}>{projects.length > 0 ? formatCurrency(totalBudget) : '...'}</div>
          <div className="card-trend trend-up">
            <ArrowUpRight size={16} />
            <span>Managed by PMS</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Storage Gateway (Used)</div>
            <div className="card-icon"><Server size={24} /></div>
          </div>
          <div className="card-value">
            {storageFiles.length > 0 ? formatBytes(totalStorageSize) : '0 Bytes'}
          </div>
          <div className="card-trend trend-up">
            <ArrowUpRight size={16} />
            <span>{storageFiles.length} indexed files</span>
          </div>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="table-header">
          <h2 className="card-title">Micro-Frontend Sub-Apps Status</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>App ID</th>
              <th>App Name</th>
              <th>Endpoint URL</th>
              <th>Required Roles</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Loading data...</td>
              </tr>
            ) : apps.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No apps registered.</td>
              </tr>
            ) : (
              apps.map((app: any) => (
                <tr key={app.app_id || app.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{app.app_id || app.id}</td>
                  <td style={{ fontWeight: 600 }}>{app.name}</td>
                  <td><a href={app.api_endpoint || app.endpoint_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>{app.api_endpoint || app.endpoint_url}</a></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {app.required_roles ? (() => {
                        try {
                          const roles = typeof app.required_roles === 'string' ? JSON.parse(app.required_roles) : app.required_roles;
                          return Array.isArray(roles) ? roles.map((role: string) => (
                            <span key={role} style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '0.25rem' }}>{role}</span>
                          )) : <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '0.25rem' }}>{roles}</span>;
                        } catch(e) {
                          return <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '0.25rem' }}>{app.required_roles}</span>;
                        }
                      })() : '-'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${app.status === 'Active' ? 'badge-success' : app.status === 'Development' ? 'badge-warning' : 'badge-danger'}`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
