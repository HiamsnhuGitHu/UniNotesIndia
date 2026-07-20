import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    city: '',
    collegeName: '',
    username: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const errors = {};
    
    // Indian phone pattern: 10 digits starting with 6-9
    const mobilePattern = /^[6-9]\d{9}$/;
    if (!mobilePattern.test(formData.mobileNumber)) {
      errors.mobileNumber = 'Mobile number must be a valid 10-digit Indian number';
    }

    // Basic email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) {
      errors.email = 'Must be a valid email address';
    }

    if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error on change
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      // Success, route to verify with email in state
      navigate('/verify-email', { state: { email: formData.email } });
    } catch (err) {
      if (err.response && err.response.data) {
        // Validation errors returned from back-end
        const errorData = err.response.data;
        if (typeof errorData === 'object' && !errorData.error) {
          setValidationErrors(errorData);
        } else {
          setError(errorData.error || 'Registration failed.');
        }
      } else {
        setError('Failed to connect to the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-2xl w-full space-y-6 glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        
        {/* Glow Effects */}
        <div class="absolute -top-32 -left-32 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl"></div>

        <div class="text-center relative z-10">
          <h2 class="font-display text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <Sparkles className="text-yellow-400" />
            <span>Join <span class="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">UniNotes India</span></span>
          </h2>
          <p class="mt-2 text-sm text-slate-400">
            Create a student account to share and access notes
          </p>
        </div>

        {error && (
          <div class="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-lg flex items-center gap-3 text-sm relative z-10">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form class="mt-6 space-y-5 relative z-10" onSubmit={handleSubmit}>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                class="block w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="Rahul Sharma"
              />
              {validationErrors.fullName && (
                <p class="mt-1 text-xs text-rose-400">{validationErrors.fullName}</p>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Mobile Number (India)
              </label>
              <input
                name="mobileNumber"
                type="text"
                required
                value={formData.mobileNumber}
                onChange={handleChange}
                class="block w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="9876543210"
              />
              {validationErrors.mobileNumber && (
                <p class="mt-1 text-xs text-rose-400">{validationErrors.mobileNumber}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                class="block w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="student@college.edu"
              />
              {validationErrors.email && (
                <p class="mt-1 text-xs text-rose-400">{validationErrors.email}</p>
              )}
            </div>

            {/* City */}
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                City
              </label>
              <input
                name="city"
                type="text"
                required
                value={formData.city}
                onChange={handleChange}
                class="block w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="Jaipur"
              />
              {validationErrors.city && (
                <p class="mt-1 text-xs text-rose-400">{validationErrors.city}</p>
              )}
            </div>

            {/* College Name */}
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                College/University Name
              </label>
              <input
                name="collegeName"
                type="text"
                required
                value={formData.collegeName}
                onChange={handleChange}
                class="block w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="JECRC University, Jaipur"
              />
              {validationErrors.collegeName && (
                <p class="mt-1 text-xs text-rose-400">{validationErrors.collegeName}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                class="block w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="student123"
              />
              {validationErrors.username && (
                <p class="mt-1 text-xs text-rose-400">{validationErrors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div class="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  class="block w-full rounded-xl border border-slate-700/60 bg-slate-900/60 pl-4 pr-12 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
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
              {validationErrors.password && (
                <p class="mt-1 text-xs text-rose-400">{validationErrors.password}</p>
              )}
            </div>

          </div>

          <div class="pt-2">
            <button
              type="submit"
              disabled={loading}
              class="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 shadow-lg shadow-purple-500/20"
            >
              {loading ? (
                <div class="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span class="flex items-center gap-2">
                  <UserPlus size={16} />
                  <span>Register Account</span>
                </span>
              )}
            </button>
          </div>
        </form>

        <div class="text-center mt-6 text-sm text-slate-400 relative z-10">
          Already registered?{' '}
          <Link to="/login" class="text-blue-400 hover:text-blue-300 font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
