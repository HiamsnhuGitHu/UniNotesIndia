import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, LogOut, LayoutDashboard, FileText, HelpCircle, ShieldAlert } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      isActive(path)
        ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/40 border border-transparent'
    }`;

  return (
    <nav class="sticky top-0 z-50 w-full border-b border-white/8 glass-panel py-3 px-6 shadow-lg shadow-slate-950/20 backdrop-blur-md">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" class="flex items-center gap-2 text-xl font-extrabold tracking-wide text-white font-display">
          <BookOpen className="h-6 w-6 text-blue-500" />
          <span>UniNotes <span class="bg-gradient-to-r from-orange-400 via-white to-green-400 bg-clip-text text-transparent">India</span></span>
        </Link>

        {/* Navigation links */}
        <div class="hidden md:flex items-center gap-3">
          <Link to="/" class={linkClass('/')}>
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>
          <Link to="/browse" class={linkClass('/browse')}>
            <FileText size={16} />
            <span>Browse Notes</span>
          </Link>
          <Link to="/requests" class={linkClass('/requests')}>
            <HelpCircle size={16} />
            <span>Requests</span>
          </Link>
          {(user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUBADMIN') && (
            <Link to="/admin" class={linkClass('/admin')}>
              <ShieldAlert size={16} />
              <span>Admin Panel</span>
            </Link>
          )}
        </div>

        {/* Profile and Logout */}
        <div class="flex items-center gap-4">
          <Link
            to="/profile"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/50 bg-slate-900/60 hover:border-slate-500 transition duration-300"
          >
            <User size={14} className="text-slate-400" />
            <span class="text-xs text-slate-300 font-medium font-sans max-w-[120px] truncate">
              {user?.fullName || user?.username}
            </span>
          </Link>
          <button
            onClick={logout}
            class="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/20 text-rose-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition duration-300"
          >
            <LogOut size={13} />
            <span class="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
