import React, { useState } from 'react';
import { BookOpen, Terminal, Code, ChevronDown, ChevronRight, Server } from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  desc: string;
  headers?: string;
  body?: string;
  response: string;
}

interface EndpointGroup {
  group: string;
  items: Endpoint[];
}

const apiDocs: EndpointGroup[] = [
  {
    group: 'Authentication & IAM',
    items: [
      {
        method: 'POST', path: '/api/login', desc: 'Authenticate user against Core Platform.',
        body: '{\n  "username": "admin",\n  "password": "password"\n}',
        response: '{\n  "id": "1001",\n  "username": "admin",\n  "name": "System Admin",\n  "role": "admin",\n  "status": "Active"\n}'
      },
      {
        method: 'GET', path: '/api/users', desc: 'Fetch all registered users. Useful for sub-apps needing personnel references.',
        response: '[\n  {\n    "id": "1001",\n    "username": "admin",\n    "name": "System Admin",\n    "role": "admin"\n  }\n]'
      }
    ]
  },
  {
    group: 'Global Audit Trail',
    items: [
      {
        method: 'GET', path: '/api/audit', desc: 'Retrieve the latest 100 audit logs across all platforms.',
        response: '[\n  {\n    "id": 1,\n    "user_name": "System Admin",\n    "action": "LOGIN",\n    "timestamp": "2024-05-11 15:30:00"\n  }\n]'
      },
      {
        method: 'POST', path: '/api/audit', desc: 'Push a new audit log event from a Sub-app to the Core DB.',
        body: '{\n  "user_name": "SubApp-PMS",\n  "action": "APPROVE_BUDGET",\n  "details": "Approved budget for project 104"\n}',
        response: '{\n  "success": true,\n  "id": 42\n}'
      }
    ]
  },
  {
    group: 'Storage Gateway',
    items: [
      {
        method: 'POST', path: '/api/storage/upload', desc: 'Upload a file centrally. Requires multipart/form-data.',
        headers: 'X-User-Name: <Uploader Name>',
        body: 'FormData {\n  file: (Binary File Object)\n}',
        response: '{\n  "success": true,\n  "filename": "170000000-doc.pdf",\n  "path": "/storage/170000000-doc.pdf"\n}'
      },
      {
        method: 'GET', path: '/api/storage/files', desc: 'List all files stored in the core local storage.',
        response: '[\n  {\n    "name": "170000000-doc.pdf",\n    "size": 102400,\n    "createdAt": "2024-05-11T00:00:00.000Z"\n  }\n]'
      },
      {
        method: 'DELETE', path: '/api/storage/files/:filename', desc: 'Soft-delete a file from storage.',
        response: '{\n  "success": true,\n  "message": "File soft-deleted successfully"\n}'
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
      case 'GET': return '#3b82f6'; // Blue
      case 'POST': return '#10b981'; // Green
      case 'PUT': return '#f59e0b'; // Orange
      case 'DELETE': return '#ef4444'; // Red
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Developer API Documentation</h1>
          <p className="page-subtitle">Endpoints available for Micro-Frontend Sub-apps to interface with the Core OS.</p>
        </div>
        <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Server size={18} color="var(--accent-color)" />
          <span style={{ fontWeight: 600 }}>Base URL: http://localhost:3001</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {apiDocs.map((section) => {
          const isExpanded = expandedGroups.includes(section.group);
          return (
            <div key={section.group} style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              
              <div onClick={() => toggleGroup(section.group)} style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', backgroundColor: 'var(--bg-tertiary)', borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none' }}>
                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <BookOpen size={20} color="var(--accent-color)" />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{section.group}</h2>
              </div>

              {isExpanded && (
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {section.items.map((endpoint, idx) => (
                    <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: getMethodColor(endpoint.method), padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.25rem', minWidth: '70px', textAlign: 'center' }}>
                          {endpoint.method}
                        </span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '1rem' }}>{endpoint.path}</span>
                      </div>
                      
                      <div style={{ padding: '1rem' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>{endpoint.desc}</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Terminal size={12} /> Request Details
                            </h4>
                            <div style={{ backgroundColor: '#1e293b', color: '#e2e8f0', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontFamily: 'monospace', minHeight: '120px', whiteSpace: 'pre-wrap' }}>
                              {endpoint.headers && <div style={{ marginBottom: '0.5rem', color: '#93c5fd' }}>Headers: {endpoint.headers}</div>}
                              {endpoint.body ? endpoint.body : 'No Request Body Required'}
                            </div>
                          </div>
                          
                          <div>
                            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Code size={12} /> Expected Response
                            </h4>
                            <div style={{ backgroundColor: '#1e293b', color: '#e2e8f0', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontFamily: 'monospace', minHeight: '120px', whiteSpace: 'pre-wrap' }}>
                              {endpoint.response}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApiDocs;
