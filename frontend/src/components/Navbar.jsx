import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { BookOpen, User, LogOut, LayoutDashboard, FileText, HelpCircle, ShieldAlert, Menu, X, Bell, AlertCircle } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [activeNotifModal, setActiveNotifModal] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    const saved = localStorage.getItem('read_notifications');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/api/notifications')
        .then(res => {
          const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setNotifications(sorted);
        })
        .catch(err => console.error("Failed to fetch notifications:", err));
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated]);

  const markAsRead = (id) => {
    const updated = new Set(readIds);
    updated.add(id);
    setReadIds(updated);
    localStorage.setItem('read_notifications', JSON.stringify(Array.from(updated)));
  };

  const markAllAsRead = () => {
    const updated = new Set(readIds);
    notifications.forEach(n => updated.add(n.id));
    setReadIds(updated);
    localStorage.setItem('read_notifications', JSON.stringify(Array.from(updated)));
  };

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  if (!isAuthenticated) return null;

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      isActive(path)
        ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/40 border border-transparent'
    }`;

  const mobileLinkClass = (path) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition duration-300 ${
      isActive(path)
        ? 'bg-blue-600/25 text-blue-400 border border-blue-500/25'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
    }`;

  return (
    <nav class="sticky top-0 z-50 w-full border-b border-white/8 glass-panel py-3 px-6 shadow-lg shadow-slate-950/20 backdrop-blur-md">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" class="flex items-center gap-2 text-xl font-extrabold tracking-wide text-white font-display">
          <BookOpen className="h-6 w-6 text-blue-500" />
          <span>UniNotes <span class="bg-gradient-to-r from-orange-400 via-white to-green-400 bg-clip-text text-transparent">India</span></span>
        </Link>

        {/* Navigation links (Desktop only) */}
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

        {/* Profile, Logout & Hamburger Toggle */}
        <div class="flex items-center gap-2 sm:gap-4 relative">
          
          {/* Notification Bell Icon */}
          {isAuthenticated && (
            <div class="relative">
              <button
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setProfileDropdownOpen(false);
                }}
                class="relative p-2 text-slate-400 hover:text-white bg-slate-900/60 border border-slate-700/50 rounded-lg hover:border-slate-500 transition duration-300 cursor-pointer outline-none flex items-center justify-center"
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown popup */}
              {notifDropdownOpen && (
                <div class="absolute right-0 mt-2 w-80 bg-slate-950/95 border border-white/10 rounded-xl shadow-xl py-2 z-50 backdrop-blur-md max-h-96 overflow-y-auto flex flex-col">
                  <div class="flex items-center justify-between px-4 py-1.5 border-b border-white/5">
                    <span class="text-xs font-bold text-white font-display">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        class="text-[10px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div class="divide-y divide-white/5 overflow-y-auto max-h-72">
                    {notifications.length === 0 ? (
                      <div class="text-center text-xs text-slate-500 py-6">No notifications yet.</div>
                    ) : (
                      notifications.map(n => {
                        const isRead = readIds.has(n.id);
                        return (
                          <div
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              setActiveNotifModal(n);
                              setNotifDropdownOpen(false);
                            }}
                            class={`px-4 py-3 cursor-pointer transition text-left space-y-1 ${
                              isRead ? 'hover:bg-slate-900/40' : 'bg-blue-600/5 hover:bg-blue-600/10'
                            }`}
                          >
                            <div class="flex items-start justify-between gap-2">
                              <span class={`text-xs font-bold leading-tight block ${isRead ? 'text-slate-300' : 'text-white'}`}>
                                {n.title}
                              </span>
                              {!isRead && (
                                <span class="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1"></span>
                              )}
                            </div>
                            <p class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                            <span class="text-[9px] text-slate-500 block">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Profile Dropdown Toggle Button */}
          <div class="relative">
            <button
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setNotifDropdownOpen(false);
              }}
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/50 bg-slate-900/60 hover:border-slate-500 transition duration-300 cursor-pointer outline-none"
            >
              <User size={14} className="text-slate-400" />
              <span class="text-xs text-slate-300 font-medium font-sans max-w-[80px] sm:max-w-[120px] truncate">
                {user?.fullName || user?.username}
              </span>
            </button>

            {/* Profile Dropdown Menu popup */}
            {profileDropdownOpen && (
              <div class="absolute right-0 mt-2 w-48 bg-slate-950/95 border border-white/10 rounded-xl shadow-xl py-1 z-50 backdrop-blur-md">
                <Link
                  to="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  class="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition"
                >
                  <User size={13} className="text-slate-400" />
                  <span>My Profile</span>
                </Link>
                <a
                  href="mailto:uninotesindia@gmail.com"
                  onClick={() => setProfileDropdownOpen(false)}
                  class="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition border-t border-white/5"
                >
                  <HelpCircle size={13} className="text-slate-400" />
                  <div class="flex flex-col text-left">
                    <span>Contact Admin</span>
                    <span class="text-[9px] text-slate-500 font-mono mt-0.5">uninotesindia@gmail.com</span>
                  </div>
                </a>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            class="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/20 text-rose-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition duration-300"
          >
            <LogOut size={13} />
            <span class="hidden sm:inline">Logout</span>
          </button>
          
          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            class="flex md:hidden items-center justify-center p-2 text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 rounded-lg cursor-pointer transition duration-300"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Drawer */}
      {mobileMenuOpen && (
        <div class="md:hidden mt-3 pt-3 border-t border-white/5 space-y-2 flex flex-col transition-all duration-300">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} class={mobileLinkClass('/')}>
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>
          <Link to="/browse" onClick={() => setMobileMenuOpen(false)} class={mobileLinkClass('/browse')}>
            <FileText size={16} />
            <span>Browse Notes</span>
          </Link>
          <Link to="/requests" onClick={() => setMobileMenuOpen(false)} class={mobileLinkClass('/requests')}>
            <HelpCircle size={16} />
            <span>Requests</span>
          </Link>
          {(user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUBADMIN') && (
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)} class={mobileLinkClass('/admin')}>
              <ShieldAlert size={16} />
              <span>Admin Panel</span>
            </Link>
          )}
        </div>
      )}

      {/* Notification Reader Modal */}
      {activeNotifModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div class="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl relative overflow-hidden text-left">
            <h3 class="font-display font-extrabold text-white text-lg">{activeNotifModal.title}</h3>
            <p class="text-xs text-slate-400 leading-normal whitespace-pre-wrap">{activeNotifModal.message}</p>
            <div class="flex justify-between items-center pt-2">
              <span class="text-[10px] text-slate-500">{new Date(activeNotifModal.createdAt).toLocaleString()}</span>
              <button
                onClick={() => setActiveNotifModal(null)}
                class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-xl cursor-pointer transition border border-white/5"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
