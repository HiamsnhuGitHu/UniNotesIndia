import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HelpCircle, Trash2, CheckCircle, AlertCircle, Plus, Send } from 'lucide-react';

export default function Requests() {
  const { user } = useAuth();
  
  // Lists
  const [requests, setRequests] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Form selections
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uniId, setUniId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [semester, setSemester] = useState(1);
  const [subjectId, setSubjectId] = useState('');

  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [alert, setAlert] = useState({ type: '', text: '' });

  // Initial load
  useEffect(() => {
    fetchRequests();
    api.get('/api/universities').then(res => setUniversities(res.data));
    api.get('/api/branches').then(res => setBranches(res.data));
  }, []);

  // Fetch subjects dynamically based on branch and semester selection
  useEffect(() => {
    if (branchId && semester) {
      api.get(`/api/subjects/branch/${branchId}/semester/${semester}`)
        .then(res => setSubjects(res.data))
        .catch(err => console.error(err));
    } else {
      setSubjects([]);
    }
  }, [branchId, semester]);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/requests');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !uniId || !branchId || !subjectId) return;

    setLoading(true);
    try {
      await api.post('/api/requests', {
        title,
        description,
        universityId: uniId,
        branchId,
        semester,
        subjectId
      });
      
      showAlert('success', 'Request posted successfully!');
      setTitle('');
      setDescription('');
      setUniId('');
      setBranchId('');
      setSubjectId('');
      setShowForm(false);
      fetchRequests();
    } catch (err) {
      showAlert('error', 'Failed to post request.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      await api.delete(`/api/requests/${id}`);
      showAlert('success', 'Request deleted.');
      fetchRequests();
    } catch (err) {
      showAlert('error', 'Failed to delete request.');
    }
  };

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert({ type: '', text: '' }), 3500);
  };

  return (
    <div class="space-y-6">
      
      {/* Page Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-display text-2xl font-extrabold text-white">Requested Notes</h1>
          <p class="text-xs text-slate-400 mt-1">Can't find a study material? Ask the community to help you out.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          class="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs cursor-pointer shadow-lg shadow-blue-500/20 transition-all duration-300"
        >
          <Plus size={14} />
          <span>{showForm ? 'Cancel Request' : 'Post New Request'}</span>
        </button>
      </div>

      {/* Floating Status Alerts */}
      {alert.text && (
        <div class={`fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border text-sm shadow-xl ${
          alert.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {alert.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{alert.text}</span>
        </div>
      )}

      {/* Submit Request Form */}
      {showForm && (
        <form onSubmit={handleSubmit} class="glass-panel border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl max-w-2xl">
          <h3 class="font-display font-bold text-white text-base">Request Details</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Note Title / Course Name</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Need Compiler Design Lab File & Notes"
                class="w-full text-xs bg-slate-900/60 rounded-xl border border-slate-700 px-3 py-2.5 text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail specific units or topics you need (e.g. Unit 3 LR parsing)..."
                class="w-full text-xs bg-slate-900/60 rounded-xl border border-slate-700 p-3 text-white outline-none focus:border-blue-500"
                rows={3}
              />
            </div>

            {/* University Selection */}
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">University</label>
              <select
                required
                value={uniId}
                onChange={(e) => setUniId(e.target.value)}
                class="w-full text-xs bg-slate-900/60 rounded-xl border border-slate-700 p-2.5 text-white outline-none"
              >
                <option value="">Select University</option>
                {universities.map(u => (
                  <option key={u.id} value={u.id} class="bg-slate-950">{u.name}</option>
                ))}
              </select>
            </div>

            {/* Branch Selection */}
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Branch</label>
              <select
                required
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                class="w-full text-xs bg-slate-900/60 rounded-xl border border-slate-700 p-2.5 text-white outline-none"
              >
                <option value="">Select Branch</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id} class="bg-slate-950">{b.name}</option>
                ))}
              </select>
            </div>

            {/* Semester Selection */}
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Semester</label>
              <select
                required
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                class="w-full text-xs bg-slate-900/60 rounded-xl border border-slate-700 p-2.5 text-white outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s} class="bg-slate-950">Semester {s}</option>
                ))}
              </select>
            </div>

            {/* Subject Selection */}
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Subject</label>
              <select
                required
                disabled={!branchId}
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                class="w-full text-xs bg-slate-900/60 rounded-xl border border-slate-700 p-2.5 text-white outline-none disabled:opacity-50"
              >
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id} class="bg-slate-950">{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            class="w-full flex justify-center items-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow"
          >
            {loading ? (
              <div class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Send size={13} />
                <span>Submit Request</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Requests Listing Grid */}
      {requests.length === 0 ? (
        <div class="glass-panel rounded-2xl p-12 text-center text-slate-500 border border-white/5">
          <HelpCircle size={36} className="text-slate-600 mx-auto mb-2" />
          <p class="text-xs">No active note requests at the moment. Need something? Post a request!</p>
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map(req => {
            const isCreatorOrAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUBADMIN' || req.requestedBy?.id === user?.id;
            return (
              <div key={req.id} class="glass-panel border border-white/5 rounded-2xl p-5 shadow flex flex-col justify-between">
                <div>
                  <div class="flex items-start justify-between gap-3">
                    <span class="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      Sem {req.semester}
                    </span>
                    {isCreatorOrAdmin && (
                      <button
                        onClick={() => handleDelete(req.id)}
                        class="text-slate-500 hover:text-rose-400 p-1 bg-slate-800/40 rounded hover:bg-rose-500/10 cursor-pointer transition"
                        title="Delete Request"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <h3 class="font-bold text-white text-base mt-2.5">{req.title}</h3>
                  <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">{req.description}</p>
                </div>

                <div class="mt-5 border-t border-white/5 pt-3.5 text-[10px] text-slate-500 space-y-1">
                  <div>University: <span class="text-slate-300 font-medium">{req.university?.name}</span></div>
                  <div>Subject: <span class="text-slate-300 font-medium">{req.subject?.name} ({req.branch?.name})</span></div>
                  <div class="flex items-center justify-between text-slate-500 mt-1">
                    <span>Requested by: <span class="text-blue-400 font-medium">{req.requestedBy?.fullName || req.requestedBy?.username}</span></span>
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
