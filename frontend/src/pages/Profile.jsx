import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Smartphone, MapPin, GraduationCap, Calendar, Bookmark, Upload, CheckCircle2, Clock, Trash } from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useAuth();

  // Profile Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    role: '',
    email: '',
    mobileNumber: '',
    collegeName: '',
    city: ''
  });

  // Lists
  const [bookmarks, setBookmarks] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [stats, setStats] = useState({
    totalUploaded: 0,
    totalApproved: 0,
    totalDownloads: 0,
    averageRating: 0.0,
    totalReviews: 0
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleStartEdit = () => {
    setFormData({
      fullName: user?.fullName || '',
      username: user?.username || '',
      role: user?.role || '',
      email: user?.email || '',
      mobileNumber: user?.mobileNumber || '',
      collegeName: user?.collegeName || '',
      city: user?.city || ''
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/api/auth/profile', formData);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setIsEditing(false);
      showAlert('success', 'Profile updated successfully.');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        showAlert('error', err.response.data.error);
      } else {
        showAlert('error', 'Failed to update profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      const [bmarkRes, uploadsRes, statsRes] = await Promise.all([
        api.get('/api/notes/bookmarks'),
        api.get('/api/notes/my-uploads'),
        api.get('/api/notes/contributor-stats')
      ]);
      setBookmarks(bmarkRes.data);
      setUploads(uploadsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load profile lists', err);
    }
  };

  const removeBookmark = async (noteId) => {
    try {
      await api.delete(`/api/notes/${noteId}/bookmark`);
      setBookmarks(prev => prev.filter(b => b.note.id !== noteId));
      showAlert('success', 'Bookmark removed.');
    } catch (err) {
      showAlert('error', 'Failed to remove bookmark.');
    }
  };

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert({ type: '', text: '' }), 3000);
  };

  return (
    <div class="space-y-8">

      {/* Alert Banner */}
      {alert.text && (
        <div class={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg border text-xs shadow-xl ${alert.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
          <span>{alert.text}</span>
        </div>
      )}

      {/* User Information Profile Card */}
      <div class="glass-panel border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div class="absolute -top-32 -left-32 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div class="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div class="flex flex-col sm:flex-row items-center gap-6">
            <div class="h-20 w-20 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-display font-extrabold text-3xl shrink-0">
              {(isEditing ? formData.fullName : user?.fullName)?.charAt(0).toUpperCase()}
            </div>

            <div class="text-center sm:text-left space-y-1">
              <h2 class="font-display font-extrabold text-white text-2xl">
                {isEditing ? formData.fullName || 'User Profile' : user?.fullName}
              </h2>
            </div>
          </div>

          {/* Upper Right Action Buttons */}
          <div class="self-center sm:self-start shrink-0">
            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEdit}
                class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow shadow-blue-500/20"
              >
                Edit Profile
              </button>
            ) : (
              <div class="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition border border-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={loading}
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow shadow-emerald-500/20"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Grid of columns */}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-white/5 mt-6 pt-6 text-xs relative z-10">
          
          {/* Box 1: Full Name */}
          <div class="flex items-center gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-white/5 text-left">
            <User className="h-4 w-4 text-slate-400" />
            <div class="flex-1">
              <p class="text-[10px] text-slate-500 font-semibold uppercase">Full Name</p>
              {!isEditing ? (
                <p class="text-slate-200 mt-0.5 font-semibold">{user?.fullName}</p>
              ) : (
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  class="w-full text-xs text-slate-200 bg-transparent border-b border-slate-700 focus:border-blue-500 outline-none mt-1 py-0.5"
                />
              )}
            </div>
          </div>

          {/* Box 2: Username */}
          <div class="flex items-center gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-white/5 text-left">
            <User className="h-4 w-4 text-slate-400" />
            <div class="flex-1">
              <p class="text-[10px] text-slate-500 font-semibold uppercase">Username</p>
              {!isEditing ? (
                <p class="text-slate-200 mt-0.5">@{user?.username}</p>
              ) : (
                <input
                  type="text"
                  required
                  disabled={user?.role !== 'ROLE_ADMIN'}
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  class="w-full text-xs text-slate-200 bg-transparent border-b border-slate-700 focus:border-blue-500 outline-none mt-1 py-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              )}
            </div>
          </div>

          {/* Box 3: Role */}
          <div class="flex items-center gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-white/5 text-left">
            <GraduationCap className="h-4 w-4 text-slate-400" />
            <div class="flex-1">
              <p class="text-[10px] text-slate-500 font-semibold uppercase">Role</p>
              {!isEditing ? (
                <p class="text-slate-200 mt-0.5">{user?.role?.replace('ROLE_', '')}</p>
              ) : (
                <select
                  disabled={user?.role !== 'ROLE_ADMIN'}
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  class="w-full text-xs text-slate-200 bg-slate-900 border-b border-slate-700 focus:border-blue-500 outline-none mt-1 py-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="ROLE_STUDENT">STUDENT</option>
                  <option value="ROLE_SUBADMIN">SUBADMIN</option>
                  <option value="ROLE_ADMIN">ADMIN</option>
                </select>
              )}
            </div>
          </div>

          {/* Box 4: Email Address */}
          <div class="flex items-center gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-white/5 text-left">
            <Mail className="h-4 w-4 text-slate-400" />
            <div class="flex-1">
              <p class="text-[10px] text-slate-500 font-semibold uppercase">Email Address</p>
              {!isEditing ? (
                <p class="text-slate-200 mt-0.5">{user?.email}</p>
              ) : (
                <input
                  type="email"
                  required
                  disabled={user?.role !== 'ROLE_ADMIN'}
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  class="w-full text-xs text-slate-200 bg-transparent border-b border-slate-700 focus:border-blue-500 outline-none mt-1 py-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              )}
            </div>
          </div>

          {/* Box 5: Mobile Number */}
          <div class="flex items-center gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-white/5 text-left">
            <Smartphone className="h-4 w-4 text-slate-400" />
            <div class="flex-1">
              <p class="text-[10px] text-slate-500 font-semibold uppercase">Mobile Number</p>
              {!isEditing ? (
                <p class="text-slate-200 mt-0.5">{user?.mobileNumber || 'N/A'}</p>
              ) : (
                <input
                  type="text"
                  value={formData.mobileNumber}
                  onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                  class="w-full text-xs text-slate-200 bg-transparent border-b border-slate-700 focus:border-blue-500 outline-none mt-1 py-0.5"
                />
              )}
            </div>
          </div>

          {/* Box 6: College Name */}
          <div class="flex items-center gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-white/5 text-left">
            <GraduationCap className="h-4 w-4 text-slate-400" />
            <div class="flex-1">
              <p class="text-[10px] text-slate-500 font-semibold uppercase">College Name</p>
              {!isEditing ? (
                <p class="text-slate-200 mt-0.5">{user?.collegeName || 'N/A'}</p>
              ) : (
                <input
                  type="text"
                  value={formData.collegeName}
                  onChange={e => setFormData({ ...formData, collegeName: e.target.value })}
                  class="w-full text-xs text-slate-200 bg-transparent border-b border-slate-700 focus:border-blue-500 outline-none mt-1 py-0.5"
                />
              )}
            </div>
          </div>

          {/* Box 7: City / Address */}
          <div class="flex items-center gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-white/5 text-left sm:col-span-2 lg:col-span-3">
            <MapPin className="h-4 w-4 text-slate-400" />
            <div class="flex-1">
              <p class="text-[10px] text-slate-500 font-semibold uppercase">City / Address</p>
              {!isEditing ? (
                <p class="text-slate-200 mt-0.5">{user?.city || 'N/A'}</p>
              ) : (
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  class="w-full text-xs text-slate-200 bg-transparent border-b border-slate-700 focus:border-blue-500 outline-none mt-1 py-0.5"
                />
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Contributor Stats Dashboard */}
      <div class="glass-panel border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div class="absolute -bottom-32 -right-32 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <h3 class="font-display font-extrabold text-white text-sm mb-4 flex items-center gap-2 relative z-10">
          <GraduationCap size={16} className="text-blue-400" />
          <span>My Contributor Metrics</span>
        </h3>
        
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10 text-xs">
          
          <div class="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[9px] text-slate-500 font-semibold uppercase tracking-wider font-sans">Total Notes Uploaded</span>
              <Upload size={13} className="text-blue-400" />
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-xl font-extrabold text-white font-display">{stats.totalUploaded}</span>
              <span class="text-[9px] text-emerald-400 font-semibold">({stats.totalApproved} Approved)</span>
            </div>
          </div>

          <div class="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[9px] text-slate-500 font-semibold uppercase tracking-wider font-sans">Total Downloads</span>
              <Upload size={13} className="text-purple-400 rotate-180" />
            </div>
            <div>
              <span class="text-xl font-extrabold text-white font-display">{stats.totalDownloads}</span>
            </div>
          </div>

          <div class="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[9px] text-slate-500 font-semibold uppercase tracking-wider font-sans">Average Rating</span>
              <span class="text-yellow-400 text-xs font-bold font-sans">★</span>
            </div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-xl font-extrabold text-white font-display">
                {stats.averageRating > 0 ? stats.averageRating : 'N/A'}
              </span>
              {stats.totalReviews > 0 && (
                <span class="text-[9px] text-slate-400 font-semibold">({stats.totalReviews} reviews)</span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Tabs / Side by Side lists */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Bookmarks Column */}
        <div class="space-y-4">
          <h3 class="font-display font-bold text-white text-lg flex items-center gap-2">
            <Bookmark size={18} className="text-yellow-400" />
            <span>Bookmarked Notes ({bookmarks.length})</span>
          </h3>

          {bookmarks.length === 0 ? (
            <div class="glass-panel border border-white/5 rounded-xl p-8 text-center text-slate-500 text-xs">
              No bookmarked items yet. Keep notes saved here for quick reading.
            </div>
          ) : (
            <div class="space-y-3">
              {bookmarks.map((b) => (
                <div key={b.id} class="glass-panel border border-white/5 p-4 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-900/40 transition">
                  <div class="min-w-0">
                    <h4 class="text-xs font-bold text-white truncate">{b.note?.title}</h4>
                    <p class="text-[10px] text-slate-400 truncate mt-0.5">{b.note?.subject?.name} • {b.note?.university?.name}</p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => window.open(`${import.meta.env.VITE_API_URL || ''}/api/notes/download/${b.note.id}`, '_blank')}
                      class="p-1.5 bg-blue-600/10 text-blue-400 rounded-lg cursor-pointer hover:bg-blue-600 hover:text-white transition"
                      title="Download"
                    >
                      <Upload size={12} className="rotate-180" />
                    </button>
                    <button
                      onClick={() => removeBookmark(b.note.id)}
                      class="p-1.5 bg-slate-800 text-slate-400 rounded-lg cursor-pointer hover:text-rose-400 transition"
                      title="Remove Bookmark"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Uploads Column */}
        <div class="space-y-4">
          <h3 class="font-display font-bold text-white text-lg flex items-center gap-2">
            <Upload size={18} className="text-blue-400" />
            <span>My Uploaded Materials ({uploads.length})</span>
          </h3>

          {uploads.length === 0 ? (
            <div class="glass-panel border border-white/5 rounded-xl p-8 text-center text-slate-500 text-xs">
              You haven't uploaded any study materials yet.
            </div>
          ) : (
            <div class="space-y-3">
              {uploads.map((note) => (
                <div key={note.id} class="glass-panel border border-white/5 p-4 rounded-xl flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <h4 class="text-xs font-bold text-white truncate">{note.title}</h4>
                    <p class="text-[10px] text-slate-400 truncate mt-0.5">{note.subject?.name} • {note.noteType}</p>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <div class={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-semibold ${note.status === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                      {note.status === 'APPROVED' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                      <span>{note.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
