import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UploadCloud, File, Trash, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function UploadForm() {
  const navigate = useNavigate();

  // Reference lists
  const [universities, setUniversities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uniId, setUniId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [semester, setSemester] = useState(1);
  const [subjectId, setSubjectId] = useState('');
  const [noteType, setNoteType] = useState('NOTE');

  // File states
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  // Status indicators
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', text: '' });
  const [uploadSuccess, setUploadSuccess] = useState(false);

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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (selectedFile.size > maxSize) {
      showAlert('error', 'File size exceeds the 50MB maximum limit. Please upload a smaller file.');
      return;
    }
    setFile(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !uniId || !branchId || !subjectId || !file) {
      showAlert('error', 'Please fill in all fields and choose a valid file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
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
      showAlert('error', 'Failed to upload document. Please verify parameters.');
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
                : file 
                  ? 'border-emerald-500/40 bg-emerald-500/5' 
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-600'
            }`}
            onClick={() => !file && fileInputRef.current.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              class="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
            />

            {!file ? (
              <div class="space-y-2">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <UploadCloud size={24} />
                </div>
                <div class="text-xs text-slate-300 font-semibold">
                  Drag and drop files here, or <span class="text-blue-400 hover:underline">browse files</span>
                </div>
                <p class="text-[10px] text-slate-500 leading-normal">
                  Supports PDF, Word Documents, text notes, and images (Max 50MB)
                </p>
              </div>
            ) : (
              <div class="flex items-center justify-between bg-slate-950/60 p-4 rounded-xl border border-white/5">
                <div class="flex items-center gap-3">
                  <File className="h-8 w-8 text-emerald-400 shrink-0" />
                  <div class="text-left">
                    <p class="text-xs font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                    <p class="text-[10px] text-slate-500 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  class="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/40 hover:bg-rose-500/10 rounded-lg cursor-pointer transition"
                >
                  <Trash size={14} />
                </button>
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
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Subject Mapping</label>
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

    </div>
  );
}
