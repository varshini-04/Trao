'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { Loader } from 'lucide-react';

export default function Register() {
  const { register: signup, isAuthenticated, error, clearError, isLoading } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const router = useRouter();

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[0-9]*$/.test(val)) {
      setPassword(val);
      setPasswordError('');
      setShowTooltip(false);
    } else {
      setPasswordError('Only numbers are allowed');
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length !== 4) {
      setPasswordError('Password must be exactly 4 digits');
      setShowTooltip(true);
      return;
    }
    try {
      await signup(name, email.toLowerCase().trim(), password);
      router.push('/dashboard');
    } catch (err) {
      // Handled in store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Background decorative gradient blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/20 animate-fade-in-up relative z-10">
        
        {/* Accent Dash */}
        <div className="w-8 h-1 bg-green-500 mb-6 mx-auto rounded-full" />

        <div className="text-center mb-8">
          <span className="text-[10px] font-sans font-bold tracking-widest text-blue-500 uppercase block mb-1">
            TRAO PORTAL CREATION
          </span>
          <h2 className="text-3xl font-sans font-extrabold text-slate-800 tracking-tight">
            Create Account
          </h2>
          <p className="text-slate-500 font-sans text-xs mt-2">
            Get started on your custom travel planning
          </p>
        </div>

        {error && (
          <div className="p-4 mb-6 border border-red-100 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl font-sans">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 pl-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-sm text-slate-800 bg-white placeholder-slate-400"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 pl-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-sm text-slate-800 bg-white placeholder-slate-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 pl-1">
              Password (4-digit PIN)
            </label>
            <input
              type="password"
              required
              maxLength={4}
              value={password}
              onChange={handlePasswordChange}
              className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-sm text-slate-800 bg-white placeholder-slate-400 tracking-widest"
              placeholder="••••"
            />
            {showTooltip && (
              <div className="text-xs text-red-600 mt-2 font-semibold pl-1">
                <span>{passwordError}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || password.length !== 4}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed transition duration-300 font-sans text-xs font-bold tracking-wider uppercase rounded-full text-white shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader className="w-3.5 h-3.5 animate-spin" /> Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs font-sans text-slate-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-500 hover:text-blue-600 font-bold transition">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
