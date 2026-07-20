import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, KeyRound, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        const errorMsg = err.response.data.error;
        setError(errorMsg);
        
        // If unverified, offer redirection to verification page
        if (errorMsg.toLowerCase().includes('verify')) {
          setTimeout(() => {
            navigate('/verify-email', { state: { username } });
          }, 2000);
        }
      } else {
        setError('Invalid username or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden pulse-glow">
        <div class="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div class="text-center relative z-10">
          <h2 class="font-display text-3xl font-extrabold tracking-tight text-white">
            Welcome back to <span class="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">UniNotes</span>
          </h2>
          <p class="mt-2 text-sm text-slate-400">
            Sign in to access your dashboard and university resources
          </p>
        </div>

        {error && (
          <div class="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-lg flex items-center gap-3 text-sm relative z-10">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form class="mt-8 space-y-6 relative z-10" onSubmit={handleSubmit}>
          <div class="space-y-4">
            <div>
              <label for="username" class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div class="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  class="block w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition focus:border-blue-500 focus:bg-slate-900/80"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="password" class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" class="text-xs text-blue-400 hover:text-blue-300 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div class="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  class="block w-full rounded-xl border border-slate-700/60 bg-slate-900/60 pl-4 pr-12 py-3 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition focus:border-blue-500 focus:bg-slate-900/80"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              class="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <div class="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span class="flex items-center gap-2">
                  <LogIn size={16} />
                  <span>Sign In</span>
                </span>
              )}
            </button>
          </div>
        </form>

        <div class="text-center mt-6 text-sm text-slate-400 relative z-10">
          New to UniNotes?{' '}
          <Link to="/register" class="text-purple-400 hover:text-purple-300 font-semibold">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
