import React from 'react';
import { ShieldCheck, Plus } from 'lucide-react';

const RoleMatrix: React.FC = () => {
  const roles = ['System Admin', 'Researcher', 'Finance Officer', 'Director'];
  const permissions = [
    { group: 'Project Mgmt (PMS)', items: ['pms:create', 'pms:approve', 'pms:read_all'] },
    { group: 'Financial System', items: ['finance:view', 'finance:approve', 'finance:disburse'] },
    { group: 'Core Platform', items: ['core:manage_apps', 'core:manage_users'] }
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Role & Permission Matrix</h1>
          <p className="page-subtitle">FR-IAM-02: Map permissions from Sub-Apps to Custom Roles.</p>
        </div>
        <button style={{ 
          backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', 
          padding: '0.75rem 1.5rem', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem',
          alignItems: 'center', cursor: 'pointer', fontWeight: 600
        }}>
          <Plus size={20} /> Create Custom Role
        </button>
      </div>

      <div className="data-table-wrapper" style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: '800px' }}>
          <thead>
            <tr>
              <th style={{ minWidth: '200px' }}>Permission \ Role</th>
              {roles.map(r => <th key={r} style={{ textAlign: 'center' }}>{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {permissions.map(group => (
              <React.Fragment key={group.group}>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <td colSpan={roles.length + 1} style={{ fontWeight: 600, color: 'var(--accent-color)' }}>
                    {group.group}
                  </td>
                </tr>
                {group.items.map(perm => (
                  <tr key={perm}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{perm}</td>
                    {roles.map(r => (
                      <td key={`${perm}-${r}`} style={{ textAlign: 'center' }}>
                        <input type="checkbox" 
                          defaultChecked={
                            (r === 'System Admin') || 
                            (r === 'Finance Officer' && perm.startsWith('finance')) ||
                            (r === 'Researcher' && perm === 'pms:create')
                          } 
                          style={{ width: '16px', height: '16px', accentColor: 'var(--accent-color)' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoleMatrix;
