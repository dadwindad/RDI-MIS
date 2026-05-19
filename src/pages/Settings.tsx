import React, { useState } from 'react';
import { Globe, Shield, Bell, Database, Save, CheckCircle } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    orgName: 'Research Institute Core Platform',
    language: 'th',
    timezone: 'Asia/Bangkok',
    jwtExpiration: '15',
    ldapUrl: 'ldap://auth.university.ac.th',
    rateLimit: '1000',
    maintenanceMode: false,
    emailNotifications: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">Configure core platform behaviors, security policies, and integrations.</p>
        </div>
        <button onClick={handleSave} style={{ 
          backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', 
          padding: '0.75rem 1.5rem', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem',
          alignItems: 'center', cursor: 'pointer', fontWeight: 600
        }}>
          {saved ? <CheckCircle size={20} /> : <Save size={20} />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Settings Navigation */}
        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('general')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', textAlign: 'left', backgroundColor: activeTab === 'general' ? 'var(--accent-light)' : 'transparent', color: activeTab === 'general' ? 'var(--accent-color)' : 'var(--text-primary)', fontWeight: activeTab === 'general' ? 600 : 400 }}
          >
            <Globe size={18} /> General
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', textAlign: 'left', backgroundColor: activeTab === 'security' ? 'var(--accent-light)' : 'transparent', color: activeTab === 'security' ? 'var(--accent-color)' : 'var(--text-primary)', fontWeight: activeTab === 'security' ? 600 : 400 }}
          >
            <Shield size={18} /> Security & IAM
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', textAlign: 'left', backgroundColor: activeTab === 'notifications' ? 'var(--accent-light)' : 'transparent', color: activeTab === 'notifications' ? 'var(--accent-color)' : 'var(--text-primary)', fontWeight: activeTab === 'notifications' ? 600 : 400 }}
          >
            <Bell size={18} /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab('advanced')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', textAlign: 'left', backgroundColor: activeTab === 'advanced' ? 'var(--accent-light)' : 'transparent', color: activeTab === 'advanced' ? 'var(--accent-color)' : 'var(--text-primary)', fontWeight: activeTab === 'advanced' ? 600 : 400 }}
          >
            <Database size={18} /> Advanced (API & DB)
          </button>
        </div>

        {/* Settings Content Area */}
        <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>General Preferences</h2>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Organization Name</label>
                <input type="text" value={settings.orgName} onChange={e => handleChange('orgName', e.target.value)} style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-color)' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '600px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>System Language</label>
                  <select value={settings.language} onChange={e => handleChange('language', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-color)' }}>
                    <option value="en">English (US)</option>
                    <option value="th">ภาษาไทย (Thai)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Timezone</label>
                  <select value={settings.timezone} onChange={e => handleChange('timezone', e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-color)' }}>
                    <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Security & Authentication (NFR-SEC-01)</h2>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>JWT Access Token Expiration (Minutes)</label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Short-lived token configuration for Micro-Frontend API access.</p>
                <input type="number" value={settings.jwtExpiration} onChange={e => handleChange('jwtExpiration', e.target.value)} style={{ width: '100px', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-color)' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>LDAP / Active Directory Integration URL</label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Endpoint for central university SSO login.</p>
                <input type="text" value={settings.ldapUrl} onChange={e => handleChange('ldapUrl', e.target.value)} style={{ width: '100%', maxWidth: '500px', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-color)' }} />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Global Notifications</h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input type="checkbox" id="emailNotif" checked={settings.emailNotifications} onChange={e => handleChange('emailNotifications', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)' }} />
                <div>
                  <label htmlFor="emailNotif" style={{ fontWeight: 500, display: 'block' }}>Enable Email Delivery</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allow sub-apps to dispatch emails via Core SMTP relay.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Advanced API Gateway</h2>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>API Rate Limit (Requests per minute per IP)</label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Prevents DDoS and limits excessive sub-app sync requests.</p>
                <input type="number" value={settings.rateLimit} onChange={e => handleChange('rateLimit', e.target.value)} style={{ width: '150px', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-color)' }} />
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem', marginTop: '1rem' }}>
                <h3 style={{ color: 'var(--status-danger)', fontSize: '1rem', marginBottom: '0.5rem' }}>Danger Zone</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>Global Maintenance Mode</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lock out all non-admin users and suspend all Sub-App APIs.</div>
                  </div>
                  <button onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)} style={{ padding: '0.5rem 1rem', backgroundColor: settings.maintenanceMode ? 'var(--status-danger)' : 'transparent', color: settings.maintenanceMode ? 'white' : 'var(--status-danger)', border: `1px solid var(--status-danger)`, borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                    {settings.maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
