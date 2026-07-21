import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Search, BookOpen, Upload, HelpCircle, GraduationCap, MessageSquare, BookOpenText } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUni, setSelectedUni] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    universities: 0,
    notes: 0,
    downloads: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const uniRes = await api.get('/api/universities');
        setUniversities(uniRes.data);
        
        setStats({
          universities: uniRes.data.length,
          notes: 124, // Mock total notes count
          downloads: 489, // Mock total download counts
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate('/browse', { state: { universityId: selectedUni, query: searchQuery } });
  };

  return (
    <div class="space-y-10">
      
      {/* Hero Section with Glass Search Box */}
      <div class="relative rounded-3xl overflow-hidden py-16 px-6 sm:px-12 text-center glass-panel shadow-xl border border-white/10">
        <div class="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>

        <div class="max-w-3xl mx-auto space-y-6 relative z-10">
          <h1 class="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Simplify Your Studies with <br />
            <span class="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">UniNotes India</span>
          </h1>
          <p class="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Free community-driven platform to share and access study notes, previous question papers, and syllabi from engineering universities across India.
          </p>

          {/* Glass Search Bar */}
          <form onSubmit={handleSearchSubmit} class="mt-8 grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-950/60 p-2.5 rounded-2xl border border-white/5 shadow-2xl">
            <div class="sm:col-span-4 flex items-center bg-slate-900/50 rounded-xl px-3 border border-white/5">
              <GraduationCap className="h-5 w-5 text-slate-400 shrink-0 mr-2" />
              <select
                value={selectedUni}
                onChange={(e) => setSelectedUni(e.target.value)}
                class="w-full bg-transparent text-slate-300 py-3 text-sm border-0 outline-none cursor-pointer"
              >
                <option value="" class="bg-slate-950 text-slate-300">All Universities</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id} class="bg-slate-950 text-slate-300">
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div class="sm:col-span-5 flex items-center bg-slate-900/50 rounded-xl px-3 border border-white/5">
              <Search className="h-5 w-5 text-slate-400 shrink-0 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subjects, topics, or notes..."
                class="w-full bg-transparent text-slate-200 py-3 text-sm border-0 outline-none placeholder-slate-500"
              />
            </div>

            <div class="sm:col-span-3">
              <button
                type="submit"
                class="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-sm font-semibold cursor-pointer shadow-lg shadow-blue-500/20 transition-all duration-300"
              >
                Search Notes
              </button>
            </div>
          </form>
        </div>
      </div>


      {/* Quick Action Navigation Grid */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Upload Notes Card */}
        <Link to="/upload" class="glass-panel glass-panel-hover rounded-2xl p-6 flex items-start gap-4 shadow-lg group">
          <div class="p-3.5 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/25 transition duration-300 group-hover:bg-blue-600 group-hover:text-white">
            <Upload size={22} />
          </div>
          <div>
            <h3 class="font-display font-bold text-white text-lg">Upload Notes</h3>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed">
              Help your peers by uploading class notes, syllabi, or question papers.
            </p>
          </div>
        </Link>

        {/* Browse Notes Card */}
        <Link to="/browse" class="glass-panel glass-panel-hover rounded-2xl p-6 flex items-start gap-4 shadow-lg group">
          <div class="p-3.5 bg-purple-600/10 text-purple-400 rounded-xl border border-purple-500/25 transition duration-300 group-hover:bg-purple-600 group-hover:text-white">
            <BookOpenText size={22} />
          </div>
          <div>
            <h3 class="font-display font-bold text-white text-lg">Browse Directory</h3>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed">
              Navigate notes structured by University, branch, semester, and subjects.
            </p>
          </div>
        </Link>

        {/* Requested Notes Card */}
        <Link to="/requests" class="glass-panel glass-panel-hover rounded-2xl p-6 flex items-start gap-4 shadow-lg group">
          <div class="p-3.5 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-500/25 transition duration-300 group-hover:bg-indigo-600 group-hover:text-white">
            <HelpCircle size={22} />
          </div>
          <div>
            <h3 class="font-display font-bold text-white text-lg">Requested Notes</h3>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed">
              Can't find your notes? Post a request or view what others are looking for.
            </p>
          </div>
        </Link>

      </div>

      {/* Quick Stats Panel */}
      <div class="glass-panel border border-white/10 rounded-3xl p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center shadow-lg relative overflow-hidden">
        <div class="absolute inset-0 bg-radial-grid pointer-events-none"></div>
        
        <div>
          <div class="text-3xl font-extrabold text-blue-400 font-display">{stats.universities}</div>
          <div class="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1.5">Jaipur Universities</div>
        </div>
        <div class="border-y sm:border-y-0 sm:border-x border-white/5 py-4 sm:py-0">
          <div class="text-3xl font-extrabold text-purple-400 font-display">{stats.notes}+</div>
          <div class="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1.5">Syllabi & Notes</div>
        </div>
        <div>
          <div class="text-3xl font-extrabold text-indigo-400 font-display">{stats.downloads}+</div>
          <div class="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1.5">File Downloads</div>
        </div>
      </div>

    </div>
  );
}
