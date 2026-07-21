import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { BookOpen, User, LogOut, LayoutDashboard, FileText, HelpCircle, ShieldAlert, Menu, X, Bell, AlertCircle, Plus, Send, Trash2, Mail } from 'lucide-react';

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

  const [showCreateNotifModal, setShowCreateNotifModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [newNotifTitle, setNewNotifTitle] = useState('');
  const [newNotifMessage, setNewNotifMessage] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

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

  const handleCreateNotifSubmit = async (e) => {
    e.preventDefault();
    if (!newNotifTitle.trim() || !newNotifMessage.trim()) return;
    setSendingNotif(true);
    try {
      const res = await api.post('/api/admin/notifications', {
        title: newNotifTitle,
        message: newNotifMessage
      });
      // Add the new notification to the local list (at the top)
      setNotifications(prev => [res.data, ...prev]);
      setNewNotifTitle('');
      setNewNotifMessage('');
      setShowCreateNotifModal(false);
      // Automatically mark as read for the creator
      const updated = new Set(readIds);
      updated.add(res.data.id);
      setReadIds(updated);
      localStorage.setItem('read_notifications', JSON.stringify(Array.from(updated)));
    } catch (err) {
      console.error("Failed to create notification:", err);
    } finally {
      setSendingNotif(false);
    }
  };

  const handleDeleteNotif = async (id) => {
    if (!window.confirm('Delete this announcement permanently for all users?')) return;
    try {
      await api.delete(`/api/admin/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      const updated = new Set(readIds);
      updated.delete(id);
      setReadIds(updated);
      localStorage.setItem('read_notifications', JSON.stringify(Array.from(updated)));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
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
    <>
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
                      <div class="flex items-center gap-2">
                        {(user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUBADMIN') && (
                          <button
                            onClick={() => {
                              setShowCreateNotifModal(true);
                              setNotifDropdownOpen(false);
                            }}
                            class="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer flex items-center gap-0.5"
                          >
                            <Plus size={10} />
                            <span>Create</span>
                          </button>
                        )}
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            class="text-[10px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
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
                                <div class="flex items-center gap-1.5 shrink-0">
                                  {!isRead && (
                                    <span class="h-2 w-2 rounded-full bg-blue-500 mt-1"></span>
                                  )}
                                  {user?.role === 'ROLE_ADMIN' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteNotif(n.id);
                                      }}
                                      class="text-slate-500 hover:text-rose-400 p-0.5 rounded transition cursor-pointer"
                                      title="Delete Notification"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  )}
                                </div>
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
                  <button
                    onClick={() => {
                      setShowContactModal(true);
                      setProfileDropdownOpen(false);
                    }}
                    class="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition border-t border-white/5 cursor-pointer text-left outline-none"
                  >
                    <HelpCircle size={13} className="text-slate-400" />
                    <div class="flex flex-col text-left">
                      <span>Contact Admin</span>
                      <span class="text-[9px] text-slate-500 font-mono mt-0.5">uninotesindia@gmail.com</span>
                    </div>
                  </button>
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
      </nav>

      {/* Notification Reader Modal */}
      {activeNotifModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div class="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl relative overflow-hidden text-left font-sans">
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

      {/* Create Notification Modal (Admins / Sub-Admins only) */}
      {showCreateNotifModal && (user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUBADMIN') && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div class="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl relative overflow-hidden text-left font-sans">
            <h3 class="font-display font-extrabold text-white text-lg">Broadcast Announcement</h3>
            <p class="text-xs text-slate-400 leading-normal">
              Broadcasting an announcement will show it immediately for all students in their notification bells and dashboard sliders.
            </p>

            <form onSubmit={handleCreateNotifSubmit} class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Title</label>
                <input
                  type="text"
                  required
                  value={newNotifTitle}
                  onChange={e => setNewNotifTitle(e.target.value)}
                  placeholder="e.g. Server Maintenance: July 25th"
                  class="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Message Body</label>
                <textarea
                  required
                  value={newNotifMessage}
                  onChange={e => setNewNotifMessage(e.target.value)}
                  placeholder="Announce updates, upcoming exams, or registration alerts..."
                  class="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500"
                  rows={4}
                />
              </div>

              <div class="flex justify-end gap-2 pt-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setShowCreateNotifModal(false)}
                  class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer transition border border-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingNotif}
                  class="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer transition"
                >
                  {sendingNotif ? (
                    <div class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={12} />
                      <span>Broadcast</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Admin Support Modal */}
      {showContactModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div class="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl relative overflow-hidden text-left font-sans">
            <div class="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

            <div class="flex items-center gap-3 relative z-10">
              <div class="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <HelpCircle className="h-5 w-5" />
              </div>
              <h3 class="font-display font-extrabold text-white text-lg">Contact Admin</h3>
            </div>

            <p class="text-xs text-slate-400 leading-normal relative z-10">
              To request content removal, report issues, or resolve account errors, please send an email directly to the platform administrator:
            </p>

            <div class="flex items-center gap-3 bg-slate-900/40 p-4 rounded-xl border border-white/5 relative z-10">
              <Mail className="h-4 w-4 text-blue-400 shrink-0" />
              <div>
                <p class="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Support Email Address</p>
                <a href="mailto:uninotesindia@gmail.com" class="text-xs font-bold text-white hover:text-blue-400 transition mt-0.5 block">
                  uninotesindia@gmail.com
                </a>
              </div>
            </div>

            <div class="flex justify-end pt-2 relative z-10">
              <button
                onClick={() => setShowContactModal(false)}
                class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-xl cursor-pointer transition border border-white/5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
