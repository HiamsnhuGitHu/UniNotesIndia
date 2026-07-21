import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, School, FileCheck, Download, AlertTriangle, ShieldCheck, 
  Trash2, ToggleLeft, ToggleRight, Check, X, Plus, Edit2, Send, MessageSquare 
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
  const [usersList, setUsersList] = useState([]);
  const [reports, setReports] = useState([]);

  // Directories management
  const [universities, setUniversities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);

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
    if (activeTab === 'approvals') fetchPendingNotes();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'directories') fetchDirectories();
    if (activeTab === 'reports') fetchReports();
  }, [activeTab]);

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
      fetchStats();
    } catch (err) {
      showAlert('error', 'Failed to reject note.');
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
    if (!window.confirm('Deleting university will cascade delete all associated subjects and physical notes! Proceed?')) return;
    try {
      await api.delete(`/api/admin/universities/${id}`);
      showAlert('success', 'University deleted.');
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
    if (!window.confirm('Deleting branch will cascade delete all associated physical note files! Proceed?')) return;
    try {
      await api.delete(`/api/admin/branches/${id}`);
      showAlert('success', 'Branch deleted.');
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
    if (!window.confirm('Deleting subject will cascade delete associated note files from disk. Proceed?')) return;
    try {
      await api.delete(`/api/admin/subjects/${id}`);
      showAlert('success', 'Subject deleted.');
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
    if (!window.confirm('Delete note and physical file permanently? This will dismiss all reports against it.')) return;
    try {
      await api.delete(`/api/admin/notes/${noteId}`);
      showAlert('success', 'Note and associated files deleted.');
      fetchReports();
      fetchStats();
    } catch (err) {
      showAlert('error', 'Failed to delete note.');
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
        {['stats', 'approvals', 'users', 'directories', 'announcements', 'reports']
          .filter(tab => !(isSubAdmin && tab === 'users'))
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
              {tab}
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

      {/* Tab: Pending Approvals */}
      {activeTab === 'approvals' && (
        <div class="space-y-4">
          <h3 class="font-display font-bold text-white text-lg">Pending Notes Queue</h3>
          {pendingNotes.length === 0 ? (
            <div class="glass-panel border border-white/5 rounded-xl p-8 text-center text-slate-500 text-xs">
              No notes awaiting moderation approval.
            </div>
          ) : (
            <div class="space-y-3">
              {pendingNotes.map(note => (
                <div key={note.id} class="glass-panel border border-white/5 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 class="text-xs font-bold text-white">{note.title}</h4>
                    <p class="text-[10px] text-slate-400 mt-1">
                      Uploaded by <span class="text-blue-400">@{note.uploadedBy?.username}</span> • {note.university?.name} • {note.noteType}
                    </p>
                  </div>
                  <div class="flex gap-2">
                    <button
                      onClick={() => handleApproveNote(note.id)}
                      class="p-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-lg cursor-pointer transition text-xs font-semibold"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectNote(note.id)}
                      class="p-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg cursor-pointer transition text-xs font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
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

      {/* Tab: Directory Management (Universities, Branches, Subjects CRUD) */}
      {activeTab === 'directories' && (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Universities Setup */}
          <div class="space-y-4">
            <h4 class="font-display font-bold text-white text-sm">Universities</h4>
            <form onSubmit={handleAddUni} class="flex gap-2">
              <input
                type="text"
                required
                value={newUni.name}
                onChange={e => setNewUni({ ...newUni, name: e.target.value })}
                placeholder="University Name"
                class="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
              />
              <button type="submit" class="bg-blue-600 hover:bg-blue-500 text-white rounded-lg p-2 cursor-pointer transition"><Plus size={14} /></button>
            </form>
            <div class="max-h-64 overflow-y-auto space-y-2 pr-2">
              {(() => {
                const filteredUnis = universities.filter(u =>
                  u.name.toLowerCase().includes((newUni.name || '').toLowerCase())
                );
                if (newUni.name && filteredUnis.length === 0) {
                  return <div class="text-xs text-slate-500 text-center py-4">Not Found</div>;
                }
                return filteredUnis.map(u => (
                  <div key={u.id} class="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-lg border border-white/5">
                    <span class="text-xs text-slate-300 font-medium truncate max-w-[150px]">{u.name}</span>
                    <button onClick={() => handleDeleteUni(u.id)} class="text-slate-500 hover:text-rose-400 cursor-pointer transition"><Trash2 size={13} /></button>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Branches Setup */}
          <div class="space-y-4">
            <h4 class="font-display font-bold text-white text-sm">Branches</h4>
            <form onSubmit={handleAddBranch} class="space-y-2">
              <select
                required
                value={newBranch.universityId}
                onChange={e => setNewBranch({ ...newBranch, universityId: e.target.value })}
                class="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300 outline-none"
              >
                <option value="">Select University</option>
                {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <div class="flex gap-2">
                <input
                  type="text"
                  required
                  value={newBranch.name}
                  onChange={e => setNewBranch({ ...newBranch, name: e.target.value })}
                  placeholder="Branch Name"
                  class="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                />
                <button type="submit" class="bg-purple-600 hover:bg-purple-500 text-white rounded-lg p-2 cursor-pointer transition"><Plus size={14} /></button>
              </div>
            </form>
            <div class="max-h-64 overflow-y-auto space-y-2 pr-2">
              {branches.map(b => (
                <div key={b.id} class="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-lg border border-white/5">
                  <div class="min-w-0">
                    <span class="text-xs text-slate-300 font-medium truncate block max-w-[150px]">{b.name}</span>
                    {b.university && (
                      <span class="text-[9px] text-slate-500 block truncate max-w-[150px]">{b.university.name}</span>
                    )}
                  </div>
                  <button onClick={() => handleDeleteBranch(b.id)} class="text-slate-500 hover:text-rose-400 cursor-pointer transition shrink-0"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Subjects Mapping Setup */}
          <div class="space-y-4">
            <h4 class="font-display font-bold text-white text-sm">Subjects mapping</h4>
            <form onSubmit={handleAddSubject} class="space-y-2.5 bg-slate-900/20 border border-white/5 p-3 rounded-xl">
              <select
                required
                value={newSubject.universityId}
                onChange={e => setNewSubject({ ...newSubject, universityId: e.target.value })}
                class="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300 outline-none"
              >
                <option value="">Select University</option>
                {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <input
                type="text"
                required
                value={newSubject.name}
                onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                placeholder="Subject Name"
                class="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
              />
              <div class="grid grid-cols-2 gap-2">
                <select
                  required
                  value={newSubject.branchId}
                  onChange={e => setNewSubject({ ...newSubject, branchId: e.target.value })}
                  class="text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300 outline-none"
                >
                  <option value="">Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select
                  required
                  value={newSubject.semester}
                  onChange={e => setNewSubject({ ...newSubject, semester: Number(e.target.value) })}
                  class="text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300 outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
              <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-xs font-semibold cursor-pointer transition">
                Map Subject
              </button>
            </form>
            <div class="max-h-44 overflow-y-auto space-y-2 pr-2">
              {subjects.map(s => (
                <div key={s.id} class="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-lg border border-white/5">
                  <div class="min-w-0">
                    <span class="text-xs text-slate-300 font-medium truncate block max-w-[150px]">{s.name}</span>
                    <span class="text-[9px] text-slate-500 block truncate max-w-[150px]">
                      {s.branch?.name} • Sem {s.semester}
                      {s.university && ` • ${s.university.name}`}
                    </span>
                  </div>
                  <button onClick={() => handleDeleteSubject(s.id)} class="text-slate-500 hover:text-rose-400 cursor-pointer transition shrink-0"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>

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

    </div>
  );
}
