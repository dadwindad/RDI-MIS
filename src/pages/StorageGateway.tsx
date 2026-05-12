import React, { useState, useEffect } from 'react';
import { HardDrive, Upload, File, Trash2, Download } from 'lucide-react';
import { User } from '../services/db';

interface StorageGatewayProps {
  currentUser: User;
}

interface FileData {
  filename: string;
  displayName: string;
  appSource: string;
  activity: string;
  uploader: string;
  url: string;
  size: number;
  isDeleted: boolean;
  createdAt: string;
}

const StorageGateway: React.FC<StorageGatewayProps> = ({ currentUser }) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/storage/files');
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: { 'X-User-Name': currentUser.name },
        body: formData
      });
      if (res.ok) {
        await fetchFiles();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleClearDeleted = async () => {
    if (!confirm("คุณต้องการลบไฟล์ที่ Soft Delete ทั้งหมดอย่างถาวรใช่หรือไม่?")) return;
    try {
      const res = await fetch('/api/storage/clear-deleted', {
        method: 'POST',
        headers: { 'X-User-Name': currentUser.name }
      });
      if (res.ok) {
        await fetchFiles();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file => 
    file.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.appSource.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.activity && file.activity.toLowerCase().includes(searchTerm.toLowerCase())) ||
    file.uploader.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFiles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Local Storage Gateway</h1>
          <p className="page-subtitle">FR-RES-01: Centralized local storage provider for sub-apps.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={handleClearDeleted}
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-danger)', border: 'none', 
              padding: '0.75rem 1.5rem', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem',
              alignItems: 'center', cursor: 'pointer', fontWeight: 600
            }}
          >
            <Trash2 size={20} /> ล้างไฟล์ที่ลบ
          </button>
          <label style={{ 
            backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', 
            padding: '0.75rem 1.5rem', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem',
            alignItems: 'center', cursor: isUploading ? 'wait' : 'pointer', fontWeight: 600
          }}>
            <Upload size={20} /> {isUploading ? 'Uploading...' : 'Upload File'}
            <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--accent-light)', borderRadius: '0.75rem', color: 'var(--accent-color)' }}>
            <HardDrive size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Storage Used</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {formatBytes(files.reduce((acc, file) => acc + file.size, 0))}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Across {files.length} files</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.75rem', color: 'var(--status-danger)' }}>
            <Trash2 size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Soft Deleted Storage</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-danger)' }}>
              {formatBytes(files.filter(f => f.isDeleted).reduce((acc, file) => acc + file.size, 0))}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Across {files.filter(f => f.isDeleted).length} files</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="ค้นหาตามชื่อไฟล์, แหล่งที่มา, กิจกรรม หรือผู้อัปโหลด..." 
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
              <th>File Name</th>
              <th>App Source</th>
              <th>Activity</th>
              <th>Uploader</th>
              <th>Size</th>
              <th>Uploaded Date</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(file => (
              <tr key={file.filename} style={{ opacity: file.isDeleted ? 0.6 : 1, backgroundColor: file.isDeleted ? 'var(--bg-tertiary)' : 'transparent' }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <a href={file.url} download={file.displayName} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 500, color: file.isDeleted ? 'var(--text-secondary)' : 'var(--accent-color)', textDecoration: file.isDeleted ? 'line-through' : 'none' }}>
                      <File size={16} />
                      {file.displayName}
                    </a>
                    {file.isDeleted && <span className="badge badge-danger">Soft Deleted</span>}
                  </div>
                </td>
                <td><span className="badge badge-success">{file.appSource}</span></td>
                <td><span className="badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-color)' }}>{file.activity || 'General'}</span></td>
                <td style={{ color: 'var(--text-secondary)' }}>{file.uploader}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{formatBytes(file.size)}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {new Date(file.createdAt).toLocaleString('th-TH')}
                </td>
              </tr>
            ))}
            {currentItems.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No files found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredFiles.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            แสดง {indexOfFirstItem + 1} ถึง {Math.min(indexOfLastItem, filteredFiles.length)} จาก {filteredFiles.length} รายการ
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

export default StorageGateway;
