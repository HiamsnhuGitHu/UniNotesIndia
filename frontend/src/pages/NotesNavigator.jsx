import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { 
  Folder, ArrowLeft, Star, Download, Bookmark, Flag, Eye, 
  ChevronRight, Calendar, User, FileText, CheckCircle2, MessageSquare, AlertCircle
} from 'lucide-react';

export default function NotesNavigator() {
  const location = useLocation();

  // Navigation levels
  const [universities, setUniversities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);

  // Selections
  const [selectedUni, setSelectedUni] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedSem, setSelectedSem] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Active details modal
  const [activeNote, setActiveNote] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  
  // Forms states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Status message alerts
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const [uniRes, branchRes, bmarkRes] = await Promise.all([
          api.get('/api/universities'),
          api.get('/api/branches'),
          api.get('/api/notes/bookmarks')
        ]);
        setUniversities(uniRes.data);
        setBranches(branchRes.data);
        setBookmarkedIds(new Set(bmarkRes.data.map(b => b.note.id)));

        // Handle parameters passed from Dashboard search
        if (location.state) {
          const { universityId, query } = location.state;
          if (universityId) {
            const matchedUni = uniRes.data.find(u => u.id === Number(universityId));
            if (matchedUni) setSelectedUni(matchedUni);
          }
          if (query) {
            setSearchQuery(query);
            performSearch(query, universityId);
          }
        }
      } catch (err) {
        console.error('Failed to load initial navigator directory data', err);
      }
    };
    init();
  }, [location]);

  // Perform search query directly
  const performSearch = async (queryStr, uniId) => {
    try {
      const params = {};
      if (uniId) params.universityId = uniId;
      if (queryStr) params.query = queryStr;
      const res = await api.get('/api/notes/search', { params });
      setNotes(res.data);
      // Skip steps to show search results directly
      setSelectedBranch(true);
      setSelectedSem(true);
      setSelectedSubject(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch subjects when branch & semester are selected
  useEffect(() => {
    if (selectedBranch && selectedSem) {
      api.get(`/api/subjects/branch/${selectedBranch.id}/semester/${selectedSem}`)
        .then(res => setSubjects(res.data))
        .catch(err => console.error(err));
    }
  }, [selectedBranch, selectedSem]);

  // Fetch notes when subject & university are selected
  useEffect(() => {
    if (selectedUni && selectedBranch && selectedSem && selectedSubject) {
      api.get('/api/notes/search', {
        params: {
          universityId: selectedUni.id,
          branchId: selectedBranch.id,
          semester: selectedSem,
          subjectId: selectedSubject.id
        }
      })
      .then(res => setNotes(res.data))
      .catch(err => console.error(err));
    }
  }, [selectedUni, selectedBranch, selectedSem, selectedSubject]);

  // Fetch reviews when note detail is opened
  const openNoteDetails = async (note) => {
    setActiveNote(note);
    setReviewText('');
    setReviewRating(5);
    setReportReason('');
    setShowReportForm(false);
    try {
      const res = await api.get(`/api/notes/${note.id}/reviews`);
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = (note) => {
    // Open in new tab or trigger download direct stream
    window.open(`${api.defaults.baseURL || ''}/api/notes/download/${note.id}`, '_blank');
    // Increment local download count visual
    setActiveNote(prev => prev ? { ...prev, downloadCount: prev.downloadCount + 1 } : null);
  };

  const handleBookmarkToggle = async (note) => {
    try {
      const isBookmarked = bookmarkedIds.has(note.id);
      if (isBookmarked) {
        await api.delete(`/api/notes/${note.id}/bookmark`);
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          next.delete(note.id);
          return next;
        });
        showAlert('success', 'Removed bookmark');
      } else {
        await api.post(`/api/notes/${note.id}/bookmark`);
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          next.add(note.id);
          return next;
        });
        showAlert('success', 'Added bookmark');
      }
    } catch (err) {
      showAlert('error', 'Failed to toggle bookmark');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    try {
      const res = await api.post(`/api/notes/${activeNote.id}/reviews`, {
        rating: reviewRating,
        reviewText
      });
      setReviews(prev => [res.data, ...prev]);
      setReviewText('');
      showAlert('success', 'Review posted!');
    } catch (err) {
      showAlert('error', 'Failed to post review');
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    try {
      await api.post(`/api/notes/${activeNote.id}/reports`, {
        reason: reportReason
      });
      setShowReportForm(false);
      setReportReason('');
      showAlert('success', 'Report filed. Administrators will investigate.');
    } catch (err) {
      showAlert('error', 'Failed to file report');
    }
  };

  const showAlert = (type, text) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg({ type: '', text: '' }), 3500);
  };

  const calculateAverageRating = (reviewsList) => {
    if (!reviewsList || reviewsList.length === 0) return 0;
    const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviewsList.length).toFixed(1);
  };

  // Navigation handlers
  const resetToUni = () => {
    setSelectedUni(null);
    setSelectedBranch(null);
    setSelectedSem(null);
    setSelectedSubject(null);
    setNotes([]);
  };

  const resetToBranch = () => {
    setSelectedBranch(null);
    setSelectedSem(null);
    setSelectedSubject(null);
    setNotes([]);
  };

  const resetToSem = () => {
    setSelectedSem(null);
    setSelectedSubject(null);
    setNotes([]);
  };

  const resetToSubject = () => {
    setSelectedSubject(null);
    setNotes([]);
  };

  return (
    <div class="space-y-6">
      
      {/* Breadcrumbs Navigation */}
      <div class="flex items-center flex-wrap gap-2 text-sm text-slate-400 font-medium bg-slate-900/40 p-4 rounded-xl border border-white/5 relative z-10">
        <button onClick={resetToUni} class="hover:text-white transition cursor-pointer">Universities</button>
        
        {selectedUni && (
          <>
            <ChevronRight size={14} className="text-slate-600" />
            <button onClick={resetToBranch} class="hover:text-white transition cursor-pointer text-slate-200">
              {selectedUni.name}
            </button>
          </>
        )}

        {selectedBranch && selectedBranch !== true && (
          <>
            <ChevronRight size={14} className="text-slate-600" />
            <button onClick={resetToSem} class="hover:text-white transition cursor-pointer text-slate-200">
              {selectedBranch.name}
            </button>
          </>
        )}

        {selectedSem && selectedSem !== true && (
          <>
            <ChevronRight size={14} className="text-slate-600" />
            <button onClick={resetToSubject} class="hover:text-white transition cursor-pointer text-slate-200">
              Semester {selectedSem}
            </button>
          </>
        )}

        {selectedSubject && selectedSubject !== true && (
          <>
            <ChevronRight size={14} className="text-slate-600" />
            <span class="text-blue-400 font-bold">{selectedSubject.name}</span>
          </>
        )}
      </div>

      {/* Floating Status Alerts */}
      {alertMsg.text && (
        <div class={`fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border text-sm shadow-xl ${
          alertMsg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {alertMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Primary Display Area */}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Directory Browsers */}
        <div class="lg:col-span-8 space-y-6">
          
          {/* Level 1: Select University */}
          {!selectedUni && (
            <div class="space-y-4">
              <h2 class="font-display text-2xl font-extrabold text-white">Select University</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {universities.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUni(u)}
                    class="glass-panel glass-panel-hover rounded-xl p-5 text-left border border-white/5 cursor-pointer flex flex-col justify-between h-28"
                  >
                    <Folder className="h-6 w-6 text-blue-500 mb-2" />
                    <div>
                      <span class="font-semibold text-white text-sm line-clamp-1">{u.name}</span>
                      <span class="text-xs text-slate-400 mt-1 block">{u.city}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Level 2: Select Branch */}
          {selectedUni && !selectedBranch && (
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <button onClick={resetToUni} class="p-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-400 hover:text-white cursor-pointer">
                  <ArrowLeft size={16} />
                </button>
                <h2 class="font-display text-2xl font-extrabold text-white">Select Branch</h2>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {branches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBranch(b)}
                    class="glass-panel glass-panel-hover rounded-xl p-4 text-left border border-white/5 cursor-pointer flex items-center gap-3"
                  >
                    <Folder className="h-5 w-5 text-purple-400 shrink-0" />
                    <span class="font-semibold text-white text-sm">{b.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Level 3: Select Semester */}
          {selectedUni && selectedBranch && !selectedSem && (
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <button onClick={resetToBranch} class="p-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-400 hover:text-white cursor-pointer">
                  <ArrowLeft size={16} />
                </button>
                <h2 class="font-display text-2xl font-extrabold text-white">Select Semester</h2>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <button
                    key={sem}
                    onClick={() => setSelectedSem(sem)}
                    class="glass-panel glass-panel-hover rounded-xl p-6 text-center border border-white/5 cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <span class="text-3xl font-extrabold text-indigo-400 font-display">{sem}</span>
                    <span class="text-xs text-slate-400 uppercase tracking-widest font-bold">Semester</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Level 4: Select Subject */}
          {selectedUni && selectedBranch && selectedSem && !selectedSubject && (
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <button onClick={resetToSem} class="p-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-400 hover:text-white cursor-pointer">
                  <ArrowLeft size={16} />
                </button>
                <h2 class="font-display text-2xl font-extrabold text-white">Select Subject</h2>
              </div>
              
              {subjects.length === 0 ? (
                <div class="glass-panel rounded-xl p-8 text-center text-slate-400">
                  No subjects registered for this semester yet.
                </div>
              ) : (
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {subjects.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubject(sub)}
                      class="glass-panel glass-panel-hover rounded-xl p-4 text-left border border-white/5 cursor-pointer flex items-center gap-3"
                    >
                      <FileText className="h-5 w-5 text-blue-400 shrink-0" />
                      <span class="font-semibold text-white text-sm">{sub.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Level 5: Notes Grid */}
          {selectedUni && selectedBranch && selectedSem && selectedSubject && (
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <button onClick={resetToSubject} class="p-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-400 hover:text-white cursor-pointer">
                    <ArrowLeft size={16} />
                  </button>
                  <h2 class="font-display text-2xl font-extrabold text-white">Available Notes</h2>
                </div>
              </div>

              {notes.length === 0 ? (
                <div class="glass-panel rounded-xl p-10 text-center text-slate-400">
                  No approved notes available for this subject. Be the first to upload!
                </div>
              ) : (
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => openNoteDetails(note)}
                      class={`glass-panel rounded-xl p-5 border cursor-pointer hover:border-blue-500/40 hover:bg-slate-900/50 transition duration-300 ${
                        activeNote?.id === note.id ? 'border-blue-500 bg-slate-900/60 shadow-lg' : 'border-white/5'
                      }`}
                    >
                      <div class="flex items-start justify-between gap-2">
                        <span class={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          note.noteType === 'SYLLABUS' 
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20' 
                            : note.noteType === 'QUESTION_PAPER'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/20'
                        }`}>
                          {note.noteType.replace('_', ' ')}
                        </span>
                        <div class="flex items-center gap-1">
                          <Download size={12} className="text-slate-400" />
                          <span class="text-xs text-slate-400 font-medium">{note.downloadCount}</span>
                        </div>
                      </div>

                      <h3 class="font-bold text-white text-base mt-3 line-clamp-1">{note.title}</h3>
                      <p class="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{note.description}</p>
                      
                      <div class="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                        <span class="text-[10px] text-slate-500 flex items-center gap-1">
                          <User size={10} />
                          <span>{note.uploadedBy?.fullName || note.uploadedBy?.username}</span>
                        </span>
                        
                        <div class="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookmarkToggle(note);
                            }}
                            class="p-1 rounded bg-slate-800/40 text-slate-400 hover:text-yellow-400 cursor-pointer"
                          >
                            <Bookmark size={13} className={bookmarkedIds.has(note.id) ? 'fill-yellow-400 text-yellow-400' : ''} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(note);
                            }}
                            class="p-1 rounded bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white cursor-pointer"
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Note Detailed Panel (Reviews & Ratings) */}
        <div class="lg:col-span-4">
          {activeNote ? (
            <div class="glass-panel border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl sticky top-24">
              
              {/* Header Details */}
              <div>
                <span class="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                  {activeNote.noteType.replace('_', ' ')}
                </span>
                <h2 class="font-display font-extrabold text-white text-xl mt-1 leading-snug">{activeNote.title}</h2>
                <p class="text-xs text-slate-400 mt-2 leading-relaxed">{activeNote.description}</p>
              </div>

              {/* Action Buttons */}
              <div class="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleDownload(activeNote)}
                  class="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg transition"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setShowPreviewModal(true)}
                  class="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer border border-white/5 transition"
                >
                  <Eye size={14} />
                  <span>Preview</span>
                </button>
              </div>

              {/* Meta information */}
              <div class="border-y border-white/5 py-4 space-y-2 text-xs text-slate-400">
                <div class="flex justify-between">
                  <span>File Type:</span>
                  <span class="text-white font-mono">{activeNote.fileType?.split('/')[1]?.toUpperCase() || 'PDF'}</span>
                </div>
                <div class="flex justify-between">
                  <span>Downloads:</span>
                  <span class="text-white font-bold">{activeNote.downloadCount}</span>
                </div>
                <div class="flex justify-between">
                  <span>Uploaded By:</span>
                  <span class="text-blue-400">{activeNote.uploadedBy?.fullName || activeNote.uploadedBy?.username}</span>
                </div>
                <div class="flex justify-between">
                  <span>Average Rating:</span>
                  <span class="flex items-center gap-1 text-yellow-400 font-bold">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    <span>{calculateAverageRating(reviews)} ({reviews.length})</span>
                  </span>
                </div>
              </div>

              {/* Toggle Bookmark & Report Flag */}
              <div class="flex gap-3">
                <button
                  onClick={() => handleBookmarkToggle(activeNote)}
                  class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-800 bg-slate-900/50 text-xs font-semibold text-slate-300 hover:text-yellow-400 hover:border-yellow-500/20 cursor-pointer transition"
                >
                  <Bookmark size={13} className={bookmarkedIds.has(activeNote.id) ? 'fill-yellow-400 text-yellow-400' : ''} />
                  <span>{bookmarkedIds.has(activeNote.id) ? 'Bookmarked' : 'Bookmark'}</span>
                </button>
                <button
                  onClick={() => setShowReportForm(!showReportForm)}
                  class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-rose-950/20 bg-rose-950/10 text-xs font-semibold text-rose-300 hover:bg-rose-950/20 cursor-pointer transition"
                >
                  <Flag size={13} />
                  <span>Report</span>
                </button>
              </div>

              {/* Report Input Form */}
              {showReportForm && (
                <form onSubmit={handleReportSubmit} class="bg-rose-950/10 border border-rose-500/20 rounded-xl p-3.5 space-y-3">
                  <span class="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Report note</span>
                  <textarea
                    required
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Describe issue (e.g. invalid document, copyright)..."
                    class="w-full text-xs bg-slate-950/80 rounded-lg border border-rose-500/20 p-2 text-white outline-none focus:border-rose-500"
                    rows={3}
                  />
                  <button
                    type="submit"
                    class="w-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold py-2 rounded-lg cursor-pointer transition"
                  >
                    Submit Complaint
                  </button>
                </form>
              )}

              {/* Reviews Panel */}
              <div class="space-y-4">
                <h3 class="font-display font-bold text-white text-sm flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-blue-400" />
                  <span>Reviews ({reviews.length})</span>
                </h3>

                {/* Review Submit Form */}
                <form onSubmit={handleReviewSubmit} class="space-y-2.5">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs text-slate-400">Rating:</span>
                    <div class="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          class="text-yellow-400 hover:scale-110 transition cursor-pointer"
                        >
                          <Star size={14} className={star <= reviewRating ? 'fill-yellow-400' : 'text-slate-600'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <input
                      type="text"
                      required
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Add a review..."
                      class="flex-1 text-xs bg-slate-900/60 rounded-xl border border-slate-700 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 rounded-xl cursor-pointer transition"
                    >
                      Post
                    </button>
                  </div>
                </form>

                {/* Reviews List */}
                <div class="max-h-56 overflow-y-auto space-y-3 pr-2">
                  {reviews.length === 0 ? (
                    <p class="text-xs text-slate-500 text-center py-2">No reviews yet. Be the first to leave one!</p>
                  ) : (
                    reviews.map((r) => (
                      <div key={r.id} class="bg-slate-900/40 p-2.5 rounded-lg border border-white/5 space-y-1">
                        <div class="flex items-center justify-between">
                          <span class="text-[10px] font-bold text-slate-300">
                            {r.user?.fullName || r.user?.username}
                          </span>
                          <div class="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={8} className={s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-700'} />
                            ))}
                          </div>
                        </div>
                        <p class="text-[11px] text-slate-400 leading-normal">{r.reviewText}</p>
                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div class="glass-panel border border-white/5 rounded-2xl p-6 text-center text-slate-500 h-64 flex items-center justify-center flex-col gap-2">
              <FileText size={32} className="text-slate-600 mb-1" />
              <p class="text-xs">Select any note file from the list to display details, star reviews, bookmarks, and downloads.</p>
            </div>
          )}
        </div>

      </div>

      {/* Glassmorphic Modal: PDF/Image Inline Preview */}
      {showPreviewModal && activeNote && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div class="w-full max-w-4xl h-[85vh] glass-panel rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div class="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/60">
              <div>
                <h3 class="font-display font-bold text-white text-base leading-none">{activeNote.title}</h3>
                <span class="text-[10px] text-slate-400 mt-1 block">Inline Sandbox Rendering</span>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg cursor-pointer transition border border-white/5"
              >
                Close
              </button>
            </div>

            {/* Modal Body: Embedded Preview */}
            <div class="flex-1 bg-slate-900 relative">
              {activeNote.fileType && activeNote.fileType.startsWith('image/') ? (
                <img
                  src={`${api.defaults.baseURL || ''}/api/notes/preview/${activeNote.id}`}
                  alt={activeNote.title}
                  class="w-full h-full object-contain"
                />
              ) : (
                <iframe
                  src={`${api.defaults.baseURL || ''}/api/notes/preview/${activeNote.id}`}
                  title={activeNote.title}
                  class="w-full h-full border-0"
                />
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
