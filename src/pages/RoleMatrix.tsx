import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus } from 'lucide-react';
import { db, Role } from '../services/db';

const RoleMatrix: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const permissions = [
    { group: 'Project Mgmt (PMS)', items: ['pms:create', 'pms:approve', 'pms:read_all'] },
    { group: 'Financial System', items: ['finance:view', 'finance:approve', 'finance:disburse'] },
    { group: 'Core Platform', items: ['core:manage_apps', 'core:manage_users'] }
  ];

  useEffect(() => {
    db.getRoles().then(setRoles);
  }, []);

  const handleCheckboxChange = async (role: Role, perm: string, checked: boolean) => {
    let newPermissions = [...role.permissions];
    if (checked) {
      newPermissions.push(perm);
    } else {
      newPermissions = newPermissions.filter(p => p !== perm);
    }
    
    const success = await db.updateRole(role.id, newPermissions);
    if (success) {
      setRoles(roles.map(r => r.id === role.id ? { ...r, permissions: newPermissions } : r));
    } else {
      alert('Failed to update role permissions');
    }
  };

  const handleCreateRole = async () => {
    const name = prompt('Enter new role name:');
    if (name) {
      const success = await db.createRole(name, []);
      if (success) {
        db.getRoles().then(setRoles);
      } else {
        alert('Failed to create role');
      }
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Role & Permission Matrix</h1>
          <p className="page-subtitle">Map permissions from Sub-Apps to Custom Roles.</p>
        </div>
        <button onClick={handleCreateRole} style={{ 
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
              {roles.map(r => <th key={r.id} style={{ textAlign: 'center' }}>{r.name}</th>)}
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
                      <td key={`${perm}-${r.id}`} style={{ textAlign: 'center' }}>
                        <input type="checkbox" 
                          checked={r.permissions.includes(perm)} 
                          onChange={e => handleCheckboxChange(r, perm, e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
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
