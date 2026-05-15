import React, { useState, useEffect } from 'react';
import { Blocks, Plus, Trash2, CheckCircle, Edit2, X, Wallet, ChevronLeft, Paperclip, CheckSquare, FileText, User, Eye } from 'lucide-react';

const ProjectDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  
  // States สำหรับ Modal สร้าง/แก้ไขโครงการ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: '', fiscal_year_id: '', fund_type: 'ทุนสนับสนุนงานมูลฐาน (Fundamental Fund)', title_th: '', title_en: '', budget_amount: 0, manager_name: '', staff_name: '' });

  // States สำหรับจัดการ Fund Type
  const [fundTypes, setFundTypes] = useState([]);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [newFundName, setNewFundName] = useState('');

  // States สำหรับหน้ารายละเอียดโครงการ (จัดการงบ)
  const [selectedProject, setSelectedProject] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  // States สำหรับ Modal ตัดยอด / แนบเอกสาร / ปิดโครงการ
  const [actionModal, setActionModal] = useState({ isOpen: false, type: '', data: {} });

  // States สำหรับ Filter ปีงบประมาณ
  const currentYear = (new Date().getFullYear() + 543).toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getAuthToken = () => {
    let token = localStorage.getItem('core_jwt_token');
    const savedUser = localStorage.getItem('ricp_current_user');
    
    if (savedUser) {
      const user = JSON.parse(savedUser);
      const payload = { id: user.id, name: user.name, role: user.role };
      const payloadStr = JSON.stringify(payload);
      const payloadB64 = btoa(encodeURIComponent(payloadStr).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode(parseInt(p1, 16));
      }));
      token = "header." + payloadB64 + ".signature";
      localStorage.setItem('core_jwt_token', token);
    } else if (!token) {
      const mockPayload = { id: 1, name: 'Admin Officer', role: 'admin' };
      token = "header." + btoa(JSON.stringify(mockPayload)) + ".signature";
      localStorage.setItem('core_jwt_token', token);
    }
    return token;
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:3002/api/pms/projects', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        setProjects(await res.json());
        setErrorMsg('');
      } else {
        throw new Error('API Error');
      }
    } catch (e) {
      setErrorMsg('Cannot connect to PMS Backend. Please ensure that PMS Server (Port 3002) is running.');
    }
  };

  const fetchTransactions = async (projectId) => {
    try {
      const res = await fetch(`http://localhost:3002/api/pms/projects/${projectId}/transactions`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        setTransactions(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTransaction = async (txId) => {
    if (!window.confirm('คุณต้องการลบประวัติการเบิกจ่ายนี้ใช่หรือไม่? ยอดเงินจะถูกคืนเข้าโครงการ')) return;
    try {
      const res = await fetch(`http://localhost:3002/api/pms/transactions/${txId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        fetchTransactions(selectedProject.id);
        const projectsRes = await fetch('http://localhost:3002/api/pms/projects', { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const allProjects = await projectsRes.json();
        const updatedProject = allProjects.find(p => p.id === selectedProject.id);
        setSelectedProject(updatedProject);
        setProjects(allProjects);
      } else {
        alert('Failed to delete transaction');
      }
    } catch (e) {
      console.error(e);
      alert('Error: ' + e.message);
    }
  };

  const fetchFundTypes = async () => {
    try {
      const res = await fetch('http://localhost:3002/api/pms/fund-types', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          // Fallback ถ้าใน DB ไม่มีข้อมูล
          setFundTypes([
            { id: 'FUND-1', name: 'ทุนสนับสนุนงานมูลฐาน (Fundamental Fund)' },
            { id: 'FUND-2', name: 'ทุนวิจัยภายใน (RDI)' },
            { id: 'FUND-3', name: 'ทุนวิจัยภายนอก (External)' }
          ]);
        } else {
          setFundTypes(data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/users');
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch users from core-app', e);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchFundTypes();
    fetchUsers();
  }, []);

  useEffect(() => {
    const openProjectId = localStorage.getItem('pms_open_project_id');
    if (openProjectId && projects.length > 0) {
      const prj = projects.find(p => p.id === openProjectId);
      if (prj) {
        setSelectedProject(prj);
        fetchTransactions(prj.id);
        localStorage.removeItem('pms_open_project_id');
      }
    }
  }, [projects]);

  const handleSaveProject = async (e) => {
    e.preventDefault();
    try {
      const url = isEditing ? `http://localhost:3002/api/pms/projects/${formData.id}` : 'http://localhost:3002/api/pms/projects';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchProjects();
      }
    } catch (e) {
      alert("Failed to save. Is the PMS backend running on port 3002?");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setActionModal(prev => ({
        ...prev,
        data: { ...prev.data, document_base64: ev.target.result, document_name: file.name }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    const { type, data } = actionModal;
    const { id } = selectedProject;
    
    let url = '';
    let payload = {};
    let method = 'POST';

    if (type === 'ATTACH') {
      url = `http://localhost:3002/api/pms/projects/${id}/attach`;
      payload = { document_base64: data.document_base64, document_name: data.document_name, document_url: data.document_url };
    } else if (type === 'DEDUCT') {
      url = `http://localhost:3002/api/pms/projects/${id}/deduct`;
      payload = { amount: parseFloat(data.amount), description: data.description, action_date: data.action_date, document_base64: data.document_base64, document_name: data.document_name, document_url: data.document_url };
    } else if (type === 'CLOSE') {
      url = `http://localhost:3002/api/pms/projects/${id}/close`;
      payload = { document_base64: data.document_base64, document_name: data.document_name, document_url: data.document_url };
    } else if (type === 'EDIT_TRANSACTION') {
      url = `http://localhost:3002/api/pms/transactions/${data.id}`;
      payload = { amount: parseFloat(data.amount), description: data.description, action_date: data.action_date };
      method = 'PUT';
    }

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setActionModal({ isOpen: false, type: '', data: {} });
        fetchTransactions(id);
        
        // Refresh project details manually
        const projectsRes = await fetch('http://localhost:3002/api/pms/projects', { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const allProjects = await projectsRes.json();
        const updatedProject = allProjects.find(p => p.id === id);
        setSelectedProject(updatedProject);
        setProjects(allProjects);
      } else {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await res.json();
          alert(`Error: ${error.error}`);
        } else {
          const text = await res.text();
          console.error("Server HTML Error:", text);
          if (res.status === 413) {
            alert(`Error: ไฟล์ที่คุณอัปโหลดมีขนาดใหญ่เกินไป (เกิน 50MB) กรุณาใช้ไฟล์ที่เล็กลง`);
          } else {
            alert(`Server Error (${res.status}): โปรดรีสตาร์ท PMS Backend (npm run server) แล้วลองใหม่`);
          }
        }
      }
    } catch (e) {
      console.error(e);
      alert("Failed to perform action: " + e.message);
    }
  };

  const handleRemoveDocument = async (doc_type, url) => {
    if (!window.confirm('คุณต้องการลบเอกสารแนบนี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch(`http://localhost:3002/api/pms/projects/${selectedProject.id}/remove-document`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_type, url })
      });
      if (res.ok) {
        // Refresh project details manually
        const projectsRes = await fetch('http://localhost:3002/api/pms/projects', { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const allProjects = await projectsRes.json();
        const updatedProject = allProjects.find(p => p.id === selectedProject.id);
        setSelectedProject(updatedProject);
        setProjects(allProjects);
      } else {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errData = await res.json();
          alert(`Failed to remove document: ${errData.error}`);
        } else {
          alert(`Failed to remove document (Status ${res.status}). กรุณารีสตาร์ทเซิร์ฟเวอร์ (npm run server) อีกครั้งครับ`);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Error removing document: " + e.message);
    }
  };

  const approveProject = async (id) => {
    if (window.confirm('Approve this project?')) {
      await fetch(`http://localhost:3002/api/pms/projects/${id}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' })
      });
      fetchProjects();
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(val || 0);

  const getFileIcon = (filename) => {
    if (!filename) return <FileText size={16} />;
    const lower = filename.toLowerCase();
    if (lower.endsWith('.pdf')) return <FileText size={16} color="#ef4444" />;
    if (lower.match(/\.(doc|docx)$/)) return <FileText size={16} color="#2563eb" />;
    if (lower.match(/\.(xls|xlsx)$/)) return <FileText size={16} color="#10b981" />;
    if (lower.match(/\.(png|jpg|jpeg)$/)) return <FileText size={16} color="#8b5cf6" />;
    return <FileText size={16} />;
  };

  const renderDocumentLink = (url, truncate = true) => {
    if (!url) return null;
    let name = url.split('/').pop();
    try { name = decodeURIComponent(name); } catch(e){}
    
    // ตัดเอา prefix [PMS]_[Uploader]_[Timestamp]- ออกให้เหลือแค่ชื่อไฟล์
    const match = name.match(/^\[(.*?)\]_\[(.*?)\]_\d+-(.*)/);
    if (match) {
      name = match[3];
    } else if (name.match(/^\d+-/)) {
      name = name.substring(name.indexOf('-') + 1);
    }
    
    let displayName = name;
    if (truncate && name.length > 20) {
      const extIndex = name.lastIndexOf('.');
      if (extIndex !== -1) {
        const ext = name.substring(extIndex);
        displayName = name.substring(0, 20) + '...' + ext;
      } else {
        displayName = name.substring(0, 20) + '...';
      }
    }
    
    return (
      <a href={url} target="_blank" rel="noreferrer" title={name} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-color)', textDecoration: 'none', backgroundColor: 'var(--bg-tertiary)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
        {getFileIcon(name)} {displayName}
      </a>
    );
  };

  // การคำนวณข้อมูล Filter & Stats
  const availableYears = [...new Set(projects.map(p => p.fiscal_year_id))].sort((a, b) => b - a);
  if (!availableYears.includes(currentYear)) availableYears.unshift(currentYear);

  const yearFilteredProjects = selectedYear === 'ALL' ? projects : projects.filter(p => p.fiscal_year_id === selectedYear);

  const filteredProjects = yearFilteredProjects.filter(p => 
    p.title_th?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.title_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.manager_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.staff_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const stats = {
    total: filteredProjects.length,
    draft: filteredProjects.filter(p => p.status === 'DRAFT').length,
    active: filteredProjects.filter(p => p.status === 'APPROVED').length,
    closed: filteredProjects.filter(p => p.status === 'CLOSED').length,
    total_budget: filteredProjects.reduce((sum, p) => sum + (p.budget_amount || 0), 0),
    total_balance: filteredProjects.reduce((sum, p) => sum + (p.budget_balance || 0), 0)
  };

  // ---------- VIEW: รายละเอียดและจัดการงบประมาณ (Project Details) ----------
  if (selectedProject) {
    return (
      <div style={{ padding: '2rem', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button onClick={() => setSelectedProject(null)} style={{ background: 'var(--bg-secondary)', border: 'none', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex' }}>
            <ChevronLeft size={20} />
          </button>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {selectedProject.title_th}
            <span className={`badge ${selectedProject.status === 'APPROVED' ? 'badge-success' : selectedProject.status === 'CLOSED' ? 'badge-secondary' : 'badge-warning'}`} style={{ fontSize: '0.75rem' }}>
              {selectedProject.status}
            </span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
          {/* ซ้าย: รายละเอียดและประวัติ */}
          <div>
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>ข้อมูลโครงการ</h3>
              <p><strong>ID:</strong> {selectedProject.id}</p>
              <p><strong>ปีงบประมาณ:</strong> {selectedProject.fiscal_year_id}</p>
              <p><strong>ประเภทงบ:</strong> {selectedProject.fund_type}</p>
              {selectedProject.proposal_doc_url && (() => {
                let docs = [];
                try { docs = JSON.parse(selectedProject.proposal_doc_url); }
                catch(e) { docs = [selectedProject.proposal_doc_url]; }
                return (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>เอกสารแนบโครงการ:</strong> <br/>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                      {docs.map((docUrl, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {renderDocumentLink(docUrl, false)}
                          <button onClick={() => handleRemoveDocument('proposal', docUrl)} style={{ background: 'transparent', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', padding: '0.25rem' }} title="ลบเอกสาร"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              
              {selectedProject.closure_doc_url && (() => {
                let docs = [];
                try { docs = JSON.parse(selectedProject.closure_doc_url); }
                catch(e) { docs = [selectedProject.closure_doc_url]; }
                return (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>เอกสารปิดโครงการ:</strong> <br/>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                      {docs.map((docUrl, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {renderDocumentLink(docUrl, false)}
                          <button onClick={() => handleRemoveDocument('closure', docUrl)} style={{ background: 'transparent', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', padding: '0.25rem' }} title="ลบเอกสาร"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>ประวัติการตัดยอดงบประมาณ</h3>
              {transactions.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>ยังไม่มีประวัติการเบิกจ่าย</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '0.5rem' }}>วันที่</th>
                      <th style={{ padding: '0.5rem' }}>รายการ</th>
                      <th style={{ padding: '0.5rem' }}>ยอดเบิก</th>
                      <th style={{ padding: '0.5rem' }}>ผู้ทำรายการ</th>
                      <th style={{ padding: '0.5rem' }}>เอกสาร</th>
                      <th style={{ padding: '0.5rem' }}>การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem' }}>{new Date(tx.action_date || tx.created_at).toLocaleDateString('th-TH')}</td>
                        <td style={{ padding: '0.5rem' }}>{tx.description}</td>
                        <td style={{ padding: '0.5rem', color: 'var(--status-danger)', fontWeight: 500 }}>-{formatCurrency(tx.amount)}</td>
                        <td style={{ padding: '0.5rem' }}><span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><User size={12}/>{tx.created_by}</span></td>
                        <td style={{ padding: '0.5rem' }}>
                          {tx.document_url && renderDocumentLink(tx.document_url)}
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <button onClick={() => setActionModal({ isOpen: true, type: 'EDIT_TRANSACTION', data: tx })} style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '0.25rem' }} title="แก้ไข"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteTransaction(tx.id)} style={{ background: 'transparent', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', padding: '0.25rem' }} title="ลบ"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ขวา: ควบคุมงบประมาณและ Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>งบประมาณคงเหลือ</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--status-success)', marginBottom: '0.5rem' }}>
                {formatCurrency(selectedProject.budget_amount - transactions.reduce((sum, tx) => sum + tx.amount, 0))}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>จากงบจัดสรรทั้งหมด: {formatCurrency(selectedProject.budget_amount)}</div>
            </div>

            {selectedProject.status !== 'CLOSED' && (
              <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0' }}>การจัดการ (Actions)</h4>
                
                <button onClick={() => setActionModal({ isOpen: true, type: 'ATTACH', data: { document_url: '', document_base64: '', document_name: '' } })} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                  <Paperclip size={16} /> แนบเอกสารโครงการ
                </button>
                
                <button onClick={() => setActionModal({ isOpen: true, type: 'DEDUCT', data: { amount: 0, description: '', action_date: new Date().toISOString().split('T')[0], document_url: '', document_base64: '', document_name: '' } })} style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-danger)', border: '1px solid var(--status-danger)', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', fontWeight: 500 }}>
                  <Wallet size={16} /> ตัดยอดเบิกจ่าย (หักงบ)
                </button>

                <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }}></div>
                
                <button onClick={() => setActionModal({ isOpen: true, type: 'CLOSE', data: { document_url: '', document_base64: '', document_name: '' } })} style={{ padding: '0.75rem', backgroundColor: 'var(--text-primary)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', fontWeight: 500 }}>
                  <CheckSquare size={16} /> ปิดโครงการ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal สำหรับ Action ต่างๆ */}
        {actionModal.isOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>
                  {actionModal.type === 'ATTACH' && 'แนบเอกสารโครงการ'}
                  {actionModal.type === 'DEDUCT' && 'ตัดยอดเบิกจ่าย'}
                  {actionModal.type === 'CLOSE' && 'ปิดโครงการ'}
                  {actionModal.type === 'EDIT_TRANSACTION' && 'แก้ไขรายการเบิกจ่าย'}
                </h3>
                <button onClick={() => setActionModal({ isOpen: false, type: '', data: {} })} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              
              <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(actionModal.type === 'DEDUCT' || actionModal.type === 'EDIT_TRANSACTION') && (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>วันที่ดำเนินการ</label>
                      <input type="date" value={actionModal.data.action_date} onChange={e => setActionModal({ ...actionModal, data: { ...actionModal.data, action_date: e.target.value } })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>จำนวนเงินที่เบิก (THB)</label>
                      <input type="number" min="0.01" step="0.01" value={actionModal.data.amount} onChange={e => setActionModal({ ...actionModal, data: { ...actionModal.data, amount: e.target.value } })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>รายละเอียด/รายการ</label>
                      <input type="text" value={actionModal.data.description} onChange={e => setActionModal({ ...actionModal, data: { ...actionModal.data, description: e.target.value } })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }} required />
                    </div>
                  </>
                )}
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>เอกสารแนบ (อัปโหลดไฟล์ระบบ)</label>
                  <input type="file" onChange={handleFileChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }} />
                  <div style={{ textAlign: 'center', margin: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>- หรือ -</div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>ลิงก์เอกสารอ้างอิงภายนอก (URL)</label>
                  <input type="text" placeholder="https://..." value={actionModal.data.document_url || ''} onChange={e => setActionModal({ ...actionModal, data: { ...actionModal.data, document_url: e.target.value } })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }} />
                </div>
                
                <button type="submit" style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: actionModal.type === 'DEDUCT' ? 'var(--status-danger)' : 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                  {actionModal.type === 'EDIT_TRANSACTION' ? 'บันทึกการแก้ไข' : 'ยืนยันทำรายการ'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------- VIEW: หน้ารวมโครงการ (Dashboard) ----------
  return (
    <div style={{ padding: '2rem', width: '100%', boxSizing: 'border-box' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Blocks color="var(--accent-color)" />
            Project Management System
          </h1>
          <p className="page-subtitle">จัดการข้อเสนอ จัดสรรงบประมาณ และติดตามการเบิกจ่ายโครงการ</p>
        </div>
        <button onClick={() => { setIsEditing(false); setFormData({ id: '', fiscal_year_id: '2568', fund_type: 'ทุนสนับสนุนงานมูลฐาน (Fundamental Fund)', title_th: '', title_en: '', budget_amount: 0, manager_name: '', staff_name: '' }); setIsModalOpen(true); }} style={{ 
          backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', 
          padding: '0.75rem 1.5rem', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem',
          alignItems: 'center', cursor: 'pointer', fontWeight: 600
        }}>
          <Plus size={20} /> Create Draft Proposal
        </button>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-danger)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid var(--status-danger)' }}>
          <strong>Connection Error:</strong> {errorMsg}
        </div>
      )}

      {/* FILTER & STATS SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <label style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>ปีงบประมาณ:</label>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', fontWeight: 600 }}>
            <option value="ALL">ทั้งหมด (All Years)</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year} {year === currentYear ? '(ปีปัจจุบัน)' : ''}</option>
            ))}
          </select>
          <input 
            type="text" 
            placeholder="ค้นหาโครงการ..." 
            value={searchTerm} 
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', flex: 1, backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
          />
          <select 
            value={itemsPerPage} 
            onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
            style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
          >
            <option value={10}>10 รายการ</option>
            <option value={50}>50 รายการ</option>
            <option value={100}>100 รายการ</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>จำนวนโครงการ (ปี {selectedYear === 'ALL' ? 'ทั้งหมด' : selectedYear})</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.total}</div>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
            <span style={{ color: 'var(--status-warning)' }}>ร่าง: {stats.draft}</span> | 
            <span style={{ color: 'var(--status-success)' }}>ดำเนินการ: {stats.active}</span> | 
            <span>ปิด: {stats.closed}</span>
          </div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>ยอดงบประมาณรวม</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{formatCurrency(stats.total_budget)}</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>ยอดคงเหลือรวม</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--status-success)' }}>{formatCurrency(stats.total_balance)}</div>
        </div>
      </div>

      <div className="data-table-wrapper" style={{ backgroundColor: 'var(--bg-color)', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>ID & Year</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Project Details</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Financials</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentProjects.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  No projects found.
                </td>
              </tr>
            ) : currentProjects.map(prj => (
              <tr key={prj.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 500, fontFamily: 'monospace', color: 'var(--accent-color)' }}>{prj.id}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>FY: {prj.fiscal_year_id}</div>
                </td>
                <td style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => { setSelectedProject(prj); fetchTransactions(prj.id); }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prj.title_th}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{prj.title_en}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '0.25rem' }}>{prj.fund_type}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    ผู้รับผิดชอบ: {prj.manager_name || '-'} (หลัก) | {prj.staff_name || '-'} (รอง)
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                    <Wallet size={14} style={{ color: 'var(--text-secondary)' }} />
                    {formatCurrency(prj.budget_amount)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--status-success)', marginTop: '0.25rem' }}>
                    Balance: {formatCurrency(prj.budget_balance)}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge ${prj.status === 'APPROVED' ? 'badge-success' : prj.status === 'CLOSED' ? 'badge-secondary' : 'badge-warning'}`}>
                    {prj.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button onClick={() => { setSelectedProject(prj); fetchTransactions(prj.id); }} style={{ padding: '0.4rem 0.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="ดูรายละเอียด">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => { setIsEditing(true); setFormData({ id: prj.id, fiscal_year_id: prj.fiscal_year_id, fund_type: prj.fund_type, title_th: prj.title_th, title_en: prj.title_en || '', budget_amount: prj.budget_amount, manager_name: prj.manager_name || '', staff_name: prj.staff_name || '' }); setIsModalOpen(true); }} style={{ padding: '0.4rem 0.5rem', color: 'var(--accent-color)', background: 'transparent', border: '1px solid var(--accent-color)', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="แก้ไข">
                      <Edit2 size={16} />
                    </button>
                    {prj.status === 'DRAFT' && (
                      <>
                        <button onClick={() => approveProject(prj.id)} style={{ padding: '0.4rem 0.5rem', color: 'var(--status-success)', background: 'transparent', border: '1px solid var(--status-success)', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={14} /> Approve
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProjects.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            แสดง {indexOfFirstItem + 1} ถึง {Math.min(indexOfLastItem, filteredProjects.length)} จาก {filteredProjects.length} รายการ
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
              disabled={currentPage === 1}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
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
                    backgroundColor: currentPage === i + 1 ? 'var(--accent-color)' : 'var(--bg-color)',
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
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', backgroundColor: currentPage === 1 ? 'var(--accent-color)' : 'var(--bg-color)', color: currentPage === 1 ? 'white' : 'var(--text-primary)', cursor: 'pointer' }}
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
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', backgroundColor: currentPage === totalPages ? 'var(--accent-color)' : 'var(--bg-color)', color: currentPage === totalPages ? 'white' : 'var(--text-primary)', cursor: 'pointer' }}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
              disabled={currentPage === totalPages}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '600px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{isEditing ? 'Edit Draft Proposal' : 'Create Draft Proposal'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSaveProject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Project Title (TH)</label>
                <input type="text" value={formData.title_th} onChange={e => setFormData({...formData, title_th: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Fiscal Year</label>
                  <input type="text" value={formData.fiscal_year_id} onChange={e => setFormData({...formData, fiscal_year_id: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Total Budget (THB)</label>
                  <input type="number" min="0" value={formData.budget_amount} onChange={e => setFormData({...formData, budget_amount: parseFloat(e.target.value) || 0})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }} required />
                  <div style={{ fontSize: '0.875rem', color: 'var(--accent-color)', marginTop: '0.25rem', fontWeight: 500 }}>
                    {formatCurrency(formData.budget_amount)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>ผู้รับผิดชอบหลัก (Manager)</label>
                  <select value={formData.manager_name || ''} onChange={e => setFormData({...formData, manager_name: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-color)' }}>
                    <option value="">เลือกผู้รับผิดชอบหลัก</option>
                    {users.filter(u => u.role === 'manager').map(u => (
                      <option key={u.id} value={u.name}>{u.name} ({u.dept})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>ผู้รับผิดชอบรอง (Staff)</label>
                  <select value={formData.staff_name || ''} onChange={e => setFormData({...formData, staff_name: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-color)' }}>
                    <option value="">เลือกผู้รับผิดชอบรอง</option>
                    {users.filter(u => u.role === 'staff').map(u => (
                      <option key={u.id} value={u.name}>{u.name} ({u.dept})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Fund Type</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select value={formData.fund_type} onChange={e => setFormData({...formData, fund_type: e.target.value})} style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-color)' }}>
                    {fundTypes.map(ft => (
                      <option key={ft.id} value={ft.name}>{ft.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsFundModalOpen(true)} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', cursor: 'pointer' }} title="จัดการ Fund Type">
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FUND TYPE MANAGEMENT MODAL */}
      {isFundModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>จัดการ Fund Type</h2>
              <button onClick={() => setIsFundModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" value={newFundName} onChange={e => setNewFundName(e.target.value)} placeholder="ชื่อ Fund Type ใหม่" style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }} />
                <button onClick={async () => {
                  if (!newFundName.trim()) return;
                  const res = await fetch('http://localhost:3002/api/pms/fund-types', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newFundName })
                  });
                  if (res.ok) {
                    setNewFundName('');
                    fetchFundTypes();
                  }
                }} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 600 }}>
                  เพิ่ม
                </button>
              </div>

              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {fundTypes.map(ft => (
                  <div key={ft.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.25rem' }}>
                    <span>{ft.name}</span>
                    <button onClick={async () => {
                      if (!confirm(`คุณต้องการลบ ${ft.name} ใช่หรือไม่?`)) return;
                      const res = await fetch(`http://localhost:3002/api/pms/fund-types/${ft.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
                      });
                      if (res.ok) {
                        fetchFundTypes();
                      }
                    }} style={{ background: 'transparent', border: 'none', color: 'var(--status-danger)', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDashboard;
