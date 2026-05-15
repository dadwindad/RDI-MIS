import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Inbox,
  Settings,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  LayoutDashboard,
  Search,
  Filter,
  Trash2,
  ArrowLeft,
  ChevronRight,
  Plus,
  X,
  Info,
  Upload,
  FileText,
  Paperclip,
  Download
} from 'lucide-react';

const QAMetrics = ({ setActiveMenu }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [kpis, setKpis] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [yearFilter, setYearFilter] = useState('2567');
  const [categoryFilter, setCategoryFilter] = useState('ทั้งหมด');
  const [isAddingFramework, setIsAddingFramework] = useState(false);
  const [isEditingFramework, setIsEditingFramework] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [isAddingKpi, setIsAddingKpi] = useState(false);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState(null);
  const [viewingFrameworkId, setViewingFrameworkId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null });
  const [isEditingKpi, setIsEditingKpi] = useState(false);
  const [editingKpiId, setEditingKpiId] = useState(null);
  const [targetsModal, setTargetsModal] = useState({ show: false, targets: [], kpiName: '' });
  const [mappingModal, setMappingModal] = useState({ show: false, item: null });
  const [mappingSearch, setMappingSearch] = useState('');
  const [inboxYearFilter, setInboxYearFilter] = useState('ทั้งหมด');
  const [inboxTypeFilter, setInboxTypeFilter] = useState('ทั้งหมด');
  const [inboxPage, setInboxPage] = useState(1);
  const [inboxPerPage, setInboxPerPage] = useState(10);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [mappingYearFilter, setMappingYearFilter] = useState('ทั้งหมด');
  const [evidenceModal, setEvidenceModal] = useState({ show: false, kpi: null, data: [] });
  const [inboxStatusFilter, setInboxStatusFilter] = useState('ทั้งหมด');

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const [newFramework, setNewFramework] = useState({ name: '', fiscal_year: '2567', category: 'มหาวิทยาลัย', description: '' });
  const [newCategory, setNewCategory] = useState('');
  const [newKpi, setNewKpi] = useState({ code: '', name: '', target_value: 0, unit: 'บทความ', weight: 1, description: '', evidence: '', targets: [{ label: 'เป้าหมายหลัก', value: 0, unit: 'บทความ' }] });

  const getAuthToken = () => {
    const userStr = localStorage.getItem('ricp_current_user');
    if (!userStr) return '';
    try {
      const payloadB64 = btoa(unescape(encodeURIComponent(userStr)));
      return `Bearer dummyHeader.${payloadB64}.dummySignature`;
    } catch (e) {
      return '';
    }
  };

  const logAudit = async (action, details) => {
    try {
      const userStr = localStorage.getItem('ricp_current_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      
      await fetch('http://localhost:3001/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: user.name,
          action: `QA_${action}`,
          details: details
        })
      });
    } catch (e) {
      console.error('Failed to log audit', e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mocking API calls since the server might not be running yet in this environment
      // In production: fetch('http://localhost:3005/api/qa/dashboard')
      const kpiRes = await fetch('http://localhost:3005/api/qa/dashboard');
      if (kpiRes.ok) setKpis(await kpiRes.json());

      const fwRes = await fetch('http://localhost:3005/api/qa/frameworks');
      if (fwRes.ok) {
        const fwData = await fwRes.json();
        setFrameworks(fwData);
        if (fwData.length > 0) {
          const latestYear = [...new Set(fwData.map(f => f.fiscal_year))].sort((a, b) => b - a)[0];
          if (latestYear) setYearFilter(latestYear);
        }
      }

      const catRes = await fetch('http://localhost:3005/api/qa/categories');
      if (catRes.ok) setCategories(await catRes.json());

      const token = getAuthToken();
      const inboxRes = await fetch('http://localhost:3005/api/qa/inbox', {
        headers: { 'Authorization': token }
      });
      if (inboxRes.ok) setInbox(await inboxRes.json());
    } catch (e) {
      console.error('Fetch failed', e);
      // Ensure states are empty or handle error UI
      // No hardcoded fallback to allow API data to be the source of truth
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddFramework = async (e) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      const url = isEditingFramework ? `http://localhost:3005/api/qa/frameworks/${selectedFrameworkId}` : 'http://localhost:3005/api/qa/frameworks';
      const method = isEditingFramework ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(newFramework)
      });
      if (res.ok) {
        logAudit(isEditingFramework ? 'UPDATE_FRAMEWORK' : 'CREATE_FRAMEWORK', `${isEditingFramework ? 'Updated' : 'Created'} framework: ${newFramework.name} (${newFramework.fiscal_year})`);
        setIsAddingFramework(false);
        setIsEditingFramework(false);
        setNewFramework({ name: '', fiscal_year: '2567', category: categories[0]?.name || 'มหาวิทยาลัย', description: '' });
        fetchData();
      } else {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const err = await res.json();
          alert(`Error: ${err.error || 'Failed to save framework'}`);
        } else {
          const text = await res.text();
          console.error('Non-JSON error:', text);
          alert(`Server Error: Received non-JSON response (Status ${res.status}). Please check if the QA Backend is running.`);
        }
      }
    } catch (e) { alert(`Connection Error: ${e.message}`); }
  };

  const handleDeleteFramework = async (id) => {
    setConfirmDialog({
      show: true,
      title: 'ลบ Framework',
      message: 'ยืนยันการลบ Framework นี้? ข้อมูล KPI ภายในจะยังคงอยู่ในฐานข้อมูลแต่ไม่ผูกกับ Framework นี้',
      onConfirm: async () => {
        try {
          const token = getAuthToken();
          const res = await fetch(`http://localhost:3005/api/qa/frameworks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
          });
          if (res.ok) {
            const fw = frameworks.find(f => f.id === id);
            logAudit('DELETE_FRAMEWORK', `Deleted framework: ${fw?.name || id}`);
            fetchData();
          }
        } catch (e) { alert(e.message); }
      }
    });
  };

  const handleAddKpi = async (e) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      const url = isEditingKpi ? `http://localhost:3005/api/qa/kpis/${editingKpiId}` : 'http://localhost:3005/api/qa/kpis';
      const method = isEditingKpi ? 'PUT' : 'POST';

      // Sync top-level target_value and unit with the first target in the list
      // This ensures the dashboard (which uses kpis.target_value/unit) stays in sync with settings
      const kpiToSave = { ...newKpi };
      if (kpiToSave.targets && kpiToSave.targets.length > 0) {
        kpiToSave.target_value = kpiToSave.targets[0].value;
        kpiToSave.unit = kpiToSave.targets[0].unit;
      }

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ ...kpiToSave, framework_id: selectedFrameworkId })
      });
      if (res.ok) {
        logAudit(isEditingKpi ? 'UPDATE_KPI' : 'CREATE_KPI', `${isEditingKpi ? 'Updated' : 'Created'} KPI: ${newKpi.code} - ${newKpi.name}`);
        setIsAddingKpi(false);
        setIsEditingKpi(false);
        setNewKpi({ code: '', name: '', target_value: 0, unit: 'บทความ', weight: 1, description: '', evidence: '', targets: [{ label: 'เป้าหมายหลัก', value: 0, unit: 'บทความ' }] });
        fetchData();
      }
    } catch (e) { alert(e.message); }
  };

  const handleFileUpload = async (file, targetIdx) => {
    if (!file) return;
    const formData = new FormData();
    try {
      const userStr = localStorage.getItem('ricp_current_user');
      const user = userStr ? JSON.parse(userStr) : { name: 'Unknown' };
      
      // Fields MUST be appended before file for multer to catch them in req.body
      formData.append('appSource', 'QA Metrics');
      formData.append('activity', 'KPI Target Attachment');
      formData.append('uploader', user.name);
      formData.append('file', file);

      const token = getAuthToken();
      // Using Core System Storage API (Port 3001)
      const res = await fetch('http://localhost:3001/api/storage/upload', {
        method: 'POST',
        headers: {
          'Authorization': token,
          'X-User-Name': encodeURIComponent(user.name)
        },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setNewKpi(prev => ({
          ...prev,
          targets: prev.targets.map((t, i) => 
            i === targetIdx ? { ...t, attachment_path: data.path, attachment_name: file.name } : t
          )
        }));
      }
    } catch (e) { alert(`Upload failed: ${e.message}`); }
  };

  const handleEvidenceUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    try {
      const userStr = localStorage.getItem('ricp_current_user');
      const user = userStr ? JSON.parse(userStr) : { name: 'Unknown' };

      formData.append('appSource', 'QA Metrics');
      formData.append('activity', 'KPI Evidence');
      formData.append('uploader', user.name);
      formData.append('file', file);

      const token = getAuthToken();
      const res = await fetch('http://localhost:3001/api/storage/upload', {
        method: 'POST',
        headers: { 'Authorization': token, 'X-User-Name': encodeURIComponent(user.name) },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setNewKpi(prev => ({ ...prev, evidence_path: data.path, evidence_name: file.name }));
      }
    } catch (e) { alert(`Upload failed: ${e.message}`); }
  };

  const handleDirectTargetUpload = async (file, targetId) => {
    if (!file || !targetId) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = getAuthToken();
      // 1. Upload to Core Storage
      const uploadRes = await fetch('http://localhost:3001/api/storage/upload', {
        method: 'POST',
        headers: { 'Authorization': token, 'X-User-Name': encodeURIComponent('QA App User') },
        body: formData
      });
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        // 2. Update target in QA Backend
        const updateRes = await fetch(`http://localhost:3005/api/qa/targets/${targetId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            attachment_path: data.path,
            attachment_name: file.name
          })
        });
        if (updateRes.ok) {
          // Refresh data to show new attachment
          fetchData();
          // Update local targetsModal state
          const updatedTargets = targetsModal.targets.map(t =>
            t.id === targetId ? { ...t, attachment_path: data.path, attachment_name: file.name } : t
          );
          setTargetsModal({ ...targetsModal, targets: updatedTargets });
        }
      }
    } catch (e) { alert(`Upload failed: ${e.message}`); }
  };

  const handleDeleteKpi = async (id) => {
    setConfirmDialog({
      show: true,
      title: 'ลบตัวชี้วัด (KPI)',
      message: 'ยืนยันการลบตัวชี้วัดนี้? ข้อมูลการเชื่อมโยงทั้งหมดที่เกี่ยวข้องจะถูกลบออกด้วย',
      onConfirm: async () => {
        try {
          const token = getAuthToken();
          const res = await fetch(`http://localhost:3005/api/qa/kpis/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
          });
          if (res.ok) {
            const kpi = kpis.find(k => k.id === id);
            logAudit('DELETE_KPI', `Deleted KPI: ${kpi?.code} - ${kpi?.name}`);
            fetchData();
          }
        } catch (e) { alert(e.message); }
      }
    });
  };

  const handleAddCategory = async (e) => {
    if (!newCategory.trim()) return;
    try {
      const token = getAuthToken();
      const res = await fetch('http://localhost:3005/api/qa/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ name: newCategory })
      });
      if (res.ok) {
        logAudit('CREATE_CATEGORY', `Created KPI category: ${newCategory}`);
        setNewCategory('');
        fetchData();
      } else {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const err = await res.json();
          alert(`Error: ${err.error || 'Failed to add category'}`);
        } else {
          const text = await res.text();
          console.error('Non-JSON error:', text);
          alert(`Server Error: Received non-JSON response (Status ${res.status}). Please check if the QA Backend is running.`);
        }
      }
    } catch (e) { alert(`Connection Error: ${e.message}`); }
  };

  const handleDeleteCategory = async (id) => {
    setConfirmDialog({
      show: true,
      title: 'ลบหมวดหมู่',
      message: 'คุณต้องการลบหมวดหมู่นี้ใช่หรือไม่? (การลบหมวดหมู่จะไม่ลบ Framework ที่ใช้หมวดหมู่นี้อยู่)',
      onConfirm: async () => {
        try {
          const token = getAuthToken();
          const res = await fetch(`http://localhost:3005/api/qa/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
          });
          if (res.ok) {
            const cat = categories.find(c => c.id === id);
            logAudit('DELETE_CATEGORY', `Deleted KPI category: ${cat?.name || id}`);
            fetchData();
          }
        } catch (e) { alert(e.message); }
      }
    });
  };

  const handleMap = async (item, kpiId) => {
    try {
      const token = getAuthToken();
      const res = await fetch('http://localhost:3005/api/qa/mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          kpi_id: kpiId,
          source_app: item.source,
          source_ref_id: item.id,
          source_title: item.title
        })
      });
      if (res.ok) {
        const kpi = kpis.find(k => k.id === kpiId);
        logAudit('MAP_KPI', `Mapped ${item.type} "${item.title}" to KPI: ${kpi?.code} - ${kpi?.name}`);
        showToast('เชื่อมโยงข้อมูลสำเร็จแล้ว!', 'success');
        setMappingModal({ show: false, item: null });
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || 'การเชื่อมโยงข้อมูลล้มเหลว', 'error');
      }
    } catch (e) {
      showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
    }
  };

  const handleUnmap = async (mappingId) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3005/api/qa/mappings/${mappingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        let mappingDetails = "";
        const item = mappingModal.item;
        if (item && item.assigned_mappings) {
          const mapping = item.assigned_mappings.find(m => m.id === mappingId);
          if (mapping) mappingDetails = `KPI: ${mapping.kpi_code} from ${item.type} "${item.title}"`;
        }
        
        logAudit('UNMAP_KPI', `Unmapped ${mappingDetails || mappingId}`);
        showToast('ยกเลิกการเชื่อมโยงข้อมูลสำเร็จ!', 'success');
        
        await fetchData();
        
        if (mappingModal.show && mappingModal.item) {
          const updatedMappings = mappingModal.item.assigned_mappings.filter(m => m.id !== mappingId);
          const mappingToRemove = mappingModal.item.assigned_mappings.find(m => m.id === mappingId);
          const updatedKpiIds = mappingModal.item.assigned_kpi_ids.filter(id => id !== mappingToRemove?.kpi_id);
          
          setMappingModal({
            ...mappingModal,
            item: {
              ...mappingModal.item,
              assigned_mappings: updatedMappings,
              assigned_kpi_ids: updatedKpiIds,
              is_tagged: updatedMappings.length > 0
            }
          });
        }
      } else {
        const err = await res.json();
        showToast(err.error || 'การยกเลิกการเชื่อมโยงข้อมูลล้มเหลว', 'error');
      }
    } catch (e) {
      showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
    }
  };

  const fetchEvidence = async (kpi) => {
    try {
      const res = await fetch(`http://localhost:3005/api/qa/kpis/${kpi.id}/evidence`);
      if (res.ok) {
        const data = await res.json();
        setEvidenceModal({ show: true, kpi, data });
      }
    } catch (e) {
      showToast('ไม่สามารถดึงข้อมูลหลักฐานได้', 'error');
    }
  };

  const filteredKpis = kpis.filter(k => {
    const matchYear = yearFilter === 'ทั้งหมด' || k.fiscal_year === yearFilter;
    const matchCat = categoryFilter === 'ทั้งหมด' || k.category === categoryFilter;
    return matchYear && matchCat;
  });

  const filteredFrameworks = frameworks.filter(f => {
    const matchYear = yearFilter === 'ทั้งหมด' || f.fiscal_year === yearFilter;
    const matchCat = categoryFilter === 'ทั้งหมด' || f.category === categoryFilter;
    return matchYear && matchCat;
  });

  const years = [...new Set(frameworks.map(f => f.fiscal_year))].sort((a, b) => b - a);
  if (years.length === 0) years.push('2567');


  return (
    <div style={{ padding: '1.5rem', color: 'var(--text-primary)' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      {/* QA Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>QA & Performance Metrics</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Data Aggregator & Reporting Service (ระบบประกันคุณภาพ)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
              backgroundColor: activeTab === 'dashboard' ? 'var(--bg-secondary)' : 'transparent',
              boxShadow: activeTab === 'dashboard' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontWeight: activeTab === 'dashboard' ? 600 : 400
            }}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
              backgroundColor: activeTab === 'inbox' ? 'var(--bg-secondary)' : 'transparent',
              boxShadow: activeTab === 'inbox' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontWeight: activeTab === 'inbox' ? 600 : 400
            }}
          >
            <Inbox size={18} /> KPI Inbox 
            {inbox.filter(i => !i.is_tagged).length > 0 && (
              <span style={{ backgroundColor: 'var(--status-danger)', color: 'white', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '1rem' }}>
                {inbox.filter(i => !i.is_tagged).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
              backgroundColor: activeTab === 'settings' ? 'var(--bg-secondary)' : 'transparent',
              boxShadow: activeTab === 'settings' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontWeight: activeTab === 'settings' ? 600 : 400
            }}
          >
            <Settings size={18} /> KPI Settings
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={16} /> Total KPIs ({categoryFilter})</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>{filteredKpis.length}</div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} /> Met Target</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--status-success)' }}>
                {filteredKpis.filter(k => {
                  const targetVal = (k.targets && k.targets.length > 0) ? k.targets[0].value : k.target_value;
                  return k.actual_count >= targetVal;
                }).length}
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={16} /> Pending Mapping</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--status-warning)' }}>
                {inbox.filter(item => !item.is_tagged).length}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border-color)', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>ตัวกรอง:</span>
            </div>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', minWidth: '150px' }}
            >
              <option value="ทั้งหมด">ทุกปีงบประมาณ</option>
              {years.map(y => (
                <option key={y} value={y}>ปีงบประมาณ {y}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {['ทั้งหมด', ...categories.map(c => c.name)].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid',
                    fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s',
                    borderColor: categoryFilter === cat ? 'var(--accent-color)' : 'var(--border-color)',
                    backgroundColor: categoryFilter === cat ? 'var(--accent-light)' : 'transparent',
                    color: categoryFilter === cat ? 'var(--accent-color)' : 'var(--text-secondary)',
                    fontWeight: categoryFilter === cat ? 600 : 400
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* KPI List Dashboard */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem' }}>KPI Progress (Target vs Actual)</h3>
              <button onClick={fetchData} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.875rem' }}>Refresh Data</button>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {filteredKpis.map(kpi => {
                  const mainTarget = (kpi.targets && kpi.targets.length > 0) ? kpi.targets[0] : { value: kpi.target_value, unit: kpi.unit };
                  const percent = Math.min(Math.round((kpi.actual_count / mainTarget.value) * 100), 100);
                  return (
                    <div
                      key={kpi.id}
                      onClick={() => fetchEvidence(kpi)}
                      style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ gridColumn: 'span 10', display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: '1rem',
                            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap'
                          }}>
                            {kpi.category || 'ทั่วไป'}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--accent-color)', whiteSpace: 'nowrap' }}>{kpi.code}</span>
                          <span title={kpi.name} style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kpi.name}</span>
                        </div>
                        <div style={{ gridColumn: 'span 2', fontSize: '0.875rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 700 }}>{kpi.actual_count}</span> / {mainTarget.value} {mainTarget.unit}
                        </div>
                      </div>
                      <div style={{ height: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${percent}%`,
                          backgroundColor: percent >= 100 ? 'var(--status-success)' : 'var(--accent-color)',
                          transition: 'width 1s ease-out'
                        }} />
                      </div>
                    </div>
                  );
                })}
                {filteredKpis.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>ไม่พบข้อมูลตัวชี้วัดในหมวดหมู่นี้</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inbox' && (() => {
        const inboxYears = ['ทั้งหมด', ...new Set(inbox.map(item => item.year).filter(Boolean))].sort((a, b) => b - a);
        const inboxTypes = ['ทั้งหมด', 'โครงการ', 'กิจกรรม'];

        const filteredInbox = inbox.filter(item => {
          const matchYear = inboxYearFilter === 'ทั้งหมด' || item.year === inboxYearFilter;
          const matchType = inboxTypeFilter === 'ทั้งหมด' || item.type === inboxTypeFilter;
          const matchStatus = inboxStatusFilter === 'ทั้งหมด' || 
                             (inboxStatusFilter === 'ยังไม่ได้ระบุ KPI' ? !item.is_tagged : item.is_tagged);
          return matchYear && matchType && matchStatus;
        });

        // Pagination Logic
        const totalItems = filteredInbox.length;
        const totalPages = Math.ceil(totalItems / inboxPerPage);
        const startIndex = (inboxPage - 1) * inboxPerPage;
        const pagedInbox = filteredInbox.slice(startIndex, startIndex + inboxPerPage);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Inbox Filter Bar */}
            <div style={{ display: 'flex', gap: '1.5rem', backgroundColor: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border-color)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>ตัวกรอง Inbox:</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ปีงบประมาณ:</span>
                <select
                  value={inboxYearFilter}
                  onChange={(e) => { setInboxYearFilter(e.target.value); setInboxPage(1); }}
                  style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', minWidth: '120px', backgroundColor: 'var(--bg-tertiary)' }}
                >
                  {inboxYears.map(y => <option key={y} value={y}>{y === 'ทั้งหมด' ? 'ทั้งหมด' : `ปี ${y}`}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ประเภท:</span>
                <select
                  value={inboxTypeFilter}
                  onChange={(e) => { setInboxTypeFilter(e.target.value); setInboxPage(1); }}
                  style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', minWidth: '150px', backgroundColor: 'var(--bg-tertiary)' }}
                >
                  {inboxTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>สถานะ:</span>
                <select
                  value={inboxStatusFilter}
                  onChange={(e) => { setInboxStatusFilter(e.target.value); setInboxPage(1); }}
                  style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', minWidth: '150px', backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <option value="ทั้งหมด">ทั้งหมด</option>
                  <option value="ยังไม่ได้ระบุ KPI">ยังไม่ได้ระบุ KPI</option>
                  <option value="เชื่อมโยง KPI แล้ว">เชื่อมโยง KPI แล้ว</option>
                </select>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', textAlign: 'left' }}>
                    <th style={{ padding: '1rem', width: '100px' }}>Source</th>
                    <th style={{ padding: '1rem' }}>Output / Result Title</th>
                    <th style={{ padding: '1rem' }}>Assigned KPIs</th>
                    <th style={{ padding: '1rem', width: '130px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedInbox.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: item.is_tagged ? 'rgba(59, 130, 246, 0.02)' : 'transparent' }}>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 700,
                          backgroundColor: item.source === 'PMS' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: item.source === 'PMS' ? '#3b82f6' : '#10b981'
                        }}>
                          {item.source}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          color: item.is_tagged ? '#3b82f6' : 'var(--text-primary)',
                          marginBottom: '0.3rem'
                        }}>
                          <span 
                            onClick={() => {
                              if (item.source === 'PMS' && setActiveMenu) {
                                localStorage.setItem('pms_open_project_id', item.id);
                                setActiveMenu('org-pms');
                              }
                            }}
                            style={{ 
                              cursor: item.source === 'PMS' ? 'pointer' : 'default',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                              if (item.source === 'PMS') {
                                e.currentTarget.style.color = 'var(--accent-color)';
                                e.currentTarget.style.textDecoration = 'underline';
                              }
                            }}
                            onMouseLeave={e => {
                              if (item.source === 'PMS') {
                                e.currentTarget.style.color = item.is_tagged ? '#3b82f6' : 'var(--text-primary)';
                                e.currentTarget.style.textDecoration = 'none';
                              }
                            }}
                            title={item.source === 'PMS' ? 'คลิกเพื่อเปิดดูรายละเอียดโครงการในระบบ PMS' : ''}
                          >
                            {item.title}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: item.type === 'โครงการ' ? 'var(--accent-color)' : 'var(--status-success)',
                            backgroundColor: item.type === 'โครงการ' ? 'var(--accent-light)' : 'rgba(16, 185, 129, 0.1)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            {item.type}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            ปี {item.year || '-'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {item.assigned_kpis && item.assigned_kpis.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {item.assigned_kpis.map((k, i) => (
                              <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <CheckCircle2 size={12} style={{ color: 'var(--status-success)' }} /> {k}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>ยังไม่ได้ระบุตัวชี้วัด</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button
                          onClick={() => setMappingModal({ show: true, item: item })}
                          style={{
                            backgroundColor: item.is_tagged ? 'var(--bg-tertiary)' : 'var(--accent-color)',
                            color: item.is_tagged ? 'var(--text-primary)' : 'white',
                            border: item.is_tagged ? '1px solid var(--border-color)' : 'none',
                            padding: '0.5rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem'
                          }}
                        >
                          {item.is_tagged ? <Plus size={14} /> : <BarChart3 size={14} />}
                          {item.is_tagged ? 'Add KPI' : 'Assign KPI'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pagedInbox.length === 0 && (
                    <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>ไม่พบข้อมูลที่ตรงกับตัวกรองของคุณ</td></tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalItems > 0 && (
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + inboxPerPage, totalItems)}</strong> of <strong>{totalItems}</strong> entries
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Rows per page:</span>
                      <select
                        value={inboxPerPage}
                        onChange={(e) => { setInboxPerPage(Number(e.target.value)); setInboxPage(1); }}
                        style={{ padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.85rem' }}
                      >
                        {[10, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <button
                        disabled={inboxPage === 1}
                        onClick={() => setInboxPage(p => p - 1)}
                        style={{ padding: '0.4rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: inboxPage === 1 ? 'transparent' : 'var(--bg-secondary)', cursor: inboxPage === 1 ? 'not-allowed' : 'pointer', opacity: inboxPage === 1 ? 0.5 : 1 }}
                      >
                        <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                      </button>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0 0.5rem' }}>Page {inboxPage} of {totalPages}</div>
                      <button
                        disabled={inboxPage === totalPages}
                        onClick={() => setInboxPage(p => p + 1)}
                        style={{ padding: '0.4rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: inboxPage === totalPages ? 'transparent' : 'var(--bg-secondary)', cursor: inboxPage === totalPages ? 'not-allowed' : 'pointer', opacity: inboxPage === totalPages ? 0.5 : 1 }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>
              {viewingFrameworkId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button onClick={() => setViewingFrameworkId(null)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)' }}>
                    <ArrowLeft size={20} />
                  </button>
                  {frameworks.find(f => f.id === viewingFrameworkId)?.name}
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)', borderRadius: '1rem', fontWeight: 700 }}>
                      {frameworks.find(f => f.id === viewingFrameworkId)?.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderRadius: '1rem', fontWeight: 700, border: '1px solid var(--border-color)' }}>
                      ปี {frameworks.find(f => f.id === viewingFrameworkId)?.fiscal_year}
                    </span>
                  </div>
                </div>
              ) : (
                `KPI Frameworks (${frameworks.length})`
              )}
            </h2>
            {!viewingFrameworkId && (
              <button
                onClick={() => {
                  setNewFramework({ name: '', fiscal_year: '2567', category: categories[0]?.name || 'มหาวิทยาลัย', description: '' });
                  setIsEditingFramework(false);
                  setIsAddingFramework(true);
                }}
                style={{ backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
              >
                + Create Framework
              </button>
            )}
          </div>

          {!viewingFrameworkId && (
            <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border-color)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>ตัวกรอง:</span>
              </div>

              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', minWidth: '150px' }}
              >
                <option value="ทั้งหมด">ทุกปีงบประมาณ</option>
                {years.map(y => (
                  <option key={y} value={y}>ปีงบประมาณ {y}</option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {['ทั้งหมด', ...categories.map(c => c.name)].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      padding: '0.4rem 0.8rem', borderRadius: '2rem', border: '1px solid',
                      fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
                      borderColor: categoryFilter === cat ? 'var(--accent-color)' : 'var(--border-color)',
                      backgroundColor: categoryFilter === cat ? 'var(--accent-light)' : 'transparent',
                      color: categoryFilter === cat ? 'var(--accent-color)' : 'var(--text-secondary)',
                      fontWeight: categoryFilter === cat ? 600 : 400
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {viewingFrameworkId ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>KPIs in this Framework</h3>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <CheckCircle2 size={14} style={{ color: 'var(--accent-color)' }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{kpis.filter(k => k.framework_id === viewingFrameworkId).length}</span> KPIs
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <TrendingUp size={14} style={{ color: 'var(--status-success)' }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{kpis.filter(k => k.framework_id === viewingFrameworkId).reduce((acc, k) => acc + (k.targets?.length || 1), 0)}</span> Targets
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setNewKpi({ code: '', name: '', target_value: 0, unit: 'บทความ', weight: 1, description: '', evidence: '', targets: [{ label: 'เป้าหมายหลัก', value: 0, unit: 'บทความ' }] });
                    setSelectedFrameworkId(viewingFrameworkId);
                    setIsEditingKpi(false);
                    setIsAddingKpi(true);
                  }}
                  style={{ backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  + Add New KPI
                </button>
              </div>

              <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-tertiary)', textAlign: 'left' }}>
                      <th style={{ padding: '1rem', width: '80px' }}>Code</th>
                      <th style={{ padding: '1rem', width: '300px' }}>KPI Name</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Target</th>
                      <th style={{ padding: '1rem' }}>Evidence (หลักฐาน)</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.filter(k => k.framework_id === viewingFrameworkId).map(kpi => (
                      <tr key={kpi.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--accent-color)' }}>{kpi.code}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600 }}>{kpi.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{kpi.description || 'No description'}</div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button
                            onClick={() => setTargetsModal({
                              show: true,
                              targets: kpi.targets || [],
                              kpiName: kpi.name,
                              evidence: kpi.evidence,
                              evidence_path: kpi.evidence_path,
                              evidence_name: kpi.evidence_name
                            })}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0 auto' }}
                            title="ดูเป้าหมายทั้งหมด"
                          >
                            <Info size={18} />
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                              {kpi.targets?.length || 1}
                            </span>
                          </button>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{kpi.evidence || '-'}</div>
                          {kpi.evidence_name && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.25rem', fontWeight: 600 }}>
                              <FileText size={12} /> {kpi.evidence_name}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                setNewKpi({
                                  code: kpi.code,
                                  name: kpi.name,
                                  target_value: kpi.target_value,
                                  unit: kpi.unit,
                                  weight: kpi.weight || 1,
                                  description: kpi.description || '',
                                  evidence: kpi.evidence || '',
                                  evidence_path: kpi.evidence_path || '',
                                  evidence_name: kpi.evidence_name || '',
                                  targets: kpi.targets && kpi.targets.length > 0 ? kpi.targets.map(t => ({ ...t, id: t.id || Math.random() })) : [{ label: 'เป้าหมายหลัก', value: kpi.target_value, unit: kpi.unit }]
                                });
                                setEditingKpiId(kpi.id);
                                setSelectedFrameworkId(viewingFrameworkId);
                                setIsEditingKpi(true);
                                setIsAddingKpi(true);
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            >
                              <Settings size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteKpi(kpi.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer' }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {kpis.filter(k => k.framework_id === viewingFrameworkId).length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          ยังไม่มีตัวชี้วัดใน Framework นี้ กดปุ่ม + Add New KPI เพื่อเริ่มต้น
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {filteredFrameworks.map(fw => (
                <div
                  key={fw.id}
                  onClick={() => setViewingFrameworkId(fw.id)}
                  style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
                          {fw.category}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewFramework({ name: fw.name, fiscal_year: fw.fiscal_year, category: fw.category, description: fw.description });
                            setSelectedFrameworkId(fw.id);
                            setIsEditingFramework(true);
                            setIsAddingFramework(true);
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
                        >
                          <Settings size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteFramework(fw.id); }}
                          style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', padding: 0 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>FY {fw.fiscal_year}</span>
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{fw.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.5rem' }}>
                      {fw.description || 'ไม่มีคำอธิบายสำหรับ Framework นี้'}
                    </p>
                  </div>
                  <div style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>KPIs</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>{kpis.filter(k => k.framework_id === fw.id).length}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Targets</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {kpis.filter(k => k.framework_id === fw.id).reduce((sum, k) => sum + (k.targets?.length || 1), 0)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Global Modals Area */}

      {/* 1. Add Framework Modal */}
      {isAddingFramework && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>{isEditingFramework ? 'Edit Framework' : 'Create New Framework'}</h3>
            <form onSubmit={handleAddFramework} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Framework Name</label>
                <input required type="text" value={newFramework.name} onChange={e => setNewFramework({ ...newFramework, name: e.target.value })} style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Fiscal Year</label>
                  <input required type="text" value={newFramework.fiscal_year} onChange={e => setNewFramework({ ...newFramework, fiscal_year: e.target.value })} style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Category</label>
                    <button type="button" onClick={() => setIsManagingCategories(!isManagingCategories)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                      {isManagingCategories ? 'Close' : 'Manage'}
                    </button>
                  </div>
                  <select value={newFramework.category} onChange={e => setNewFramework({ ...newFramework, category: e.target.value })} style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Description</label>
                <textarea
                  placeholder="อธิบายรายละเอียดของ Framework นี้..."
                  value={newFramework.description}
                  onChange={e => setNewFramework({ ...newFramework, description: e.target.value })}
                  style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {isManagingCategories && (
                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '0.5rem', marginTop: '0.5rem', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Manage Categories</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input type="text" placeholder="New Category" value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ flex: 1, padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} />
                    <button type="button" onClick={handleAddCategory} style={{ backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', padding: '0 0.75rem', borderRadius: '0.25rem', cursor: 'pointer' }}>+</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {categories.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>
                        {c.name}
                        <button type="button" onClick={() => handleDeleteCategory(c.id)} style={{ border: 'none', background: 'none', color: 'var(--status-danger)', cursor: 'pointer', padding: 0, marginLeft: '0.2rem' }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => {
                  setIsAddingFramework(false);
                  setIsEditingFramework(false);
                  setNewFramework({ name: '', fiscal_year: '2567', category: categories[0]?.name || 'มหาวิทยาลัย', description: '' });
                }} style={{ padding: '0.6rem 1.25rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.6rem 1.25rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                  {isEditingFramework ? 'Update Framework' : 'Save Framework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add/Edit KPI Modal */}
      {isAddingKpi && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1300 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2.5rem', borderRadius: '1.25rem', width: '750px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginTop: 0 }}>{isEditingKpi ? `Edit KPI: ${newKpi.name}` : `Add KPI to ${frameworks.find(f => f.id === selectedFrameworkId)?.name}`}</h3>
            <form onSubmit={handleAddKpi} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Description (Optional)</label>
                <input type="text" value={newKpi.description} onChange={e => setNewKpi({ ...newKpi, description: e.target.value })} style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Evidence (หลักฐาน)</label>
                <textarea placeholder="เช่น รายงานการประชุม, ประกาศ, คำสั่ง..." value={newKpi.evidence} onChange={e => setNewKpi({ ...newKpi, evidence: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }} />
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--accent-color)', backgroundColor: 'var(--accent-light)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: 600 }}>
                    <Upload size={12} /> {newKpi.evidence_name ? 'Change Evidence File' : 'Upload Evidence File'}
                    <input type="file" style={{ display: 'none' }} onChange={e => handleEvidenceUpload(e.target.files[0])} />
                  </label>
                  {newKpi.evidence_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <FileText size={12} /> {newKpi.evidence_name}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setNewKpi(prev => ({ ...prev, evidence_path: '', evidence_name: '' }))}
                        style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '100px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Code</label>
                  <input required type="text" placeholder="1.1" value={newKpi.code} onChange={e => setNewKpi({ ...newKpi, code: e.target.value })} style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>KPI Name</label>
                  <input required type="text" value={newKpi.name} onChange={e => setNewKpi({ ...newKpi, name: e.target.value })} style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 700 }}>Targets (เป้าหมาย)</label>
                  <button
                    type="button"
                    onClick={() => setNewKpi({ ...newKpi, targets: [...newKpi.targets, { label: '', value: 0, unit: 'บทความ' }] })}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Plus size={14} /> Add Target
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {newKpi.targets.map((t, idx) => (
                    <div key={idx} style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                        <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Label</label>
                          <input required type="text" placeholder="เช่น ขั้นต่ำ" value={t.label} onChange={e => {
                            const nt = [...newKpi.targets]; nt[idx].label = e.target.value; setNewKpi({ ...newKpi, targets: nt });
                          }} style={{ padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} />
                        </div>
                        <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Value</label>
                          <input required type="number" step="any" value={t.value} onChange={e => {
                            const nt = [...newKpi.targets]; nt[idx].value = e.target.value; setNewKpi({ ...newKpi, targets: nt });
                          }} style={{ padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} />
                        </div>
                        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Unit</label>
                          <input required type="text" value={t.unit} onChange={e => {
                            const nt = [...newKpi.targets]; nt[idx].unit = e.target.value; setNewKpi({ ...newKpi, targets: nt });
                          }} style={{ padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nt = newKpi.targets.filter((_, i) => i !== idx);
                            setNewKpi({ ...newKpi, targets: nt });
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderRadius: '0.5rem', transition: 'all 0.2s' }}
                          title="ลบเป้าหมาย"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--accent-color)', backgroundColor: 'var(--accent-light)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: 600 }}>
                          <Upload size={12} /> {t.attachment_name ? 'Change File' : 'Upload File'}
                          <input type="file" style={{ display: 'none' }} onChange={e => handleFileUpload(e.target.files[0], idx)} />
                        </label>
                        {t.attachment_name && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <FileText size={12} /> {t.attachment_name}
                            </span>
                            <button 
                              type="button" 
                              onClick={() => {
                                setNewKpi(prev => ({
                                  ...prev,
                                  targets: prev.targets.map((target, i) => 
                                    i === idx ? { ...target, attachment_path: '', attachment_name: '' } : target
                                  )
                                }));
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => {
                  setIsAddingKpi(false);
                  setIsEditingKpi(false);
                  setNewKpi({ code: '', name: '', target_value: 0, unit: 'บทความ', weight: 1, description: '', evidence: '', targets: [{ label: 'เป้าหมายหลัก', value: 0, unit: 'บทความ' }] });
                }} style={{ padding: '0.6rem 1.25rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.6rem 1.25rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                  {isEditingKpi ? 'Update KPI' : 'Save KPI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Targets View Modal */}
      {targetsModal.show && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>เป้าหมายของ KPI</h3>
              <button onClick={() => setTargetsModal({ show: false, targets: [], kpiName: '', evidence: '', evidence_path: '', evidence_name: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--accent-color)', marginBottom: '0.5rem' }}>{targetsModal.kpiName}</div>

            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>รายการเป้าหมาย</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {targetsModal.targets.length > 0 ? (
                targetsModal.targets.map((t, idx) => (
                  <div key={idx} style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{t.label}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{t.value}</strong> {t.unit}
                        </span>
                      </div>
                      {t.attachment_path && (
                        <a
                          href={`http://localhost:3001${t.attachment_path}`}
                          target="_blank"
                          rel="noreferrer"
                          download
                          style={{
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'var(--accent-light)',
                            color: 'var(--accent-color)',
                            borderRadius: '0.75rem',
                            textDecoration: 'none',
                            transition: 'all 0.2s'
                          }}
                          title={`Download: ${t.attachment_name}`}
                          onMouseOver={e => {
                            e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                            e.currentTarget.style.color = 'var(--accent-color)';
                          }}
                        >
                          <Download size={20} />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>ไม่มีข้อมูลเป้าหมายเพิ่มเติม</div>
              )}
            </div>
            <button
              onClick={() => setTargetsModal({ show: false, targets: [], kpiName: '' })}
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* 4. Mapping Modal (The Inbox Action) */}
      {mappingModal.show && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '1.25rem', width: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Assign to KPI</h3>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Mapping item: <strong>{mappingModal.item?.title}</strong></p>
              </div>
              <button onClick={() => setMappingModal({ show: false, item: null })} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ KPI, รหัส หรือ Framework..."
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {years.map(year => (
                <div key={year}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--accent-color)', color: 'white', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>ปีงบประมาณ {year}</div>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {frameworks.filter(fw => fw.fiscal_year === year).map(fw => (
                      <div key={fw.id} style={{ border: '1px solid var(--border-color)', borderRadius: '1rem', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)' }}>
                        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Settings size={14} style={{ color: 'var(--accent-color)' }} /> {fw.name}
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({fw.category})</span>
                          </div>
                          <button
                            onClick={() => {
                              setNewKpi({ code: '', name: '', target_value: 0, unit: 'บทความ', weight: 1, description: '', evidence: '', targets: [{ label: 'เป้าหมายหลัก', value: 0, unit: 'บทความ' }] });
                              setSelectedFrameworkId(fw.id);
                              setIsEditingKpi(false);
                              setIsAddingKpi(true);
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Plus size={14} /> Add KPI
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {kpis.filter(k => k.framework_id === fw.id).length > 0 ? (
                            kpis.filter(k => k.framework_id === fw.id).map(kpi => (
                              <div key={kpi.id} style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--accent-color)', fontSize: '0.85rem' }}>{kpi.code}</span>
                                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{kpi.name}</span>
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{kpi.description || 'No description'}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <button
                                    onClick={() => {
                                      setNewKpi({ ...kpi, targets: kpi.targets || [{ label: 'เป้าหมายหลัก', value: kpi.target_value, unit: kpi.unit }] });
                                      setEditingKpiId(kpi.id);
                                      setIsEditingKpi(true);
                                      setIsAddingKpi(true);
                                    }}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem' }}
                                  ><Settings size={14} /></button>
                                  <button
                                    onClick={() => handleMap(mappingModal.item, kpi.id).then(() => setMappingModal({ show: false, item: null }))}
                                    style={{ backgroundColor: 'var(--status-success)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                                  >
                                    Map Result
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>ยังไม่มี KPI ใน Framework นี้</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setMappingModal({ show: false, item: null })}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--bg-tertiary)', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Premium Confirm Dialog */}
      {confirmDialog.show && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1.25rem', width: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <AlertCircle size={32} />
            </div>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.25rem', fontWeight: 700 }}>{confirmDialog.title}</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => setConfirmDialog({ ...confirmDialog, show: false })}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ ...confirmDialog, show: false });
                }}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }}
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals Area */}

      {/* 1. Add Framework Modal */}
      {isAddingFramework && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>{isEditingFramework ? 'Edit Framework' : 'Create New Framework'}</h3>
            <form onSubmit={handleAddFramework} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Framework Name</label>
                <input required type="text" value={newFramework.name} onChange={e => setNewFramework({ ...newFramework, name: e.target.value })} style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Fiscal Year</label>
                  <input required type="text" value={newFramework.fiscal_year} onChange={e => setNewFramework({ ...newFramework, fiscal_year: e.target.value })} style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Category</label>
                    <button type="button" onClick={() => setIsManagingCategories(!isManagingCategories)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                      {isManagingCategories ? 'Close' : 'Manage'}
                    </button>
                  </div>
                  <select value={newFramework.category} onChange={e => setNewFramework({ ...newFramework, category: e.target.value })} style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Description</label>
                <textarea
                  placeholder="อธิบายรายละเอียดของ Framework นี้..."
                  value={newFramework.description}
                  onChange={e => setNewFramework({ ...newFramework, description: e.target.value })}
                  style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {isManagingCategories && (
                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '0.5rem', marginTop: '0.5rem', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Manage Categories</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input type="text" placeholder="New Category" value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ flex: 1, padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} />
                    <button type="button" onClick={handleAddCategory} style={{ backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', padding: '0 0.75rem', borderRadius: '0.25rem', cursor: 'pointer' }}>+</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {categories.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>
                        {c.name}
                        <button type="button" onClick={() => handleDeleteCategory(c.id)} style={{ border: 'none', background: 'none', color: 'var(--status-danger)', cursor: 'pointer', padding: 0, marginLeft: '0.2rem' }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => {
                  setIsAddingFramework(false);
                  setIsEditingFramework(false);
                  setNewFramework({ name: '', fiscal_year: '2567', category: categories[0]?.name || 'มหาวิทยาลัย', description: '' });
                }} style={{ padding: '0.6rem 1.25rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.6rem 1.25rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                  {isEditingFramework ? 'Update Framework' : 'Save Framework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add/Edit KPI Modal */}
      {isAddingKpi && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1300 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2.5rem', borderRadius: '1.25rem', width: '750px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginTop: 0 }}>{isEditingKpi ? `Edit KPI: ${newKpi.name}` : `Add KPI to ${frameworks.find(f => f.id === selectedFrameworkId)?.name}`}</h3>
            <form onSubmit={handleAddKpi} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Description (Optional)</label>
                <input type="text" value={newKpi.description} onChange={e => setNewKpi({ ...newKpi, description: e.target.value })} style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Evidence (หลักฐาน)</label>
                <textarea placeholder="เช่น รายงานการประชุม, ประกาศ, คำสั่ง..." value={newKpi.evidence} onChange={e => setNewKpi({ ...newKpi, evidence: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }} />
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--accent-color)', backgroundColor: 'var(--accent-light)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: 600 }}>
                    <Upload size={12} /> {newKpi.evidence_name ? 'Change Evidence File' : 'Upload Evidence File'}
                    <input type="file" style={{ display: 'none' }} onChange={e => handleEvidenceUpload(e.target.files[0])} />
                  </label>
                  {newKpi.evidence_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <FileText size={12} /> {newKpi.evidence_name}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setNewKpi(prev => ({ ...prev, evidence_path: '', evidence_name: '' }))}
                        style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '100px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Code</label>
                  <input required type="text" placeholder="1.1" value={newKpi.code} onChange={e => setNewKpi({ ...newKpi, code: e.target.value })} style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>KPI Name</label>
                  <input required type="text" value={newKpi.name} onChange={e => setNewKpi({ ...newKpi, name: e.target.value })} style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 700 }}>Targets (เป้าหมาย)</label>
                  <button
                    type="button"
                    onClick={() => setNewKpi({ ...newKpi, targets: [...newKpi.targets, { label: '', value: 0, unit: 'บทความ' }] })}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Plus size={14} /> Add Target
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {newKpi.targets.map((t, idx) => (
                    <div key={idx} style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                        <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Label</label>
                          <input required type="text" placeholder="เช่น ขั้นต่ำ" value={t.label} onChange={e => {
                            const nt = [...newKpi.targets]; nt[idx].label = e.target.value; setNewKpi({ ...newKpi, targets: nt });
                          }} style={{ padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} />
                        </div>
                        <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Value</label>
                          <input required type="number" step="any" value={t.value} onChange={e => {
                            const nt = [...newKpi.targets]; nt[idx].value = e.target.value; setNewKpi({ ...newKpi, targets: nt });
                          }} style={{ padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} />
                        </div>
                        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Unit</label>
                          <input required type="text" value={t.unit} onChange={e => {
                            const nt = [...newKpi.targets]; nt[idx].unit = e.target.value; setNewKpi({ ...newKpi, targets: nt });
                          }} style={{ padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nt = newKpi.targets.filter((_, i) => i !== idx);
                            setNewKpi({ ...newKpi, targets: nt });
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderRadius: '0.5rem', transition: 'all 0.2s' }}
                          title="ลบเป้าหมาย"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--accent-color)', backgroundColor: 'var(--accent-light)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: 600 }}>
                          <Upload size={12} /> {t.attachment_name ? 'Change File' : 'Upload File'}
                          <input type="file" style={{ display: 'none' }} onChange={e => handleFileUpload(e.target.files[0], idx)} />
                        </label>
                        {t.attachment_name && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <FileText size={12} /> {t.attachment_name}
                            </span>
                            <button 
                              type="button" 
                              onClick={() => {
                                setNewKpi(prev => ({
                                  ...prev,
                                  targets: prev.targets.map((target, i) => 
                                    i === idx ? { ...target, attachment_path: '', attachment_name: '' } : target
                                  )
                                }));
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => {
                  setIsAddingKpi(false);
                  setIsEditingKpi(false);
                  setNewKpi({ code: '', name: '', target_value: 0, unit: 'บทความ', weight: 1, description: '', evidence: '', targets: [{ label: 'เป้าหมายหลัก', value: 0, unit: 'บทความ' }] });
                }} style={{ padding: '0.6rem 1.25rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.6rem 1.25rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                  {isEditingKpi ? 'Update KPI' : 'Save KPI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Targets View Modal */}
      {targetsModal.show && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>เป้าหมายของ KPI</h3>
              <button onClick={() => setTargetsModal({ show: false, targets: [], kpiName: '', evidence: '', evidence_path: '', evidence_name: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--accent-color)', marginBottom: '0.5rem' }}>{targetsModal.kpiName}</div>

            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>รายการเป้าหมาย</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {targetsModal.targets.length > 0 ? (
                targetsModal.targets.map((t, idx) => (
                  <div key={idx} style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{t.label}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{t.value}</strong> {t.unit}
                        </span>
                      </div>
                      {t.attachment_path && (
                        <a
                          href={`http://localhost:3001${t.attachment_path}`}
                          target="_blank"
                          rel="noreferrer"
                          download
                          style={{
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'var(--accent-light)',
                            color: 'var(--accent-color)',
                            borderRadius: '0.75rem',
                            textDecoration: 'none',
                            transition: 'all 0.2s'
                          }}
                          title={`Download: ${t.attachment_name}`}
                          onMouseOver={e => {
                            e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                            e.currentTarget.style.color = 'var(--accent-color)';
                          }}
                        >
                          <Download size={20} />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>ไม่มีข้อมูลเป้าหมายเพิ่มเติม</div>
              )}
            </div>
            <button
              onClick={() => setTargetsModal({ show: false, targets: [], kpiName: '' })}
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* 4. Mapping Modal (The Inbox Action) */}
      {mappingModal.show && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '1.25rem', width: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Assign KPI</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Mapping item:</span>
                  <strong style={{ fontSize: '0.9rem' }}>{mappingModal.item?.title}</strong>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: mappingModal.item?.type === 'โครงการ' ? 'var(--accent-color)' : 'var(--status-success)',
                    backgroundColor: mappingModal.item?.type === 'โครงการ' ? 'var(--accent-light)' : 'rgba(16, 185, 129, 0.1)',
                    padding: '0.1rem 0.6rem',
                    borderRadius: '1rem',
                    textTransform: 'uppercase'
                  }}>
                    {mappingModal.item?.type}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-tertiary)',
                    padding: '0.1rem 0.6rem',
                    borderRadius: '1rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    ปี {mappingModal.item?.year}
                  </span>
                </div>
              </div>
              <button onClick={() => { setMappingModal({ show: false, item: null }); setMappingSearch(''); setMappingYearFilter('ทั้งหมด'); }} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', display: 'flex', gap: '1rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ KPI, รหัส หรือ Framework..."
                  value={mappingSearch}
                  onChange={(e) => setMappingSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.9rem' }}
                />
              </div>
              <select
                value={mappingYearFilter}
                onChange={(e) => setMappingYearFilter(e.target.value)}
                style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.9rem', minWidth: '130px' }}
              >
                {['ทั้งหมด', ...years].map(y => <option key={y} value={y}>{y === 'ทั้งหมด' ? 'ทุกปีงบประมาณ' : `ปี ${y}`}</option>)}
              </select>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {years.filter(year => {
                if (mappingYearFilter !== 'ทั้งหมด' && year !== mappingYearFilter) return false;
                if (!mappingSearch) return true;
                const searchLower = mappingSearch.toLowerCase();
                return frameworks.some(fw => fw.fiscal_year === year && (
                  fw.name.toLowerCase().includes(searchLower) ||
                  kpis.some(k => k.framework_id === fw.id && (
                    k.name.toLowerCase().includes(searchLower) ||
                    k.code.toLowerCase().includes(searchLower)
                  ))
                ));
              }).map(year => (
                <div key={year}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--accent-color)', color: 'white', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>ปีงบประมาณ {year}</div>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {frameworks.filter(fw => {
                      if (fw.fiscal_year !== year) return false;
                      if (!mappingSearch) return true;
                      const searchLower = mappingSearch.toLowerCase();
                      return fw.name.toLowerCase().includes(searchLower) ||
                        kpis.some(k => k.framework_id === fw.id && (
                          k.name.toLowerCase().includes(searchLower) ||
                          k.code.toLowerCase().includes(searchLower)
                        ));
                    }).map(fw => (
                      <div key={fw.id} style={{ border: '1px solid var(--border-color)', borderRadius: '1rem', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)' }}>
                        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Settings size={14} style={{ color: 'var(--accent-color)' }} /> {fw.name}
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({fw.category})</span>
                          </div>
                          <button
                            onClick={() => {
                              setNewKpi({ code: '', name: '', target_value: 0, unit: 'บทความ', weight: 1, description: '', evidence: '', targets: [{ label: 'เป้าหมายหลัก', value: 0, unit: 'บทความ' }] });
                              setSelectedFrameworkId(fw.id);
                              setIsEditingKpi(false);
                              setIsAddingKpi(true);
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Plus size={14} /> Add KPI
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {kpis.filter(k => {
                            if (k.framework_id !== fw.id) return false;
                            if (!mappingSearch) return true;
                            const searchLower = mappingSearch.toLowerCase();
                            if (fw.name.toLowerCase().includes(searchLower)) return true;
                            return k.name.toLowerCase().includes(searchLower) ||
                              k.code.toLowerCase().includes(searchLower);
                          }).length > 0 ? (
                            kpis.filter(k => {
                              if (k.framework_id !== fw.id) return false;
                              if (!mappingSearch) return true;
                              const searchLower = mappingSearch.toLowerCase();
                              if (fw.name.toLowerCase().includes(searchLower)) return true;
                              return k.name.toLowerCase().includes(searchLower) ||
                                k.code.toLowerCase().includes(searchLower);
                            }).map(kpi => {
                              const isAlreadyMapped = mappingModal.item?.assigned_kpi_ids?.includes(kpi.id);
                              return (
                                <div key={kpi.id} style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s', opacity: isAlreadyMapped ? 0.6 : 1 }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span style={{ fontWeight: 700, color: 'var(--accent-color)', fontSize: '0.85rem' }}>{kpi.code}</span>
                                      <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{kpi.name}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{kpi.description || 'No description'}</div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button
                                      onClick={() => {
                                        setNewKpi({ ...kpi, targets: kpi.targets || [{ label: 'เป้าหมายหลัก', value: kpi.target_value, unit: kpi.unit }] });
                                        setEditingKpiId(kpi.id);
                                        setIsEditingKpi(true);
                                        setIsAddingKpi(true);
                                      }}
                                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem' }}
                                    ><Settings size={14} /></button>

                                    {isAlreadyMapped ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                          <CheckCircle2 size={14} style={{ color: 'var(--status-success)' }} /> Mapped
                                        </div>
                                        <button
                                          onClick={() => {
                                            const mapping = mappingModal.item.assigned_mappings.find(m => m.kpi_id === kpi.id);
                                            if (mapping) handleUnmap(mapping.id);
                                          }}
                                          style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-danger)', border: 'none', padding: '0.4rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                          title="ยกเลิกการเชื่อมโยง (Unmap)"
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleMap(mappingModal.item, kpi.id)}
                                        style={{ backgroundColor: 'var(--status-success)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                                      >
                                        Map Result
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>ยังไม่มี KPI ใน Framework นี้</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setMappingModal({ show: false, item: null }); setMappingSearch(''); }}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--bg-tertiary)', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Premium Confirm Dialog */}
      {confirmDialog.show && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1.25rem', width: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <AlertCircle size={32} />
            </div>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.25rem', fontWeight: 700 }}>{confirmDialog.title}</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => setConfirmDialog({ ...confirmDialog, show: false })}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ ...confirmDialog, show: false });
                }}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }}
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Evidence List Modal (View from Dashboard) */}
      {evidenceModal.show && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '1.25rem', width: '700px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                  Linked Evidence (หลักฐานการดำเนินการ)
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                  {evidenceModal.kpi?.code}: {evidenceModal.kpi?.name}
                </h3>
              </div>
              <button
                onClick={() => setEvidenceModal({ show: false, kpi: null, data: [] })}
                style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {evidenceModal.data.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  <Info size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p>ยังไม่มีการผูกโครงการหรือกิจกรรมเข้ากับตัวชี้วัดนี้</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {evidenceModal.data.map((item, idx) => (
                    <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontWeight: 600 }}>{item.source_title}</div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px',
                            backgroundColor: item.source_app === 'PMS' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: item.source_app === 'PMS' ? '#3b82f6' : '#10b981',
                            textTransform: 'uppercase'
                          }}>
                            {item.source_app}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            ID: {item.source_ref_id}
                          </span>
                        </div>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {new Date(item.created_at).toLocaleDateString('th-TH')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEvidenceModal({ show: false, kpi: null, data: [] })}
                style={{ padding: '0.6rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'var(--accent-color)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: '2rem', right: '2rem', zIndex: 9999,
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white', padding: '1rem 1.5rem', borderRadius: '0.75rem',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600,
          animation: 'fadeInUp 0.3s ease-out'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {toast.message}
          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default QAMetrics;
