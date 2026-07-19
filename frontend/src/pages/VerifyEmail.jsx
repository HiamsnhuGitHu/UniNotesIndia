import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Mail, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => (location.state && location.state.email) || '');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await api.post('/api/auth/verify-email', { email, token });
      setMessage('Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Verification failed. Please check the code.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        
        {/* Glow Effects */}
        <div class="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div class="text-center relative z-10">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-600/20 text-blue-400 mb-4 border border-blue-500/30">
            <Mail className="h-6 w-6" />
          </div>
          <h2 class="font-display text-3xl font-extrabold text-white">
            Verify Email
          </h2>
          <p class="mt-2 text-sm text-slate-400">
            Enter the 6-digit code sent to your registered email
          </p>
        </div>

        {error && (
          <div class="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-lg flex items-center gap-3 text-sm relative z-10">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-lg flex items-center gap-3 text-sm relative z-10">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form class="mt-6 space-y-6 relative z-10" onSubmit={handleSubmit}>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                class="block w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="student@college.edu"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                class="block w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 text-sm text-center font-mono tracking-widest text-white placeholder-slate-500 outline-none focus:border-blue-500 text-lg"
                placeholder="000000"
              />
            </div>
          </div>

          <div class="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex gap-3 text-xs text-slate-400">
            <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0" />
            <div>
              <span class="font-bold text-slate-300">Testing Backdoor:</span> You can use the backdoor validation key <code class="bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded font-mono font-bold border border-blue-500/20">123456</code> to verify accounts instantly for sandbox evaluation.
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              class="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 shadow-lg"
            >
              {loading ? (
                <div class="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Verify & Activate</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
