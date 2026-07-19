import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Smartphone, MapPin, GraduationCap, Calendar, Bookmark, Upload, CheckCircle2, Clock, Trash } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  
  // Lists
  const [bookmarks, setBookmarks] = useState([]);
  const [uploads, setUploads] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const [bmarkRes, notesRes] = await Promise.all([
        api.get('/api/notes/bookmarks'),
        api.get('/api/notes/search') // Fetch approved notes to filter, or fetch all notes
      ]);
      setBookmarks(bmarkRes.data);
      
      // Filter user uploads
      const userUploads = notesRes.data.filter(n => n.uploadedBy?.id === user.id);
      setUploads(userUploads);
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
        <div class={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg border text-xs shadow-xl ${
          alert.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <span>{alert.text}</span>
        </div>
      )}

      {/* User Information Profile Card */}
      <div class="glass-panel border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div class="absolute -top-32 -left-32 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div class="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div class="h-20 w-20 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-display font-extrabold text-3xl shrink-0">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          
          <div class="text-center sm:text-left space-y-1">
            <h2 class="font-display font-extrabold text-white text-2xl">{user?.fullName}</h2>
            <p class="text-xs text-slate-400 font-mono">@{user?.username} ({user?.role?.replace('ROLE_', '')})</p>
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-slate-400 mt-2">
              <span class="flex items-center gap-1"><GraduationCap size={14} className="text-slate-500" />{user?.collegeName}</span>
              <span class="flex items-center gap-1"><MapPin size={14} className="text-slate-500" />{user?.city}</span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 mt-6 pt-6 text-xs relative z-10">
          <div class="flex items-center gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
            <Mail className="h-4 w-4 text-slate-400" />
            <div>
              <p class="text-[10px] text-slate-500 font-semibold uppercase">Email Address</p>
              <p class="text-slate-200 mt-0.5">{user?.email}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
            <Smartphone className="h-4 w-4 text-slate-400" />
            <div>
              <p class="text-[10px] text-slate-500 font-semibold uppercase">Mobile Number</p>
              <p class="text-slate-200 mt-0.5">{user?.mobileNumber}</p>
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
                      onClick={() => window.open(`/api/notes/download/${b.note.id}`, '_blank')}
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
                    <div class={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-semibold ${
                      note.status === 'APPROVED' 
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
