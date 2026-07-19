import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { ShieldAlert, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, newPassword });
      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to reset password. Token may be invalid or expired.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        
        <div class="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div class="text-center relative z-10">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-600/20 text-blue-400 mb-4 border border-blue-500/30">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 class="font-display text-3xl font-extrabold text-white">
            Reset Password
          </h2>
          <p class="mt-2 text-sm text-slate-400">
            Enter the recovery token and choose a new password
          </p>
        </div>

        {error && (
          <div class="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-lg flex items-center gap-3 text-sm relative z-10">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-lg flex items-center gap-3 text-sm relative z-10">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form class="mt-6 space-y-6 relative z-10" onSubmit={handleSubmit}>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Reset Token (UUID)
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                class="block w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 font-mono"
                placeholder="Paste token from backend console"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                class="block w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              class="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 shadow-lg"
            >
              {loading ? (
                <div class="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Update Password</span>
              )}
            </button>

            <Link
              to="/login"
              class="flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition duration-300 mt-2"
            >
              <ArrowLeft size={14} />
              <span>Back to Login</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
