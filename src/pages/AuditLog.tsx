import React, { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';
import { db, AuditLog } from '../services/db';

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    db.getAuditLogs().then(setLogs);
  }, []);

  const filteredLogs = logs.filter(log => 
    log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Global Audit Trail</h1>
          <p className="page-subtitle">FR-RES-02: Centralized inspection of actions from all Sub-apps and Core UI.</p>
        </div>
        <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} color="var(--accent-color)" />
          <span style={{ fontWeight: 600 }}>{filteredLogs.length} Events</span>
        </div>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="ค้นหาตามชื่อผู้ใช้, กิจกรรม หรือรายละเอียด..." 
          value={searchTerm} 
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
          style={{ padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', flex: 1, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
        />
        <select 
          value={itemsPerPage} 
          onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
          style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
        >
          <option value={10}>10 รายการ / หน้า</option>
          <option value={50}>50 รายการ / หน้า</option>
          <option value={100}>100 รายการ / หน้า</option>
        </select>
      </div>

      <div className="data-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(log => (
              <tr key={log.id}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Clock size={14} />
                    {new Date(log.timestamp).toLocaleString('en-GB')}
                  </div>
                </td>
                <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{log.user_name}</td>
                <td>
                  <span style={{ 
                    backgroundColor: 'var(--bg-tertiary)', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '0.25rem', 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    color: log.action.includes('DELETE') ? 'var(--status-danger)' : 
                           log.action.includes('CREATE') ? 'var(--status-success)' : 'var(--accent-color)'
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{log.details}</td>
              </tr>
            ))}
            {currentItems.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredLogs.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            แสดง {indexOfFirstItem + 1} ถึง {Math.min(indexOfLastItem, filteredLogs.length)} จาก {filteredLogs.length} รายการ
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
              disabled={currentPage === 1}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              ก่อนหน้า
            </button>
            
            {totalPages <= 7 ? (
              [...Array(totalPages)].map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentPage(i + 1)} 
                  style={{ 
                    padding: '0.5rem 0.75rem', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '0.375rem', 
                    backgroundColor: currentPage === i + 1 ? 'var(--accent-color)' : 'var(--bg-secondary)',
                    color: currentPage === i + 1 ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  {i + 1}
                </button>
              ))
            ) : (
              <>
                <button 
                  onClick={() => setCurrentPage(1)} 
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', backgroundColor: currentPage === 1 ? 'var(--accent-color)' : 'var(--bg-secondary)', color: currentPage === 1 ? 'white' : 'var(--text-primary)', cursor: 'pointer' }}
                >
                  1
                </button>
                {currentPage > 3 && <span style={{ padding: '0.5rem' }}>...</span>}
                
                {currentPage > 2 && currentPage < totalPages - 1 && (
                  <button style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', backgroundColor: 'var(--accent-color)', color: 'white', cursor: 'pointer' }}>
                    {currentPage}
                  </button>
                )}
                
                {currentPage < totalPages - 2 && <span style={{ padding: '0.5rem' }}>...</span>}
                <button 
                  onClick={() => setCurrentPage(totalPages)} 
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', backgroundColor: currentPage === totalPages ? 'var(--accent-color)' : 'var(--bg-secondary)', color: currentPage === totalPages ? 'white' : 'var(--text-primary)', cursor: 'pointer' }}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
              disabled={currentPage === totalPages}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
