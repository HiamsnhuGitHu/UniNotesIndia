import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPassword() {
  return (
    <div class="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        
        <div class="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div class="text-center relative z-10 space-y-4">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h2 class="font-display text-3xl font-extrabold text-white">
            Contact Admin
          </h2>
          <p class="text-xs text-slate-400 leading-normal max-w-sm mx-auto font-sans">
            Password recovery via automated token/OTP is currently disabled. Please contact the platform administrator to reset or recover your account password.
          </p>
        </div>

        {/* Email display container */}
        <div class="flex items-center gap-3 bg-slate-900/40 p-4 rounded-xl border border-white/5 relative z-10 text-left font-sans">
          <Mail className="h-4 w-4 text-blue-400 shrink-0" />
          <div>
            <p class="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Admin Support Email</p>
            <a href="mailto:uninotesindia@gmail.com" class="text-xs font-bold text-white hover:text-blue-400 transition mt-0.5 block">
              uninotesindia@gmail.com
            </a>
          </div>
        </div>

        <div class="relative z-10 flex flex-col items-center">
          <Link
            to="/login"
            class="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition duration-300 mt-2 font-sans"
          >
            <ArrowLeft size={14} />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
