import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Folder, ArrowLeft, Star, Download, Bookmark, Flag, Eye, Trash,
  ChevronRight, Calendar, User, FileText, CheckCircle2, MessageSquare, AlertCircle, Upload, Plus
} from 'lucide-react';

export default function NotesNavigator() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleUploadNotesRedirect = () => {
    navigate('/upload', {
      state: {
        universityId: selectedUni?.id,
        branchId: selectedBranch?.id,
        semester: selectedSem,
        subjectId: selectedSubject?.id
      }
    });
  };

  // Navigation levels
  const [universities, setUniversities] = useState(() => {
    const saved = sessionStorage.getItem('cached_universities');
    return saved ? JSON.parse(saved) : [];
  });
  const [branches, setBranches] = useState(() => {
    const saved = sessionStorage.getItem('cached_branches');
    return saved ? JSON.parse(saved) : [];
  });
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);

  // Selections (synced with sessionStorage to survive browser refresh)
  const [selectedUni, setSelectedUni] = useState(() => {
    const saved = sessionStorage.getItem('selectedUni');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedBranch, setSelectedBranch] = useState(() => {
    const saved = sessionStorage.getItem('selectedBranch');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedSem, setSelectedSem] = useState(() => {
    const saved = sessionStorage.getItem('selectedSem');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedSubject, setSelectedSubject] = useState(() => {
    const saved = sessionStorage.getItem('selectedSubject');
    return saved ? JSON.parse(saved) : null;
  });
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
  const [previewError, setPreviewError] = useState(null);
  const [checkingPreview, setCheckingPreview] = useState(false);

  // Status message alerts
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Add Subject states
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [subjectAdding, setSubjectAdding] = useState(false);

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        let loadedUnis = universities;
        let loadedBranches = branches;

        // Fetch universities and branches only if not cached
        if (loadedUnis.length === 0 || loadedBranches.length === 0) {
          const [uniRes, branchRes] = await Promise.all([
            api.get('/api/universities'),
            api.get('/api/branches')
          ]);
          loadedUnis = uniRes.data;
          loadedBranches = branchRes.data;
          setUniversities(loadedUnis);
          setBranches(loadedBranches);
          sessionStorage.setItem('cached_universities', JSON.stringify(loadedUnis));
          sessionStorage.setItem('cached_branches', JSON.stringify(loadedBranches));
        }

        // Fetch bookmarks only if user is logged in
        if (user) {
          try {
            const bmarkRes = await api.get('/api/notes/bookmarks');
            setBookmarkedIds(new Set(bmarkRes.data.map(b => b.note.id)));
          } catch (bmarkErr) {
            console.error('Failed to load bookmarks', bmarkErr);
          }
        }

        // Handle parameters passed from Dashboard search
        if (location.state) {
          const { universityId, query } = location.state;
          if (universityId) {
            const matchedUni = loadedUnis.find(u => u.id === Number(universityId));
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
  }, [location, user]);

  // Verify preview is available on mount/open
  useEffect(() => {
    if (showPreviewModal && activeNote) {
      const checkPreview = async () => {
        setCheckingPreview(true);
        setPreviewError(null);
        try {
          await api.head(`/api/notes/preview/${activeNote.id}`);
        } catch (err) {
          console.error("Preview check failed:", err);
          let errorMsg = "The requested note file was not found on the server's storage. It may have been deleted or the server restarted.";
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
  }, [showPreviewModal, activeNote]);

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
      const cacheKey = `subjects_${selectedBranch.id}_${selectedSem}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setSubjects(JSON.parse(cached));
      } else {
        api.get(`/api/subjects/branch/${selectedBranch.id}/semester/${selectedSem}`)
          .then(res => {
            setSubjects(res.data);
            sessionStorage.setItem(cacheKey, JSON.stringify(res.data));
          })
          .catch(err => console.error(err));
      }
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
  const openNoteDetails = (note) => {
    setActiveNote(note);
    setReviewText('');
    setReviewRating(5);
    setReportReason('');
    setShowReportForm(false);
  };

  // Synchronize selections with sessionStorage to survive refresh
  useEffect(() => {
    if (selectedUni) sessionStorage.setItem('selectedUni', JSON.stringify(selectedUni));
    else sessionStorage.removeItem('selectedUni');
  }, [selectedUni]);

  useEffect(() => {
    if (selectedBranch) sessionStorage.setItem('selectedBranch', JSON.stringify(selectedBranch));
    else sessionStorage.removeItem('selectedBranch');
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedSem) sessionStorage.setItem('selectedSem', JSON.stringify(selectedSem));
    else sessionStorage.removeItem('selectedSem');
  }, [selectedSem]);

  useEffect(() => {
    if (selectedSubject) sessionStorage.setItem('selectedSubject', JSON.stringify(selectedSubject));
    else sessionStorage.removeItem('selectedSubject');
  }, [selectedSubject]);

  // Clear active note selection when navigation/selection changes
  useEffect(() => {
    setActiveNote(null);
  }, [selectedUni, selectedBranch, selectedSem, selectedSubject]);

  // Fetch reviews whenever activeNote changes (handles both user click and session recovery)
  useEffect(() => {
    if (activeNote) {
      api.get(`/api/notes/${activeNote.id}/reviews`)
        .then(res => setReviews(res.data))
        .catch(err => console.error(err));
    } else {
      setReviews([]);
    }
  }, [activeNote]);

  const handleDownload = (note) => {
    // Open in new tab or trigger download direct stream
    const baseUrl = import.meta.env.VITE_API_URL || '';
    window.open(`${baseUrl}/api/notes/download/${note.id}`, '_blank');
    // Increment local download count visual
    setActiveNote(prev => prev ? { ...prev, downloadCount: prev.downloadCount + 1 } : null);
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to permanently delete this note and its associated file?')) return;
    try {
      await api.delete(`/api/admin/notes/${noteId}`);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      setActiveNote(null);
      showAlert('success', 'Note deleted successfully by admin.');
    } catch (err) {
      console.error(err);
      showAlert('error', 'Failed to delete note.');
    }
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

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !selectedBranch) return;

    setSubjectAdding(true);
    try {
      const response = await api.post('/api/subjects', {
        name: newSubjectName.trim(),
        branch: selectedBranch,
        semester: Number(selectedSem)
      });

      const newSub = response.data;
      setSubjects(prev => [...prev, newSub]);
      setNewSubjectName('');
      setShowSubjectModal(false);
      
      // Auto-select the newly added subject so the notes view opens!
      setSelectedSubject(newSub);
      
      showAlert('success', `Subject "${newSub.name}" added successfully.`);
    } catch (err) {
      showAlert('error', 'Failed to add subject.');
    } finally {
      setSubjectAdding(false);
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
        <div class={`fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border text-sm shadow-xl ${alertMsg.type === 'success'
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
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <button onClick={resetToSem} class="p-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-400 hover:text-white cursor-pointer">
                    <ArrowLeft size={16} />
                  </button>
                  <h2 class="font-display text-2xl font-extrabold text-white">Select Subject</h2>
                </div>
                <button
                  onClick={() => setShowSubjectModal(true)}
                  class="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow shadow-blue-500/20"
                >
                  <Plus size={14} />
                  <span>Add New Subject</span>
                </button>
              </div>

              {subjects.length === 0 ? (
                <div class="glass-panel rounded-xl p-8 text-center text-slate-400 space-y-4 flex flex-col items-center justify-center">
                  <p>No subjects registered for this semester yet.</p>
                  <button
                    onClick={() => setShowSubjectModal(true)}
                    class="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow shadow-blue-500/20"
                  >
                    <Plus size={14} />
                    <span>Add New Subject</span>
                  </button>
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
                <button
                  onClick={handleUploadNotesRedirect}
                  class="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow shadow-blue-500/20"
                >
                  <Upload size={14} />
                  <span>Upload Notes</span>
                </button>
              </div>

              {notes.length === 0 ? (
                <div class="glass-panel rounded-xl p-10 text-center text-slate-400 space-y-4 flex flex-col items-center justify-center">
                  <p>No approved notes available for this subject. Be the first to upload!</p>
                  <button
                    onClick={handleUploadNotesRedirect}
                    class="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow shadow-blue-500/20"
                  >
                    <Upload size={14} />
                    <span>Upload Notes</span>
                  </button>
                </div>
              ) : (
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => openNoteDetails(note)}
                      class={`glass-panel rounded-xl p-5 border cursor-pointer hover:border-blue-500/40 hover:bg-slate-900/50 transition duration-300 ${activeNote?.id === note.id ? 'border-blue-500 bg-slate-900/60 shadow-lg' : 'border-white/5'
                        }`}
                    >
                      <div class="flex items-start justify-between gap-2">
                        <span class={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${note.noteType === 'SYLLABUS'
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

              {/* Admin Deletion Action */}
              {(user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUBADMIN') && (
                <button
                  onClick={() => handleDeleteNote(activeNote.id)}
                  class="w-full flex items-center justify-center gap-1.5 py-3 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition border border-rose-500/20 hover:border-rose-500"
                >
                  <Trash size={13} />
                  <span>Delete Note (Admin)</span>
                </button>
              )}

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
              {checkingPreview ? (
                <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span class="text-xs font-semibold">Verifying document preview availability...</span>
                </div>
              ) : previewError ? (
                <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl">
                    <AlertCircle size={32} />
                  </div>
                  <div class="max-w-md space-y-1.5">
                    <h4 class="font-display font-bold text-white text-base">Preview Unsuccessful</h4>
                    <p class="text-xs text-slate-400 leading-relaxed">
                      {previewError}
                    </p>
                  </div>
                </div>
              ) : (
                activeNote.fileType && activeNote.fileType.startsWith('image/') ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL || ''}/api/notes/preview/${activeNote.id}`}
                    alt={activeNote.title}
                    class="w-full h-full object-contain"
                  />
                ) : (
                  <iframe
                    src={`${import.meta.env.VITE_API_URL || ''}/api/notes/preview/${activeNote.id}`}
                    title={activeNote.title}
                    class="w-full h-full border-0"
                  />
                )
              )}
            </div>

          </div>
        </div>
      )}

      {/* Add Subject Modal Popup */}
      {showSubjectModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div class="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl relative overflow-hidden">
            <h3 class="font-display font-extrabold text-white text-lg">Add New Subject</h3>
            <p class="text-xs text-slate-400">
              Create a new subject mapping for <span class="text-blue-400 font-semibold">{selectedBranch?.name}</span> (Semester {selectedSem}).
            </p>
            
            <form onSubmit={handleAddSubject} class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Theory of Computation"
                  class="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div class="flex justify-end gap-2 pt-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubjectModal(false);
                    setNewSubjectName('');
                  }}
                  class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subjectAdding || !newSubjectName.trim()}
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {subjectAdding ? 'Adding...' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
