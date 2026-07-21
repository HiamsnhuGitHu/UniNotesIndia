import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, School, FileCheck, Download, AlertTriangle, ShieldCheck, 
  Trash2, ToggleLeft, ToggleRight, Check, X, Plus, Edit2, Send, MessageSquare, ChevronLeft, FileText, Upload 
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('adminActiveTab') || 'stats');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('adminActiveTab', tab);
  };

  const { user } = useAuth();
  const isSubAdmin = user?.role === 'ROLE_SUBADMIN';

  // If a sub admin somehow tries to go to 'users' tab, reset them to 'stats'
  useEffect(() => {
    if (isSubAdmin && activeTab === 'users') {
      handleTabChange('stats');
    }
  }, [activeTab, isSubAdmin]);
  
  // States
  const [stats, setStats] = useState({ totalUsers: 0, totalUniversities: 0, totalNotes: 0, totalDownloads: 0 });
  const [pendingNotes, setPendingNotes] = useState([]);
  const [approvalSubTab, setApprovalSubTab] = useState('pending');
  const [approvedNotes, setApprovedNotes] = useState([]);
  const [deleteRequests, setDeleteRequests] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [reports, setReports] = useState([]);

  // Directories management
  const [universities, setUniversities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Selected Directories
  const [selectedUni, setSelectedUni] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedSem, setSelectedSem] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectNotes, setSubjectNotes] = useState([]);

  // Preview note states
  const [previewNote, setPreviewNote] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [checkingPreview, setCheckingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalSubject, setUploadModalSubject] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadNoteType, setUploadNoteType] = useState('NOTE');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Announcement fields
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');

  // Add Directory Forms
  const [newUni, setNewUni] = useState({ name: '', city: 'Jaipur' });
  const [newBranch, setNewBranch] = useState({ name: '', universityId: '' });
  const [newSubject, setNewSubject] = useState({ name: '', branchId: '', semester: 1, universityId: '' });

  // Notifications status alert
  const [alert, setAlert] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // Edit user profile & reset password states
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    email: '',
    mobileNumber: '',
    city: '',
    collegeName: '',
    role: '',
    password: ''
  });

  const startEditingUser = (u) => {
    setEditingUser(u);
    setEditForm({
      fullName: u.fullName || '',
      username: u.username || '',
      email: u.email || '',
      mobileNumber: u.mobileNumber || '',
      city: u.city || '',
      collegeName: u.collegeName || '',
      role: u.role || 'ROLE_STUDENT',
      password: ''
    });
  };

  const startAddingUser = () => {
    setEditingUser({ id: null });
    setEditForm({
      fullName: '',
      username: '',
      email: '',
      mobileNumber: '',
      city: '',
      collegeName: '',
      role: 'ROLE_STUDENT',
      password: ''
    });
  };

  const handleUpdateUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/users', {
        id: editingUser.id,
        ...editForm
      });
      showAlert('success', editingUser.id ? 'User profile information updated successfully.' : 'New user created successfully.');
      setEditingUser(null);
      fetchUsers();
      fetchStats();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        showAlert('error', err.response.data.error);
      } else {
        showAlert('error', editingUser.id ? 'Failed to update user details.' : 'Failed to create new user.');
      }
    }
  };

  useEffect(() => {
    fetchStats();
    if (activeTab === 'approvals') {
      if (approvalSubTab === 'pending') {
        fetchPendingNotes();
      } else {
        fetchApprovedNotes();
      }
    }
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'directories') fetchDirectories();
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'requests') fetchDeleteRequests();
  }, [activeTab, approvalSubTab]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingNotes = async () => {
    try {
      const res = await api.get('/api/admin/notes/pending');
      setPendingNotes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApprovedNotes = async () => {
    try {
      const res = await api.get('/api/notes/search');
      setApprovedNotes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeleteRequests = async () => {
    try {
      const res = await api.get('/api/admin/delete-requests');
      setDeleteRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/admin/users');
      setUsersList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDirectories = async () => {
    try {
      const [uniRes, branchRes, subRes] = await Promise.all([
        api.get('/api/universities'),
        api.get('/api/branches'),
        api.get('/api/subjects')
      ]);
      setUniversities(uniRes.data);
      setBranches(branchRes.data);
      setSubjects(subRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubjectNotes = async (uniId, branchId, subId) => {
    try {
      const res = await api.get('/api/notes/search', {
        params: {
          universityId: uniId,
          branchId: branchId,
          subjectId: subId
        }
      });
      setSubjectNotes(res.data);
    } catch (err) {
      console.error("Failed to fetch subject notes:", err);
    }
  };

  useEffect(() => {
    if (showPreviewModal && previewNote) {
      const checkPreview = async () => {
        setCheckingPreview(true);
        setPreviewError(null);
        try {
          await api.head(`/api/notes/preview/${previewNote.id}`);
        } catch (err) {
          console.error("Preview check failed:", err);
          let errorMsg = "The file is not readable or does not exist on the server storage.";
          if (err.response && err.response.data && err.response.data.error) {
            errorMsg = err.response.data.error;
          }
          setPreviewError(errorMsg);
        } finally {
          setCheckingPreview(false);
        }
      };
      checkPreview();
    }
  }, [showPreviewModal, previewNote]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadModalSubject || uploadFiles.length === 0) {
      showAlert('error', 'Please fill in Title and choose a file.');
      return;
    }
    setUploadLoading(true);
    const formData = new FormData();
    uploadFiles.forEach(f => {
      formData.append('file', f);
    });
    formData.append('title', uploadTitle.trim());
    formData.append('description', uploadDesc.trim());
    formData.append('universityId', selectedUni.id);
    formData.append('branchId', selectedBranch.id);
    formData.append('semester', selectedSem);
    formData.append('subjectId', uploadModalSubject.id);
    formData.append('noteType', uploadNoteType);

    try {
      await api.post('/api/notes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showAlert('success', 'Material uploaded successfully!');
      setShowUploadModal(false);
      setUploadTitle('');
      setUploadDesc('');
      setUploadFiles([]);
      if (selectedSubject && selectedSubject.id === uploadModalSubject.id) {
        fetchSubjectNotes(selectedUni.id, selectedBranch.id, selectedSubject.id);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      showAlert('error', 'Failed to upload material.');
    } finally {
      setUploadLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await api.get('/api/admin/reports');
      setReports(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Approvals Actions
  const handleApproveNote = async (id) => {
    try {
      await api.put(`/api/admin/notes/${id}/approve`);
      showAlert('success', 'Note approved successfully.');
      fetchPendingNotes();
      fetchApprovedNotes();
      fetchStats();
    } catch (err) {
      showAlert('error', 'Failed to approve note.');
    }
  };

  const handleRejectNote = async (id) => {
    if (!window.confirm('Reject and delete this note file from storage?')) return;
    try {
      await api.put(`/api/admin/notes/${id}/reject`);
      showAlert('success', 'Note rejected and deleted.');
      fetchPendingNotes();
      fetchApprovedNotes();
      fetchStats();
    } catch (err) {
      showAlert('error', 'Failed to reject note.');
    }
  };

  const handleDeleteApprovedNote = async (id) => {
    const noteObj = approvedNotes.find(n => n.id === id);
    const noteTitle = noteObj ? noteObj.title : 'Unknown Material';

    if (isSubAdmin) {
      if (!window.confirm(`Request deletion of approved material "${noteTitle}"?`)) return;
      try {
        await api.post('/api/admin/delete-requests', {
          requestType: 'NOTE',
          targetId: id,
          targetName: noteTitle
        });
        showAlert('success', 'Deletion request submitted for Admin approval.');
      } catch (err) {
        showAlert('error', 'Failed to submit deletion request.');
      }
      return;
    }

    if (!window.confirm('Delete note and physical file permanently?')) return;
    try {
      await api.delete(`/api/admin/notes/${id}`);
      showAlert('success', 'Note deleted.');
      fetchApprovedNotes();
      fetchStats();
    } catch (err) {
      showAlert('error', 'Failed to delete note.');
    }
  };

  // User Actions
  const handleToggleUserStatus = async (id) => {
    try {
      await api.put(`/api/admin/users/${id}/toggle-status`);
      showAlert('success', 'User account status toggled.');
      fetchUsers();
    } catch (err) {
      showAlert('error', 'Failed to toggle account status.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Wipe user account and delete all their note files physically? This action is permanent.')) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      showAlert('success', 'User and all uploads removed.');
      fetchUsers();
      fetchStats();
    } catch (err) {
      showAlert('error', 'Failed to delete user.');
    }
  };

  // Directories actions
  const handleAddUni = async (e) => {
    e.preventDefault();
    if (!newUni.name.trim()) return;
    try {
      await api.post('/api/admin/universities', newUni);
      setNewUni({ name: '', city: 'Jaipur' });
      showAlert('success', 'University added.');
      fetchDirectories();
      fetchStats();
    } catch (err) {
      showAlert('error', 'Failed to add university.');
    }
  };

  const handleDeleteUni = async (id) => {
    const uni = universities.find(u => u.id === id);
    const name = uni ? uni.name : 'Unknown University';

    if (isSubAdmin) {
      if (!window.confirm(`Request deletion of university "${name}"?`)) return;
      try {
        await api.post('/api/admin/delete-requests', {
          requestType: 'UNIVERSITY',
          targetId: id,
          targetName: name
        });
        showAlert('success', 'Deletion request submitted for Admin approval.');
      } catch (err) {
        showAlert('error', 'Failed to submit deletion request.');
      }
      return;
    }

    if (!window.confirm('Deleting university will cascade delete all associated subjects and physical notes! Proceed?')) return;
    try {
      await api.delete(`/api/admin/universities/${id}`);
      showAlert('success', 'University deleted.');
      if (selectedUni?.id === id) {
        setSelectedUni(null);
        setSelectedBranch(null);
        setSelectedSem(null);
        setSelectedSubject(null);
        setSubjectNotes([]);
      }
      fetchDirectories();
      fetchStats();
    } catch (err) {
      showAlert('error', 'Deletion failed.');
    }
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!newBranch.name.trim() || !newBranch.universityId) return;
    try {
      const selectedUni = universities.find(u => u.id === Number(newBranch.universityId));
      await api.post('/api/admin/branches', {
        name: newBranch.name,
        university: selectedUni
      });
      setNewBranch({ name: '', universityId: '' });
      showAlert('success', 'Branch added.');
      fetchDirectories();
    } catch (err) {
      showAlert('error', 'Failed to add branch.');
    }
  };

  const handleDeleteBranch = async (id) => {
    const branch = branches.find(b => b.id === id);
    const name = branch ? branch.name : 'Unknown Branch';

    if (isSubAdmin) {
      if (!window.confirm(`Request deletion of branch "${name}"?`)) return;
      try {
        await api.post('/api/admin/delete-requests', {
          requestType: 'BRANCH',
          targetId: id,
          targetName: name
        });
        showAlert('success', 'Deletion request submitted for Admin approval.');
      } catch (err) {
        showAlert('error', 'Failed to submit deletion request.');
      }
      return;
    }

    if (!window.confirm('Deleting branch will cascade delete all associated physical note files! Proceed?')) return;
    try {
      await api.delete(`/api/admin/branches/${id}`);
      showAlert('success', 'Branch deleted.');
      if (selectedBranch?.id === id) {
        setSelectedBranch(null);
        setSelectedSem(null);
        setSelectedSubject(null);
        setSubjectNotes([]);
      }
      fetchDirectories();
      fetchStats();
    } catch (err) {
      showAlert('error', 'Deletion failed.');
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.name.trim() || !newSubject.branchId || !newSubject.universityId) return;
    try {
      const selectedBranch = branches.find(b => b.id === Number(newSubject.branchId));
      const selectedUni = universities.find(u => u.id === Number(newSubject.universityId));
      await api.post('/api/admin/subjects', {
        name: newSubject.name,
        branch: selectedBranch,
        semester: newSubject.semester,
        university: selectedUni
      });
      setNewSubject({ name: '', branchId: '', semester: 1, universityId: '' });
      showAlert('success', 'Subject mapping registered.');
      fetchDirectories();
    } catch (err) {
      showAlert('error', 'Failed to register subject.');
    }
  };

  const handleDeleteSubject = async (id) => {
    const sub = subjects.find(s => s.id === id);
    const name = sub ? sub.name : 'Unknown Subject';

    if (isSubAdmin) {
      if (!window.confirm(`Request deletion of subject "${name}"?`)) return;
      try {
        await api.post('/api/admin/delete-requests', {
          requestType: 'SUBJECT',
          targetId: id,
          targetName: name
        });
        showAlert('success', 'Deletion request submitted for Admin approval.');
      } catch (err) {
        showAlert('error', 'Failed to submit deletion request.');
      }
      return;
    }

    if (!window.confirm('Deleting subject will cascade delete associated note files from disk. Proceed?')) return;
    try {
      await api.delete(`/api/admin/subjects/${id}`);
      showAlert('success', 'Subject deleted.');
      if (selectedSubject?.id === id) {
        setSelectedSubject(null);
        setSubjectNotes([]);
      }
      fetchDirectories();
      fetchStats();
    } catch (err) {
      showAlert('error', 'Deletion failed.');
    }
  };

  // Dispatch announcement actions
  const handleDispatchNotification = async (e) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setLoading(true);
    try {
      await api.post('/api/admin/notifications', {
        title: notifTitle,
        message: notifMessage
      });
      setNotifTitle('');
      setNotifMessage('');
      showAlert('success', 'Platform announcement broadcasted.');
    } catch (err) {
      showAlert('error', 'Failed to send announcement.');
    } finally {
      setLoading(false);
    }
  };

  // Flagged report actions
  const handleDismissReport = async (id) => {
    try {
      await api.delete(`/api/admin/reports/${id}`);
      showAlert('success', 'Report dismissed.');
      fetchReports();
    } catch (err) {
      showAlert('error', 'Failed to dismiss report.');
    }
  };

  const handleDeleteNoteAdmin = async (noteId) => {
    let noteTitle = 'Unknown Material';
    const noteObj = subjectNotes.find(n => n.id === noteId) || reports.find(r => r.note?.id === noteId)?.note;
    if (noteObj) noteTitle = noteObj.title;

    if (isSubAdmin) {
      if (!window.confirm(`Request deletion of material "${noteTitle}"?`)) return;
      try {
        await api.post('/api/admin/delete-requests', {
          requestType: 'NOTE',
          targetId: noteId,
          targetName: noteTitle
        });
        showAlert('success', 'Deletion request submitted for Admin approval.');
      } catch (err) {
        showAlert('error', 'Failed to submit deletion request.');
      }
      return;
    }

    if (!window.confirm('Delete note and physical file permanently? This will dismiss all reports against it.')) return;
    try {
      await api.delete(`/api/admin/notes/${noteId}`);
      showAlert('success', 'Note and associated files deleted.');
      fetchReports();
      fetchStats();
      if (selectedSubject) {
        fetchSubjectNotes(selectedUni.id, selectedBranch.id, selectedSubject.id);
      }
    } catch (err) {
      showAlert('error', 'Failed to delete note.');
    }
  };

  const handleApproveDeleteRequest = async (requestId) => {
    try {
      await api.put(`/api/admin/delete-requests/${requestId}/approve`);
      showAlert('success', 'Deletion request approved and executed.');
      fetchDeleteRequests();
      fetchDirectories();
      fetchStats();
    } catch (err) {
      showAlert('error', 'Failed to approve deletion request.');
    }
  };

  const handleRejectDeleteRequest = async (requestId) => {
    try {
      await api.put(`/api/admin/delete-requests/${requestId}/reject`);
      showAlert('success', 'Deletion request rejected.');
      fetchDeleteRequests();
    } catch (err) {
      showAlert('error', 'Failed to reject deletion request.');
    }
  };

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert({ type: '', text: '' }), 3500);
  };

  return (
    <div class="space-y-6">
      
      <div>
        <h1 class="font-display text-2xl font-extrabold text-white">
          {isSubAdmin ? 'Sub Administrator Dashboard' : 'Administrator Dashboard'}
        </h1>
        <p class="text-xs text-slate-400 mt-1">Platform metrics, user moderation controls, directory setup, and reports.</p>
      </div>

      {/* Floating Status Alerts */}
      {alert.text && (
        <div class={`fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border text-sm shadow-xl ${
          alert.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <span>{alert.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div class="flex items-center gap-2 border-b border-white/5 pb-2 overflow-x-auto">
        {['stats', 'approvals', 'users', 'directories', 'announcements', 'reports', 'requests']
          .filter(tab => !(isSubAdmin && (tab === 'users' || tab === 'requests')))
          .map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              class={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition cursor-pointer shrink-0 ${
                activeTab === tab
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              {tab === 'requests' ? 'Requests' : tab}
            </button>
          ))}
      </div>

      {/* Tab: Stats Cards */}
      {activeTab === 'stats' && (
        <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              onClick={() => !isSubAdmin && handleTabChange('users')}
              class={`glass-panel border border-white/5 rounded-2xl p-6 flex items-center gap-4 ${
                isSubAdmin 
                  ? 'cursor-default opacity-70' 
                  : 'cursor-pointer hover:border-blue-500/40 hover:bg-slate-900/20 hover:scale-[1.02] active:scale-[0.98]'
              } transition-all duration-300`}
            >
              <div class="p-3 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20"><Users size={20} /></div>
              <div>
                <p class="text-[10px] text-slate-400 uppercase font-semibold">Total Accounts</p>
                <h3 class="text-xl font-extrabold text-white font-display mt-0.5">{stats.totalUsers}</h3>
              </div>
            </div>
            <div 
              onClick={() => !isSubAdmin && handleTabChange('directories')}
              class={`glass-panel border border-white/5 rounded-2xl p-6 flex items-center gap-4 ${
                isSubAdmin 
                  ? 'cursor-default opacity-70' 
                  : 'cursor-pointer hover:border-purple-500/40 hover:bg-slate-900/20 hover:scale-[1.02] active:scale-[0.98]'
              } transition-all duration-300`}
            >
              <div class="p-3 bg-purple-600/10 text-purple-400 rounded-xl border border-purple-500/20"><School size={20} /></div>
              <div>
                <p class="text-[10px] text-slate-400 uppercase font-semibold">Universities</p>
                <h3 class="text-xl font-extrabold text-white font-display mt-0.5">{stats.totalUniversities}</h3>
              </div>
            </div>
            <div 
              onClick={() => !isSubAdmin && handleTabChange('approvals')}
              class={`glass-panel border border-white/5 rounded-2xl p-6 flex items-center gap-4 ${
                isSubAdmin 
                  ? 'cursor-default opacity-70' 
                  : 'cursor-pointer hover:border-indigo-500/40 hover:bg-slate-900/20 hover:scale-[1.02] active:scale-[0.98]'
              } transition-all duration-300`}
            >
              <div class="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-500/20"><FileCheck size={20} /></div>
              <div>
                <p class="text-[10px] text-slate-400 uppercase font-semibold">Total Notes</p>
                <h3 class="text-xl font-extrabold text-white font-display mt-0.5">{stats.totalNotes}</h3>
              </div>
            </div>
            <div 
              onClick={() => !isSubAdmin && handleTabChange('reports')}
              class={`glass-panel border border-white/5 rounded-2xl p-6 flex items-center gap-4 ${
                isSubAdmin 
                  ? 'cursor-default opacity-70' 
                  : 'cursor-pointer hover:border-amber-500/40 hover:bg-slate-900/20 hover:scale-[1.02] active:scale-[0.98]'
              } transition-all duration-300`}
            >
              <div class="p-3 bg-amber-600/10 text-amber-400 rounded-xl border border-amber-500/20"><Download size={20} /></div>
              <div>
                <p class="text-[10px] text-slate-400 uppercase font-semibold">Total Downloads</p>
                <h3 class="text-xl font-extrabold text-white font-display mt-0.5">{stats.totalDownloads}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Pending / Approved Moderation Queue */}
      {activeTab === 'approvals' && (
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 class="font-display font-bold text-white text-lg">Moderation & Note Approvals</h3>
            
            {/* Sub Tabs Toggle */}
            <div class="flex items-center gap-2 bg-slate-900/40 p-1 rounded-xl border border-white/5 self-start sm:self-auto shrink-0">
              <button
                onClick={() => setApprovalSubTab('pending')}
                class={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                  approvalSubTab === 'pending'
                    ? 'bg-blue-600 text-white shadow shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending Queue ({pendingNotes.length})
              </button>
              <button
                onClick={() => setApprovalSubTab('approved')}
                class={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                  approvalSubTab === 'approved'
                    ? 'bg-blue-600 text-white shadow shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Approved Notes ({approvedNotes.length})
              </button>
            </div>
          </div>

          {approvalSubTab === 'pending' ? (
            <div class="space-y-4">
              {pendingNotes.length === 0 ? (
                <div class="glass-panel border border-white/5 rounded-xl p-8 text-center text-slate-500 text-xs font-sans">
                  No notes awaiting moderation approval.
                </div>
              ) : (
                <div class="space-y-4">
                  {pendingNotes.map(note => (
                    <div key={note.id} class="bg-slate-900/40 border border-white/5 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-500/20 transition duration-300 font-sans">
                      <div class="space-y-2 text-left">
                        <div class="flex flex-wrap items-center gap-2">
                          <h4 class="text-xs font-bold text-white leading-tight">{note.title}</h4>
                          <span class="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {note.noteType?.replace('_', ' ')}
                          </span>
                        </div>
                        {note.description && <p class="text-[10px] text-slate-400 max-w-2xl leading-relaxed">{note.description}</p>}
                        
                        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-slate-500">
                          <span>Uploader: <span class="text-slate-300 font-semibold">{note.uploadedBy?.fullName || note.uploadedBy?.username} (@{note.uploadedBy?.username})</span></span>
                          <span>Uploaded At: <span class="text-slate-300 font-semibold">{note.uploadDate ? new Date(note.uploadDate).toLocaleString() : 'N/A'}</span></span>
                        </div>

                        <div class="text-[9px] text-slate-400 font-mono bg-slate-950/40 px-2 py-1 rounded inline-block">
                          <span class="text-slate-500 uppercase tracking-widest font-semibold mr-1.5">Location:</span>
                          {note.university?.name} / {note.branch?.name} / Sem {note.semester} / <span class="text-blue-400">{note.subject?.name}</span>
                        </div>
                      </div>

                      <div class="flex items-center gap-2 self-end md:self-auto shrink-0">
                        <button
                          onClick={() => {
                            setPreviewNote(note);
                            setShowPreviewModal(true);
                          }}
                          class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-semibold cursor-pointer transition border border-white/5"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleApproveNote(note.id)}
                          class="px-3 py-1.5 bg-emerald-600/25 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-lg cursor-pointer transition text-[10px] font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectNote(note.id)}
                          class="px-3 py-1.5 bg-rose-600/25 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg cursor-pointer transition text-[10px] font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div class="space-y-4">
              {approvedNotes.length === 0 ? (
                <div class="glass-panel border border-white/5 rounded-xl p-8 text-center text-slate-500 text-xs font-sans">
                  No approved notes found in the system.
                </div>
              ) : (
                <div class="space-y-4">
                  {approvedNotes.map(note => (
                    <div key={note.id} class="bg-slate-900/40 border border-white/5 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-emerald-500/20 transition duration-300 font-sans">
                      <div class="space-y-2 text-left">
                        <div class="flex flex-wrap items-center gap-2">
                          <h4 class="text-xs font-bold text-white leading-tight">{note.title}</h4>
                          <span class="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {note.noteType?.replace('_', ' ')}
                          </span>
                        </div>
                        {note.description && <p class="text-[10px] text-slate-400 max-w-2xl leading-relaxed">{note.description}</p>}
                        
                        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-slate-500">
                          <span>Uploader: <span class="text-slate-300 font-semibold">{note.uploadedBy?.fullName || note.uploadedBy?.username} ({note.uploadedBy?.username})</span></span>
                          <span>Uploaded At: <span class="text-slate-300 font-semibold">{note.uploadDate ? new Date(note.uploadDate).toLocaleString() : 'N/A'}</span></span>
                          <span>Downloads: <span class="text-slate-300 font-bold">{note.downloadCount}</span></span>
                        </div>

                        <div class="text-[9px] text-slate-400 font-mono bg-slate-950/40 px-2 py-1 rounded inline-block">
                          <span class="text-slate-500 uppercase tracking-widest font-semibold mr-1.5">Location:</span>
                          {note.university?.name} / {note.branch?.name} / Sem {note.semester} / <span class="text-emerald-400">{note.subject?.name}</span>
                        </div>
                      </div>

                      <div class="flex items-center gap-2 self-end md:self-auto shrink-0">
                        <button
                          onClick={() => {
                            setPreviewNote(note);
                            setShowPreviewModal(true);
                          }}
                          class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-semibold cursor-pointer transition border border-white/5"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => window.open(`${import.meta.env.VITE_API_URL || ''}/api/notes/download/${note.id}`, '_blank')}
                          class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-semibold transition cursor-pointer"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDeleteApprovedNote(note.id)}
                          class="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg border border-rose-500/20 transition cursor-pointer text-[10px] font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: User Directory */}
      {activeTab === 'users' && (
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <h3 class="font-display font-bold text-white text-lg">User Management</h3>
            <button
              onClick={startAddingUser}
              class="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow shadow-blue-500/20"
            >
              <Plus size={14} />
              <span>Add New User</span>
            </button>
          </div>
          <div class="overflow-x-auto rounded-xl border border-white/5">
            <table class="w-full text-xs text-left text-slate-300">
              <thead class="bg-slate-900 text-slate-400 uppercase text-[9px] tracking-widest border-b border-white/5">
                <tr>
                  <th class="p-3">Full Name</th>
                  <th class="p-3">Email</th>
                  <th class="p-3">Role</th>
                  <th class="p-3">Status</th>
                  <th class="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5 bg-slate-950/40">
                {usersList.map(u => (
                  <tr key={u.id}>
                    <td class="p-3 font-semibold text-white">{u.fullName} <span class="text-[10px] text-slate-500 font-mono">@{u.username}</span></td>
                    <td class="p-3">{u.email}</td>
                    <td class="p-3"><span class="px-2 py-0.5 rounded bg-slate-800 text-[10px] border border-slate-700">{u.role}</span></td>
                    <td class="p-3">
                      <span class={`px-2 py-0.5 rounded text-[10px] font-semibold ${u.enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                        {u.enabled ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td class="p-3 text-right flex justify-end gap-2">
                      <button
                        onClick={() => startEditingUser(u)}
                        class="p-1 bg-slate-800 rounded text-slate-400 hover:text-blue-400 cursor-pointer"
                        title="Edit Student Account Details"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(u.id)}
                        class="p-1 bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                        title={u.enabled ? 'Suspend Account' : 'Activate Account'}
                      >
                        {u.enabled ? <ToggleRight size={16} className="text-emerald-400" /> : <ToggleLeft size={16} className="text-slate-500" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        class="p-1 bg-slate-800 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Wipe User Data"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'directories' && (
        <div class="space-y-6">
          
          {/* File Explorer Breadcrumbs */}
          <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-900/40 px-4 py-3 rounded-xl border border-white/5">
            <button 
              onClick={() => {
                setSelectedUni(null);
                setSelectedBranch(null);
                setSelectedSem(null);
                setSelectedSubject(null);
                setSubjectNotes([]);
              }} 
              class="hover:text-blue-400 cursor-pointer transition font-sans"
            >
              Universities
            </button>
            
            {selectedUni && (
              <>
                <span class="text-slate-600">/</span>
                <button 
                  onClick={() => {
                    setSelectedBranch(null);
                    setSelectedSem(null);
                    setSelectedSubject(null);
                    setSubjectNotes([]);
                  }} 
                  class="hover:text-purple-400 cursor-pointer transition max-w-[200px] truncate font-sans"
                  title={selectedUni.name}
                >
                  {selectedUni.name}
                </button>
              </>
            )}

            {selectedBranch && (
              <>
                <span class="text-slate-600">/</span>
                <button 
                  onClick={() => {
                    setSelectedSem(null);
                    setSelectedSubject(null);
                    setSubjectNotes([]);
                  }} 
                  class="hover:text-indigo-400 cursor-pointer transition max-w-[200px] truncate font-sans"
                  title={selectedBranch.name}
                >
                  {selectedBranch.name}
                </button>
              </>
            )}

            {selectedSem && (
              <>
                <span class="text-slate-600">/</span>
                <button 
                  onClick={() => {
                    setSelectedSubject(null);
                    setSubjectNotes([]);
                  }} 
                  class="hover:text-emerald-400 cursor-pointer transition font-sans"
                >
                  Semester {selectedSem}
                </button>
              </>
            )}

            {selectedSubject && (
              <>
                <span class="text-slate-600">/</span>
                <span class="text-white max-w-[200px] truncate font-bold font-sans" title={selectedSubject.name}>
                  {selectedSubject.name}
                </span>
              </>
            )}
          </div>

          {/* Step 1: Universities List */}
          {!selectedUni && (
            <div class="space-y-6">
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/20 border border-white/5 p-4 rounded-2xl">
                <div class="space-y-1">
                  <h4 class="font-display font-extrabold text-white text-base">Select University</h4>
                  <p class="text-[10px] text-slate-500 font-sans">Select a university to view its engineering branches.</p>
                </div>
                <form onSubmit={handleAddUni} class="flex items-center gap-2 sm:max-w-xs w-full">
                  <input
                    type="text"
                    required
                    value={newUni.name}
                    onChange={e => setNewUni({ ...newUni, name: e.target.value })}
                    placeholder="Search or Add University..."
                    class="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 font-sans"
                  />
                  <button type="submit" class="bg-blue-600 hover:bg-blue-500 text-white rounded-lg p-2 cursor-pointer transition shrink-0" title="Add University"><Plus size={14} /></button>
                </form>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(() => {
                  const filteredUnis = universities.filter(u =>
                    u.name.toLowerCase().includes((newUni.name || '').toLowerCase())
                  );
                  if (universities.length === 0) {
                    return <div class="col-span-full text-xs text-slate-500 text-center py-8 font-sans">No universities registered in the system.</div>;
                  }
                  if (newUni.name && filteredUnis.length === 0) {
                    return <div class="col-span-full text-xs text-slate-500 text-center py-8 font-sans">Not Found</div>;
                  }
                  return filteredUnis.map(u => (
                    <div 
                      key={u.id}
                      onClick={() => {
                        setSelectedUni(u);
                        setSelectedBranch(null);
                        setSelectedSem(null);
                        setSelectedSubject(null);
                        setSubjectNotes([]);
                        setNewBranch(prev => ({ ...prev, universityId: String(u.id) }));
                        setNewSubject(prev => ({ ...prev, universityId: String(u.id) }));
                      }}
                      class="bg-slate-900/40 hover:bg-slate-900/70 border border-white/5 hover:border-blue-500/40 p-4 rounded-xl flex items-center justify-between gap-3 cursor-pointer group transition duration-300 shadow-md relative overflow-hidden"
                    >
                      <div class="absolute -right-6 -bottom-6 w-16 h-16 bg-blue-500/5 rounded-full group-hover:scale-150 transition-all duration-300"></div>
                      <span class="text-xs font-bold text-slate-300 group-hover:text-white truncate pr-2 relative z-10 font-sans">{u.name}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUni(u.id);
                        }} 
                        class="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 cursor-pointer transition shrink-0 relative z-10"
                        title="Delete University"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Step 2: Branches List */}
          {selectedUni && !selectedBranch && (
            <div class="space-y-6">
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/20 border border-white/5 p-4 rounded-2xl">
                <div class="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedUni(null)}
                    class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-white/5 cursor-pointer transition"
                    title="Back to Universities"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div class="space-y-1">
                    <h4 class="font-display font-extrabold text-white text-base">Select Branch</h4>
                    <p class="text-[10px] text-slate-500 font-sans">Browsing branches of <span class="text-purple-400 font-semibold">{selectedUni.name}</span>.</p>
                  </div>
                </div>
                <form onSubmit={handleAddBranch} class="flex items-center gap-2 sm:max-w-xs w-full">
                  <input
                    type="text"
                    required
                    value={newBranch.name}
                    onChange={e => setNewBranch({ ...newBranch, name: e.target.value, universityId: String(selectedUni.id) })}
                    placeholder="Add new branch name..."
                    class="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 font-sans"
                  />
                  <button type="submit" class="bg-purple-600 hover:bg-purple-500 text-white rounded-lg p-2 cursor-pointer transition shrink-0" title="Add Branch"><Plus size={14} /></button>
                </form>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(() => {
                  const uniBranches = branches.filter(b => !b.university || b.university.id === selectedUni.id);
                  if (uniBranches.length === 0) {
                    return (
                      <div class="col-span-full glass-panel border border-white/5 rounded-xl p-8 text-center text-slate-500 text-xs font-sans">
                        No branches registered under this university yet.
                      </div>
                    );
                  }
                  return uniBranches.map(b => (
                    <div 
                      key={b.id}
                      onClick={() => {
                        setSelectedBranch(b);
                        setSelectedSem(null);
                        setSelectedSubject(null);
                        setSubjectNotes([]);
                        setNewSubject(prev => ({ ...prev, branchId: String(b.id) }));
                      }}
                      class="bg-slate-900/40 hover:bg-slate-900/70 border border-white/5 hover:border-purple-500/40 p-4 rounded-xl flex items-center justify-between gap-3 cursor-pointer group transition duration-300 shadow-md relative overflow-hidden"
                    >
                      <div class="absolute -right-6 -bottom-6 w-16 h-16 bg-purple-500/5 rounded-full group-hover:scale-150 transition-all duration-300"></div>
                      <span class="text-xs font-bold text-slate-300 group-hover:text-white truncate pr-2 relative z-10 font-sans">{b.name}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBranch(b.id);
                        }} 
                        class="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 cursor-pointer transition shrink-0 relative z-10"
                        title="Delete Branch"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Step 3: Semester Selection Cards */}
          {selectedUni && selectedBranch && !selectedSem && (
            <div class="space-y-6">
              <div class="flex items-center justify-between gap-4 bg-slate-900/20 border border-white/5 p-4 rounded-2xl">
                <div class="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedBranch(null)}
                    class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-white/5 cursor-pointer transition"
                    title="Back to Branches"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div class="space-y-1">
                    <h4 class="font-display font-extrabold text-white text-base">Select Semester</h4>
                    <p class="text-[10px] text-slate-500 font-sans">Browsing semesters of <span class="text-purple-400 font-semibold">{selectedBranch.name}</span>.</p>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <div 
                    key={sem}
                    onClick={() => {
                      setSelectedSem(sem);
                      setSelectedSubject(null);
                      setSubjectNotes([]);
                      setNewSubject(prev => ({ ...prev, semester: sem, universityId: String(selectedUni.id), branchId: String(selectedBranch.id) }));
                    }}
                    class="bg-slate-900/40 hover:bg-slate-950/70 border border-white/5 hover:border-blue-500/40 p-8 rounded-xl flex flex-col items-center justify-center cursor-pointer group transition duration-300 shadow-md text-center relative overflow-hidden"
                  >
                    <div class="absolute -right-6 -bottom-6 w-16 h-16 bg-blue-500/5 rounded-full group-hover:scale-150 transition-all duration-300"></div>
                    <span class="text-4xl font-extrabold text-blue-500 group-hover:text-blue-400 font-display transition duration-300 relative z-10">{sem}</span>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 group-hover:text-white transition duration-300 relative z-10 font-sans">Semester</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Subjects List */}
          {selectedUni && selectedBranch && selectedSem && !selectedSubject && (
            <div class="space-y-6">
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/20 border border-white/5 p-4 rounded-2xl">
                <div class="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedSem(null)}
                    class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-white/5 cursor-pointer transition"
                    title="Back to Semesters"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div class="space-y-1">
                    <h4 class="font-display font-extrabold text-white text-base">Select Subject</h4>
                    <p class="text-[10px] text-slate-500 font-sans">Browsing subjects of Semester {selectedSem} in <span class="text-indigo-400 font-semibold">{selectedBranch.name}</span>.</p>
                  </div>
                </div>
                <form onSubmit={handleAddSubject} class="flex items-center gap-2 sm:max-w-md w-full">
                  <input
                    type="text"
                    required
                    value={newSubject.name}
                    onChange={e => setNewSubject({ ...newSubject, name: e.target.value, universityId: String(selectedUni.id), branchId: String(selectedBranch.id), semester: selectedSem })}
                    placeholder="Subject Name"
                    class="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 font-sans"
                  />
                  <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg p-2 cursor-pointer transition shrink-0" title="Map Subject"><Plus size={14} /></button>
                </form>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(() => {
                  const branchSubjects = subjects.filter(s => 
                    (!s.university || s.university.id === selectedUni.id) && 
                    s.branch?.id === selectedBranch.id && 
                    s.semester === selectedSem
                  );
                  if (branchSubjects.length === 0) {
                    return (
                      <div class="col-span-full glass-panel border border-white/5 rounded-xl p-8 text-center text-slate-500 text-xs font-sans">
                        No subjects mapped under this semester yet.
                      </div>
                    );
                  }
                  return branchSubjects.map(s => (
                    <div 
                      key={s.id}
                      onClick={() => {
                        setSelectedSubject(s);
                        fetchSubjectNotes(selectedUni.id, selectedBranch.id, s.id);
                      }}
                      class="bg-slate-900/40 hover:bg-slate-900/70 border border-white/5 hover:border-indigo-500/40 p-4 rounded-xl flex flex-col justify-between gap-3 cursor-pointer group transition duration-300 shadow-md relative overflow-hidden"
                    >
                      <div class="absolute -right-6 -bottom-6 w-16 h-16 bg-indigo-500/5 rounded-full group-hover:scale-150 transition-all duration-300"></div>
                      <div class="min-w-0 relative z-10 text-left font-sans flex-1">
                        <span class="text-xs font-bold text-slate-300 group-hover:text-white truncate block">{s.name}</span>
                        <span class="text-[9px] text-slate-500 block mt-0.5 font-sans">Semester {s.semester}</span>
                      </div>
                      
                      <div class="flex items-center justify-between gap-2 border-t border-white/5 pt-2 relative z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadModalSubject(s);
                            setShowUploadModal(true);
                          }}
                          class="px-2 py-1 bg-blue-600/20 hover:bg-blue-600 hover:text-white text-blue-400 rounded text-[9px] font-bold cursor-pointer transition flex items-center gap-1 shrink-0"
                        >
                          <Upload size={10} />
                          <span>Upload</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubject(s.id);
                          }} 
                          class="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 cursor-pointer transition shrink-0"
                          title="Delete Subject"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Step 5: Uploaded Materials List */}
          {selectedUni && selectedBranch && selectedSem && selectedSubject && (
            <div class="space-y-6">
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/20 border border-white/5 p-4 rounded-2xl">
                <div class="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setSelectedSubject(null);
                      setSubjectNotes([]);
                    }}
                    class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-white/5 cursor-pointer transition"
                    title="Back to Subjects"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div class="space-y-1">
                    <h4 class="font-display font-extrabold text-white text-base">Uploaded Materials</h4>
                    <p class="text-[10px] text-slate-500 font-sans">Showing matching documents for subject: <span class="text-emerald-400 font-semibold">{selectedSubject.name}</span>.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUploadModalSubject(selectedSubject);
                    setShowUploadModal(true);
                  }}
                  class="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow shadow-blue-500/20"
                >
                  <Plus size={14} />
                  <span>Upload Material</span>
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjectNotes.length === 0 ? (
                  <div class="col-span-full glass-panel border border-white/5 rounded-xl p-8 text-center text-slate-500 text-xs font-sans">
                    No approved notes uploaded for this subject yet.
                  </div>
                ) : (
                  subjectNotes.map(note => (
                    <div key={note.id} class="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-3 relative overflow-hidden group shadow-md hover:border-emerald-500/30 transition duration-300 font-sans">
                      <div class="absolute -right-6 -bottom-6 w-16 h-16 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-all duration-300"></div>
                      <div class="relative z-10">
                        <h5 class="text-xs font-bold text-white leading-tight truncate" title={note.title}>{note.title}</h5>
                        <p class="text-[10px] text-slate-400 line-clamp-2 mt-1">{note.description}</p>
                      </div>
                      <div class="flex flex-col gap-1 text-[9px] text-slate-500 border-t border-white/5 pt-2 relative z-10">
                        <span>Uploaded By: <span class="text-slate-300 font-semibold">{note.uploadedBy?.fullName || note.uploadedBy?.username}</span></span>
                        <span>Downloads: <span class="text-slate-300 font-semibold">{note.downloadCount}</span></span>
                        <span>Type: <span class="text-slate-300 font-semibold">{note.noteType}</span></span>
                        <span>Status: <span class="text-slate-300 font-semibold">{note.status}</span></span>
                      </div>
                      <div class="flex items-center gap-2 border-t border-white/5 pt-2 relative z-10">
                        <button
                          onClick={() => {
                            setPreviewNote(note);
                            setShowPreviewModal(true);
                          }}
                          class="flex-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg py-1.5 text-[10px] font-semibold transition cursor-pointer"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => window.open(`${import.meta.env.VITE_API_URL || ''}/api/notes/download/${note.id}`, '_blank')}
                          class="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-1.5 text-[10px] font-semibold transition cursor-pointer"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDeleteNoteAdmin(note.id)}
                          class="bg-slate-800 hover:bg-rose-950 text-rose-400 rounded-lg p-1.5 transition cursor-pointer shrink-0"
                          title="Delete Material"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab: Broadcast Announcements */}
      {activeTab === 'announcements' && (
        <form onSubmit={handleDispatchNotification} class="glass-panel border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl max-w-xl">
          <h3 class="font-display font-bold text-white text-lg">Broadcast Announcements</h3>
          <p class="text-xs text-slate-400 leading-normal">Announcements published here will display immediately in the homepage dashboard slider for all registered platform students.</p>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Title</label>
              <input
                type="text"
                required
                value={notifTitle}
                onChange={e => setNotifTitle(e.target.value)}
                placeholder="e.g. Server Maintenance: July 25th"
                class="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Message Body</label>
              <textarea
                required
                value={notifMessage}
                onChange={e => setNotifMessage(e.target.value)}
                placeholder="Announce updates, upcoming exams, or registration alerts..."
                class="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500"
                rows={4}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            class="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl text-xs cursor-pointer shadow transition"
          >
            {loading ? (
              <div class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Send size={13} />
                <span>Publish Announcement</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Tab: Flagged Reports */}
      {activeTab === 'reports' && (
        <div class="space-y-4">
          <h3 class="font-display font-bold text-white text-lg">Flagged Content Complaints</h3>
          {reports.length === 0 ? (
            <div class="glass-panel border border-white/5 rounded-xl p-8 text-center text-slate-500 text-xs">
              No reported documents found. Safe sandbox.
            </div>
          ) : (
            <div class="space-y-3">
              {reports.map(report => (
                <div key={report.id} class="glass-panel border border-rose-500/20 bg-rose-500/5 p-5 rounded-2xl space-y-3 shadow">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <span class="text-[10px] text-rose-400 font-bold uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">Flagged</span>
                      <h4 class="font-bold text-white text-sm mt-2">{report.note?.title}</h4>
                      <p class="text-xs text-slate-400 mt-1">Reason: "{report.reason}"</p>
                    </div>
                    
                    <div class="flex gap-2">
                      <button
                        onClick={() => handleDismissReport(report.id)}
                        class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleDeleteNoteAdmin(report.note.id)}
                        class="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition"
                      >
                        Delete Note
                      </button>
                    </div>
                  </div>

                  <div class="border-t border-white/5 pt-3 flex justify-between text-[10px] text-slate-500">
                    <span>Flagged by: <span class="text-blue-400">@{report.user?.username}</span></span>
                    <span>Note Owner: <span class="text-blue-400">@{report.note?.uploadedBy?.username}</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Sub Admin Deletion Requests */}
      {activeTab === 'requests' && (
        <div class="space-y-4 text-left">
          <h3 class="font-display font-bold text-white text-lg font-sans">Sub-Admin Deletion Requests</h3>
          {deleteRequests.length === 0 ? (
            <div class="glass-panel border border-white/5 rounded-xl p-8 text-center text-slate-500 text-xs font-sans">
              No deletion requests pending review.
            </div>
          ) : (
            <div class="space-y-3">
              {deleteRequests.map(req => (
                <div key={req.id} class="glass-panel border border-white/5 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {req.requestType}
                      </span>
                      <h4 class="text-xs font-bold text-white leading-tight">{req.targetName}</h4>
                    </div>
                    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-slate-500">
                      <span>Requested By: <span class="text-slate-300 font-semibold">@{req.requestedBy?.username} ({req.requestedBy?.fullName})</span></span>
                      <span>Requested At: <span class="text-slate-300 font-semibold">{req.createdAt ? new Date(req.createdAt).toLocaleString() : 'N/A'}</span></span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 self-end md:self-auto shrink-0">
                    <button
                      onClick={() => handleRejectDeleteRequest(req.id)}
                      class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-300 rounded-lg text-[10px] font-semibold cursor-pointer transition"
                    >
                      Reject Request
                    </button>
                    <button
                      onClick={() => handleApproveDeleteRequest(req.id)}
                      class="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-semibold cursor-pointer transition"
                    >
                      Approve Deletion
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit User Modal Popup */}
      {editingUser && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
          <div class="w-full max-w-lg glass-panel rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl relative overflow-hidden">
            <h3 class="font-display font-extrabold text-white text-lg">
              {editingUser.id ? 'Edit Student Profile & Reset Password' : 'Create New User Account'}
            </h3>
            
            <form onSubmit={handleUpdateUserSubmit} class="space-y-4">
              <div class="grid grid-cols-2 gap-3 text-xs">
                
                <div class="col-span-2">
                  <label class="block text-slate-400 mb-1 font-semibold uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-slate-400 mb-1 font-semibold uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-slate-400 mb-1 font-semibold uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-slate-400 mb-1 font-semibold uppercase tracking-wider">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={editForm.mobileNumber}
                    onChange={e => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-slate-400 mb-1 font-semibold uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    required
                    value={editForm.city}
                    onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div class="col-span-2">
                  <label class="block text-slate-400 mb-1 font-semibold uppercase tracking-wider">College Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.collegeName}
                    onChange={e => setEditForm({ ...editForm, collegeName: e.target.value })}
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-slate-400 mb-1 font-semibold uppercase tracking-wider">Account Role</label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  >
                    <option value="ROLE_STUDENT">STUDENT</option>
                    <option value="ROLE_ADMIN">ADMIN</option>
                    <option value="ROLE_SUBADMIN">SUBADMIN</option>
                  </select>
                </div>

                <div>
                  <label class="block text-slate-400 mb-1 font-semibold uppercase tracking-wider">
                    {editingUser.id ? 'Reset Password (Optional)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser.id}
                    value={editForm.password}
                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder={editingUser.id ? 'Enter new password' : 'Enter password'}
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>

              </div>

              <div class="flex justify-end gap-2 pt-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer"
                >
                  {editingUser.id ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: PDF/Image Inline Preview */}
      {showPreviewModal && previewNote && (
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-sans">
          <div class="w-full max-w-4xl h-[85vh] glass-panel rounded-2xl border border-white/10 p-6 flex flex-col space-y-4 shadow-2xl relative">
            
            {/* Modal Header */}
            <div class="flex items-center justify-between border-b border-white/5 pb-3">
              <div class="min-w-0 text-left">
                <h3 class="font-display font-extrabold text-white text-base truncate">{previewNote.title}</h3>
                <p class="text-[10px] text-slate-400 truncate mt-0.5">{previewNote.subject?.name} • {previewNote.noteType}</p>
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewNote(null);
                }}
                class="text-slate-400 hover:text-white bg-slate-800/40 px-3 py-1.5 border border-slate-700/40 rounded-xl cursor-pointer transition text-xs font-semibold"
              >
                Close
              </button>
            </div>

            {/* Modal Body: Embedded Preview */}
            <div class="flex-1 bg-slate-950/40 border border-white/5 rounded-xl overflow-hidden relative flex items-center justify-center">
              {checkingPreview ? (
                <div class="flex flex-col items-center gap-3 text-slate-400">
                  <div class="h-6 w-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span class="text-xs font-semibold">Verifying document preview availability...</span>
                </div>
              ) : previewError ? (
                <div class="max-w-md text-center p-6 space-y-3">
                  <div class="inline-flex p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 mb-2">
                    <AlertTriangle size={24} />
                  </div>
                  <h4 class="font-display font-bold text-white text-base">Preview Unsuccessful</h4>
                  <p class="text-xs text-slate-400 leading-normal">
                    {previewError}
                  </p>
                </div>
              ) : previewNote.fileType?.includes('image') ? (
                <img
                  src={`${import.meta.env.VITE_API_URL || ''}/api/notes/preview/${previewNote.id}`}
                  alt="Notes document page preview"
                  class="max-w-full max-h-full object-contain"
                />
              ) : (
                <iframe
                  src={`${import.meta.env.VITE_API_URL || ''}/api/notes/preview/${previewNote.id}`}
                  title="Notes PDF viewer document page preview"
                  class="w-full h-full border-none"
                />
              )}
            </div>

          </div>
        </div>
      )}

      {/* Modal: Upload Material Popup */}
      {showUploadModal && uploadModalSubject && (
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 font-sans text-left">
          <div class="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl relative">
            <div class="border-b border-white/5 pb-2">
              <h3 class="font-display font-extrabold text-white text-lg">Upload Note / Material</h3>
              <p class="text-[9px] text-slate-400 mt-1 font-mono tracking-tight uppercase">
                {selectedUni?.name} • {selectedBranch?.name} • Sem {selectedSem} • <span class="text-blue-400">{uploadModalSubject.name}</span>
              </p>
            </div>

            <form onSubmit={handleUploadSubmit} class="space-y-4 text-xs">
              <div>
                <label class="block text-slate-400 mb-1 font-semibold uppercase tracking-wider">Document Title</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="e.g. Unit 3 Electrostatics Notes"
                  class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label class="block text-slate-400 mb-1 font-semibold uppercase tracking-wider">Short Description</label>
                <textarea
                  value={uploadDesc}
                  onChange={e => setUploadDesc(e.target.value)}
                  placeholder="Brief description of the uploaded syllabus topic or contents..."
                  rows={2}
                  class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 font-sans resize-none"
                />
              </div>

              <div>
                <label class="block text-slate-400 mb-1 font-semibold uppercase tracking-wider">Note Type</label>
                <select
                  value={uploadNoteType}
                  onChange={e => setUploadNoteType(e.target.value)}
                  class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none"
                >
                  <option value="NOTE">Class Notes</option>
                  <option value="PAPER">Previous Year Question Paper</option>
                  <option value="SYLLABUS">Branch Syllabus / Curriculum</option>
                </select>
              </div>

              <div>
                <label class="block text-slate-400 mb-1 font-semibold uppercase tracking-wider">Select PDF or Image File</label>
                <div class="flex items-center gap-2">
                  <input
                    type="file"
                    required
                    accept=".pdf,image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        setUploadFiles(Array.from(e.target.files));
                      }
                    }}
                    class="hidden"
                    id="modal-upload-file-input"
                  />
                  <label 
                    htmlFor="modal-upload-file-input"
                    class="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-lg text-slate-300 hover:text-white cursor-pointer transition font-semibold"
                  >
                    <Upload size={12} />
                    <span>Choose File</span>
                  </label>
                  <span class="text-[10px] text-slate-400 truncate max-w-[200px]">
                    {uploadFiles.length > 0 ? uploadFiles[0].name : 'No file selected'}
                  </span>
                </div>
              </div>

              <div class="flex justify-end gap-2 pt-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadTitle('');
                    setUploadDesc('');
                    setUploadFiles([]);
                  }}
                  class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/5 cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {uploadLoading ? (
                    <>
                      <div class="h-3 w-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Upload</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
