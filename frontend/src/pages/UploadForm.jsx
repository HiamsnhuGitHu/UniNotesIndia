import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { UploadCloud, File, Trash, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function UploadForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const isPreFilled = !!(location.state?.universityId && location.state?.branchId && location.state?.semester && location.state?.subjectId);

  // Reference lists
  const [universities, setUniversities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uniId, setUniId] = useState(location.state?.universityId ? String(location.state.universityId) : '');
  const [branchId, setBranchId] = useState(location.state?.branchId ? String(location.state.branchId) : '');
  const [semester, setSemester] = useState(location.state?.semester ? Number(location.state.semester) : 1);
  const [subjectId, setSubjectId] = useState(location.state?.subjectId ? String(location.state.subjectId) : '');
  const [noteType, setNoteType] = useState('NOTE');

  // File states
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  // Status indicators
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', text: '' });
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Add Subject states
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [subjectAdding, setSubjectAdding] = useState(false);

  // Fetch initial select lists
  useEffect(() => {
    api.get('/api/universities').then(res => setUniversities(res.data));
    api.get('/api/branches').then(res => setBranches(res.data));
  }, []);

  // Sync subjects dynamically
  useEffect(() => {
    if (branchId && semester) {
      api.get(`/api/subjects/branch/${branchId}/semester/${semester}`)
        .then(res => setSubjects(res.data))
        .catch(err => console.error(err));
    } else {
      setSubjects([]);
    }
  }, [branchId, semester]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(Array.from(e.target.files));
    }
  };

  const validateAndAddFiles = (selectedFiles) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const validFiles = [];
    
    for (const f of selectedFiles) {
      if (f.size > maxSize) {
        showAlert('error', `File "${f.name}" exceeds the 50MB maximum limit and was skipped.`);
        continue;
      }
      validFiles.push(f);
    }
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (files.length <= 1 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !branchId) return;

    setSubjectAdding(true);
    try {
      const selectedBranch = branches.find(b => b.id === Number(branchId));
      const response = await api.post('/api/subjects', {
        name: newSubjectName.trim(),
        branch: selectedBranch,
        semester: Number(semester)
      });

      const newSub = response.data;
      setSubjects(prev => [...prev, newSub]);
      setSubjectId(newSub.id);
      setNewSubjectName('');
      setShowSubjectModal(false);
      showAlert('success', `Subject "${newSub.name}" added successfully.`);
    } catch (err) {
      showAlert('error', 'Failed to add subject.');
    } finally {
      setSubjectAdding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !uniId || !branchId || !subjectId || files.length === 0) {
      showAlert('error', 'Please fill in all fields and choose at least one valid file.');
      return;
    }

    const formData = new FormData();
    files.forEach(f => {
      formData.append('file', f);
    });
    formData.append('title', title);
    formData.append('description', description);
    formData.append('universityId', uniId);
    formData.append('branchId', branchId);
    formData.append('semester', semester);
    formData.append('subjectId', subjectId);
    formData.append('noteType', noteType);

    setLoading(true);
    try {
      await api.post('/api/notes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSuccess(true);
      showAlert('success', 'Upload complete!');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to upload document. Please verify parameters.';
      showAlert('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, text) => {
    setAlert({ type, text });
    if (type !== 'success') {
      setTimeout(() => setAlert({ type: '', text: '' }), 5000);
    }
  };

  return (
    <div class="max-w-3xl mx-auto space-y-6">
      
      <div>
        <h1 class="font-display text-2xl font-extrabold text-white">Upload Study Materials</h1>
        <p class="text-xs text-slate-400 mt-1">Submit your classroom notes, syllabi, or question papers to build the community pool.</p>
        {isPreFilled && (
          <div class="mt-3 flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/40 px-3 py-2.5 rounded-xl border border-white/5 w-fit">
            <span class="font-semibold text-slate-300">Target Folder:</span>
            <span class="text-blue-400 font-medium">
              {universities.find(u => String(u.id) === uniId)?.name || 'University'} • {branches.find(b => String(b.id) === branchId)?.name || 'Branch'} • Semester {semester} • {subjects.find(s => String(s.id) === subjectId)?.name || 'Subject'}
            </span>
          </div>
        )}
      </div>

      {alert.text && !uploadSuccess && (
        <div class={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs leading-relaxed ${
          alert.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {alert.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertTriangle size={18} className="shrink-0" />}
          <span>{alert.text}</span>
        </div>
      )}

      {uploadSuccess ? (
        <div class="glass-panel border border-emerald-500/20 bg-emerald-500/5 rounded-3xl p-8 text-center space-y-5 shadow-xl">
          <div class="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={28} />
          </div>
          <div class="space-y-2">
            <h2 class="font-display font-extrabold text-white text-xl">Material Uploaded!</h2>
            <p class="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Your note has been submitted successfully. If you are a student, it is currently in the queue for moderator approval. Admin uploads are auto-approved instantly.
            </p>
          </div>
          <button
            onClick={() => navigate('/browse')}
            class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-xl text-xs cursor-pointer shadow"
          >
            <span>Go to Navigator</span>
            <ArrowRight size={13} />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} class="glass-panel border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
          
          {/* Drag & Drop File Container */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            class={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 relative ${
              dragActive 
                ? 'border-blue-500 bg-blue-500/5' 
                : files.length > 0
                  ? 'border-emerald-500/40 bg-emerald-500/5' 
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-600'
            }`}
            onClick={() => files.length === 0 && fileInputRef.current.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              class="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
              multiple
            />

            {files.length === 0 ? (
              <div class="space-y-2">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <UploadCloud size={24} />
                </div>
                <div class="text-xs text-slate-300 font-semibold">
                  Drag and drop files here, or <span class="text-blue-400 hover:underline">browse files</span>
                </div>
                <p class="text-[10px] text-slate-500 leading-normal">
                  Supports PDF, Word Documents, text notes, and images (Max 50MB per file)
                </p>
              </div>
            ) : (
              <div class="space-y-3" onClick={(e) => e.stopPropagation()}>
                <div class="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                  <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">{files.length} {files.length === 1 ? 'file' : 'files'} selected</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    class="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    + Add More Files
                  </button>
                </div>
                <div class="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {files.map((f, idx) => (
                    <div key={idx} class="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-white/5">
                      <div class="flex items-center gap-3 min-w-0">
                        <File className="h-6 w-6 text-emerald-400 shrink-0" />
                        <div class="text-left min-w-0">
                          <p class="text-xs font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-md">{f.name}</p>
                          <p class="text-[10px] text-slate-500 mt-0.5">{(f.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        class="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/40 hover:bg-rose-500/10 rounded-lg cursor-pointer transition"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Parameters */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Title */}
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Note Title / Subject Topic</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unit 3 Operating Systems Process Sync notes"
                class="w-full text-xs bg-slate-900/60 rounded-xl border border-slate-700 px-3 py-2.5 text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Short Description / Chapter notes</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this file contains..."
                class="w-full text-xs bg-slate-900/60 rounded-xl border border-slate-700 p-3 text-white outline-none focus:border-blue-500"
                rows={3}
              />
            </div>

            {/* Note Type */}
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Resource Category</label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                class="w-full text-xs bg-slate-900/60 rounded-xl border border-slate-700 p-2.5 text-white outline-none"
              >
                <option value="NOTE">Classroom Notes</option>
                <option value="SYLLABUS">Syllabus Sheet</option>
                <option value="QUESTION_PAPER">Previous Year Paper</option>
              </select>
            </div>

            {!isPreFilled && (
              <>
                {/* University */}
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

                {/* Branch */}
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

                {/* Semester */}
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

                {/* Subject */}
                <div class="sm:col-span-2">
                  <div class="flex items-center justify-between mb-1.5">
                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Subject Mapping</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!branchId) {
                          showAlert('error', 'Please select a branch first before adding a subject.');
                          return;
                        }
                        setShowSubjectModal(true);
                      }}
                      class="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      + Add New Subject
                    </button>
                  </div>
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
              </>
            )}

          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            class="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow shadow-blue-500/10"
          >
            {loading ? (
              <div class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
            ) : (
              <span>Submit Resource</span>
            )}
          </button>

        </form>
      )}

      {/* Add Subject Modal Popup */}
      {showSubjectModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div class="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl relative overflow-hidden">
            <h3 class="font-display font-extrabold text-white text-lg">Add New Subject</h3>
            <p class="text-xs text-slate-400">
              Create a new subject mapping for <span class="text-blue-400 font-semibold">{branches.find(b => b.id === Number(branchId))?.name}</span> (Semester {semester}).
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
