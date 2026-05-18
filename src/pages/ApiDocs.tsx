import React, { useState } from 'react';
import { BookOpen, Terminal, Code, ChevronDown, ChevronRight, Server, Shield, Database, Settings, Activity, Calendar, FileText } from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  desc: string;
  headers?: string;
  body?: string;
  response: string;
}

interface EndpointGroup {
  group: string;
  icon: React.ReactNode;
  port: string;
  items: Endpoint[];
}

const apiDocs: EndpointGroup[] = [
  {
    group: 'Identity & Access (IAM)',
    icon: <Shield size={20} />,
    port: '3801',
    items: [
      {
        method: 'POST', path: '/api/login', desc: 'Authenticate user and receive profile data.',
        body: '{\n  "username": "admin",\n  "password": "password"\n}',
        response: '{\n  "id": "1001",\n  "username": "admin",\n  "name": "สมมติ นามสมมติ",\n  "role": "admin",\n  "dept": "IT Division"\n}'
      },
      {
        method: 'GET', path: '/api/users', desc: 'List all registered system users.',
        response: '[\n  {\n    "id": "1001",\n    "username": "admin",\n    "name": "สมมติ",\n    "role": "admin"\n  }\n]'
      },
      {
        method: 'POST', path: '/api/users', desc: 'Create a new user account (Admin only).',
        body: '{\n  "username": "newuser",\n  "password": "...",\n  "name": "...",\n  "role": "staff"\n}',
        response: '{\n  "success": true,\n  "id": "1715690000"\n}'
      }
    ]
  },
  {
    group: 'Platform Configuration',
    icon: <Settings size={20} />,
    port: '3801',
    items: [
      {
        method: 'GET', path: '/api/fiscal-years', desc: 'Get list of all fiscal years and their states (Planning, Active, Archived).',
        response: '[\n  { "year": "2567", "state": "Active", "desc": "Current Year" }\n]'
      },
      {
        method: 'GET', path: '/api/apps', desc: 'Retrieve registered sub-apps (Micro-frontends) information.',
        response: '[\n  { "app_id": "org-pms", "name": "PMS", "entry_url": "..." }\n]'
      },
      {
        method: 'GET', path: '/api/audit', desc: 'Retrieve the global audit trail (latest 100 logs).',
        response: '[\n  { "user_name": "Admin", "action": "LOGIN", "timestamp": "..." }\n]'
      }
    ]
  },
  {
    group: 'Local Storage Gateway',
    icon: <Database size={20} />,
    port: '3801',
    items: [
      {
        method: 'POST', path: '/api/storage/upload', desc: 'Centralized file upload. Used by all sub-apps.',
        headers: 'X-User-Name: Name, Content-Type: multipart/form-data',
        body: 'FormData {\n  file: (Binary),\n  appSource: "QA-App",\n  activity: "KPI-Evidence"\n}',
        response: '{\n  "success": true,\n  "filename": "[QA]_[KPI]_[Admin]_file.pdf",\n  "path": "/storage/..."\n}'
      },
      {
        method: 'DELETE', path: '/api/storage/files/:filename', desc: 'Soft-delete a file from central storage.',
        response: '{\n  "success": true\n}'
      }
    ]
  },
  {
    group: 'PMS: Project Management',
    icon: <Activity size={20} />,
    port: '3802',
    items: [
      {
        method: 'GET', path: '/api/pms/projects', desc: 'Get all research projects.',
        response: '[\n  { "id": "PRJ-1", "title_th": "...", "budget_amount": 50000 }\n]'
      },
      {
        method: 'POST', path: '/api/pms/projects/:id/deduct', desc: 'Deduct budget and record transaction.',
        body: '{\n  "amount": 5000,\n  "description": "Lab Equipment",\n  "action_date": "2024-05-14"\n}',
        response: '{\n  "success": true,\n  "txId": "TX-171569..."\n}'
      },
      {
        method: 'GET', path: '/api/pms/aggregated-data', desc: 'Aggregated source for QA Inbox (Projects + Calendar Activities).',
        response: '[\n  { "id": "PRJ-1", "title": "...", "source": "PMS", "type": "โครงการ" }\n]'
      }
    ]
  },
  {
    group: 'Smart Office: Calendar & e-Doc',
    icon: <Calendar size={20} />,
    port: '3803',
    items: [
      {
        method: 'GET', path: '/api/activities', desc: 'List all staff activities and events.',
        response: '[\n  { "id": "ACT-1", "title": "Conference", "start_date": "..." }\n]'
      },
      {
        method: 'GET', path: '/api/smart-office/documents/board', desc: 'Get e-Documents grouped by Kanban status.',
        response: '{\n  "PENDING": [...],\n  "IN_PROGRESS": [...],\n  "COMPLETED": [...]\n}'
      },
      {
        method: 'PATCH', path: '/api/smart-office/documents/:id/status', desc: 'Update document workflow status (RBAC enforced).',
        body: '{\n  "new_status": "WAITING_SIGN"\n}',
        response: '{\n  "success": true\n}'
      }
    ]
  },
  {
    group: 'QA: Performance Metrics',
    icon: <FileText size={20} />,
    port: '3805',
    items: [
      {
        method: 'GET', path: '/api/qa/frameworks', desc: 'List KPI Frameworks (e.g., EdPEx, SMS).',
        response: '[\n  { "id": "FW-1", "name": "EdPEx 2024", "fiscal_year": "2567" }\n]'
      },
      {
        method: 'POST', path: '/api/qa/kpis', desc: 'Add a new KPI with multiple targets.',
        body: '{\n  "framework_id": "...",\n  "code": "1.1",\n  "targets": [{ "label": "Target 1", "value": 10 }]\n}',
        response: '{\n  "success": true, "id": "KPI-..."\n}'
      },
      {
        method: 'POST', path: '/api/qa/mappings', desc: 'Map a Project or Activity as evidence for a KPI.',
        body: '{\n  "kpi_id": "...",\n  "source_app": "PMS",\n  "source_ref_id": "PRJ-1",\n  "source_title": "Project X"\n}',
        response: '{\n  "success": true, "id": 42\n}'
      }
    ]
  }
];

const ApiDocs: React.FC = () => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(apiDocs.map(g => g.group));

  const toggleGroup = (group: string) => {
    if (expandedGroups.includes(group)) {
      setExpandedGroups(expandedGroups.filter(g => g !== group));
    } else {
      setExpandedGroups([...expandedGroups, group]);
    }
  };

  const getMethodColor = (method: string) => {
    switch(method) {
      case 'GET': return '#3b82f6';
      case 'POST': return '#10b981';
      case 'PUT': return '#f59e0b';
      case 'PATCH': return '#8b5cf6';
      case 'DELETE': return '#ef4444';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Developer API Documentation</h1>
          <p className="page-subtitle">Standardized endpoints for Micro-Frontend (Sub-apps) and external integrations.</p>
        </div>
        <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Server size={20} color="var(--accent-color)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Host</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>http://localhost</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {apiDocs.map((section) => {
          const isExpanded = expandedGroups.includes(section.group);
          return (
            <div key={section.group} style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '1.25rem', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              
              <div onClick={() => toggleGroup(section.group)} style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', backgroundColor: 'var(--bg-tertiary)', borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none', transition: 'all 0.2s' }}>
                <div style={{ color: isExpanded ? 'var(--accent-color)' : 'var(--text-secondary)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                  <ChevronDown size={20} />
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)' }}>
                  {section.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{section.group}</h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>Service Port: {section.port}</span>
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {section.items.map((endpoint, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'white', padding: '0.3rem 0.75rem', backgroundColor: getMethodColor(endpoint.method), borderRadius: '0.5rem', minWidth: '75px', textAlign: 'center', boxShadow: '0 4px 10px -2px ' + getMethodColor(endpoint.method) + '44' }}>
                          {endpoint.method}
                        </span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{endpoint.path}</span>
                      </div>
                      
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9rem', lineHeight: 1.5, paddingLeft: '0.25rem' }}>{endpoint.desc}</p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.25rem' }}>
                            <Terminal size={12} /> Request Details
                          </div>
                          <div style={{ backgroundColor: '#0f172a', color: '#cbd5e1', padding: '1.25rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontFamily: '"JetBrains Mono", monospace', border: '1px solid #1e293b', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                            {endpoint.headers && <div style={{ marginBottom: '0.75rem', color: '#60a5fa', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}><span style={{ color: '#94a3b8' }}>Headers:</span> {endpoint.headers}</div>}
                            {endpoint.body ? endpoint.body : <span style={{ color: '#64748b', fontStyle: 'italic' }}>No request body required</span>}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.25rem' }}>
                            <Code size={12} /> Success Response (200 OK)
                          </div>
                          <div style={{ backgroundColor: '#0f172a', color: '#10b981', padding: '1.25rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontFamily: '"JetBrains Mono", monospace', border: '1px solid #1e293b', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                            {endpoint.response}
                          </div>
                        </div>
                      </div>
                      {idx < section.items.length - 1 && <div style={{ marginTop: '2rem', borderBottom: '1px dashed var(--border-color)' }} />}
                    </div>
                  ))}
                </div>
              )}

            </div>
          );
        })}
      </div>
      <div style={{ height: '3rem' }} />
    </div>
  );
};

export default ApiDocs;
