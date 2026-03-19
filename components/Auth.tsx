'use client';

import { useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { Mail, Lock, User, AtSign, Eye, EyeOff, ArrowRight, MessageSquare } from 'lucide-react';

// GitHub SVG icon
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

// Google SVG icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

interface InputFieldProps {
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  required?: boolean;
  hint?: string;
  isDark: boolean;
  showToggle?: boolean;
}

function InputField({ type: baseType, value, onChange, placeholder, icon, required, hint, isDark, showToggle }: InputFieldProps) {
  const [show, setShow] = useState(false);
  const type = showToggle ? (show ? 'text' : 'password') : baseType;

  return (
    <div>
      <div className="relative group">
        <div className={`absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors duration-200 ${isDark ? 'text-white/25 group-focus-within:text-[#e8ff8a]' : 'text-black/25 group-focus-within:text-black/70'}`}>
          {icon}
        </div>
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-11 pr-${showToggle ? '11' : '4'} py-3.5 rounded-2xl border text-[15px] focus:outline-none transition-all duration-200 font-medium
            ${isDark
              ? 'bg-white/5 border-white/8 text-white placeholder:text-white/20 focus:bg-white/8 focus:border-[#e8ff8a]/40 focus:shadow-[0_0_0_3px_rgba(232,255,138,0.08)]'
              : 'bg-black/3 border-black/8 text-black/90 placeholder:text-black/25 focus:bg-white focus:border-black/25 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] shadow-sm'
            }`}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className={`absolute inset-y-0 right-3 flex items-center px-1 transition-colors ${isDark ? 'text-white/25 hover:text-white/60' : 'text-black/25 hover:text-black/60'}`}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {hint && <p className={`text-[11px] mt-1.5 ml-1 ${isDark ? 'text-white/30' : 'text-black/35'}`}>{hint}</p>}
    </div>
  );
}

export default function Auth({ onAuthSuccess, isDark, onToggleTheme }: { 
  onAuthSuccess: (session: any) => void, 
  isDark: boolean,
  onToggleTheme: () => void 
}) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const remembered = localStorage.getItem('chatRemember');
    if (remembered) {
      try {
        const { email } = JSON.parse(remembered);
        setEmail(email);
        setRememberMe(true);
      } catch (e) {}
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await insforge.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if ((data as any)?.session || data?.accessToken) {
          if (rememberMe) {
            localStorage.setItem('chatRemember', JSON.stringify({ email, password }));
          } else {
            localStorage.removeItem('chatRemember');
          }
          onAuthSuccess(data);
        }
      } else {
        if (!username.trim()) {
           setError('Username is required');
           setLoading(false);
           return;
        }
        const { data, error } = await insforge.auth.signUp({ 
          email, 
          password, 
          name,
          username: username.toLowerCase().trim(),
        } as any);
        if (error) throw error;
        if ((data as any)?.session || data?.accessToken) {
          if (rememberMe) {
            localStorage.setItem('chatRemember', JSON.stringify({ email, password }));
          } else {
            localStorage.removeItem('chatRemember');
          }
          onAuthSuccess(data);
        } else {
          setError('Account created! Please verify your email.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError('');
    setOauthLoading(provider);
    try {
      const redirectTo = window.location.origin + window.location.pathname;
      const { error } = await insforge.auth.signInWithOAuth({ provider, redirectTo });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
      setOauthLoading(null);
    }
  };

  const bgBase = isDark ? 'bg-[#060608]' : 'bg-[#f5f5f7]';
  const cardBg = isDark ? 'bg-[#101014]/80 border-white/8 shadow-[0_32px_80px_rgba(0,0,0,0.6)]' : 'bg-white/80 border-black/6 shadow-[0_32px_80px_rgba(0,0,0,0.08)]';

  return (
    <div className={`flex flex-1 w-full items-center justify-center p-4 min-h-screen ${bgBase} relative overflow-hidden`}>
      {/* Background ambience */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-60 ${isDark ? 'bg-[#e8ff8a]/10' : 'bg-[#e8ff8a]/30'}`} />
      <div className={`absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none opacity-40 ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-400/20'}`} />

      <div className={`w-full max-w-[400px] rounded-[2.5rem] border backdrop-blur-2xl p-8 relative animate-slide-up ${cardBg}`}>
        
        {/* Logo + header */}
        <div className="text-center mb-8">
          <div className={`w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg ${isDark ? 'bg-[#e8ff8a] shadow-[#e8ff8a]/20' : 'bg-[#d6ef68] shadow-[#d6ef68]/30'}`}>
            <MessageSquare size={26} className="text-black" />
          </div>
          <h1 className={`text-2xl font-black tracking-tight mb-1.5 ${isDark ? 'text-white' : 'text-black'}`}>
            {isLogin ? 'Welcome back' : 'Join Chatify'}
          </h1>
          <p className={`text-[14px] font-medium ${isDark ? 'text-white/40' : 'text-black/45'}`}>
            {isLogin ? 'Sign in to continue chatting' : 'Create your free account today'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className={`mb-5 px-4 py-3 rounded-2xl text-sm font-semibold text-center border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
            {error}
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <button
            type="button"
            id="auth-google-btn"
            onClick={() => handleOAuth('google')}
            disabled={!!oauthLoading || loading}
            className={`w-full flex items-center justify-center gap-3 py-3 px-5 rounded-2xl border font-semibold text-[14px] transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0
              ${isDark ? 'bg-white/6 border-white/10 text-white/90 hover:bg-white/10 hover:border-white/20' : 'bg-white border-black/8 text-black/80 hover:border-black/20 shadow-sm hover:shadow-md'}`}
          >
            {oauthLoading === 'google' ? (
              <span className={`w-4 h-4 border-2 rounded-full animate-spin ${isDark ? 'border-white/30 border-t-white' : 'border-black/20 border-t-black/70'}`} />
            ) : <GoogleIcon />}
            Continue with Google
          </button>

          <button
            type="button"
            id="auth-github-btn"
            onClick={() => handleOAuth('github')}
            disabled={!!oauthLoading || loading}
            className={`w-full flex items-center justify-center gap-3 py-3 px-5 rounded-2xl border font-semibold text-[14px] transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0
              ${isDark ? 'bg-white/90 border-transparent text-black hover:bg-white' : 'bg-gray-900 border-transparent text-white hover:bg-black'}`}
          >
            {oauthLoading === 'github' ? (
              <span className={`w-4 h-4 border-2 rounded-full animate-spin ${isDark ? 'border-black/30 border-t-black' : 'border-white/30 border-t-white'}`} />
            ) : <GitHubIcon />}
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className={`absolute inset-0 flex items-center`}>
            <div className={`w-full border-t ${isDark ? 'border-white/8' : 'border-black/8'}`} />
          </div>
          <div className="relative flex justify-center">
            <span className={`px-3 text-[11px] font-black uppercase tracking-[0.15em] ${isDark ? 'bg-[#101014] text-white/20' : 'bg-white text-black/25'}`}>or</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <>
              <InputField
                type="text" value={name} onChange={setName}
                placeholder="Full name" icon={<User size={16} />}
                required isDark={isDark}
              />
              <InputField
                type="text" value={username}
                onChange={(v) => setUsername(v.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="username_123" icon={<AtSign size={16} />}
                required isDark={isDark} hint="Letters, numbers and underscores only"
              />
            </>
          )}
          <InputField
            type="email" value={email} onChange={setEmail}
            placeholder="Email address" icon={<Mail size={16} />}
            required isDark={isDark}
          />
          <InputField
            type="password" value={password} onChange={setPassword}
            placeholder="Password" icon={<Lock size={16} />}
            required isDark={isDark} showToggle
          />

          {/* Remember me */}
          <div className="flex items-center pt-1">
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${rememberMe
                ? 'bg-[#e8ff8a] border-[#e8ff8a]'
                : isDark ? 'bg-white/5 border-white/15 hover:border-white/30' : 'bg-white border-black/15 hover:border-black/30'}`}
            >
              {rememberMe && <span className="text-black text-[10px] font-black leading-none">✓</span>}
            </button>
            <label
              onClick={() => setRememberMe(!rememberMe)}
              className={`ml-2.5 text-[13px] font-medium cursor-pointer select-none ${isDark ? 'text-white/50 hover:text-white/80' : 'text-black/50 hover:text-black/80'}`}
            >
              Remember me
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="auth-submit-btn"
            disabled={loading || !!oauthLoading}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-[15px] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-2
              ${isDark
                ? 'bg-[#e8ff8a] text-black hover:bg-white shadow-lg shadow-[#e8ff8a]/20 hover:shadow-[#e8ff8a]/30'
                : 'bg-black text-white hover:bg-gray-900 shadow-lg shadow-black/15 hover:shadow-black/25'
              }`}
          >
            {loading ? (
              <span className={`w-5 h-5 border-2 rounded-full animate-spin border-t-transparent ${isDark ? 'border-black/30 border-t-black' : 'border-white/30 border-t-white'}`} />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={17} className="opacity-70" />
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <span className={`text-[13px] ${isDark ? 'text-white/30' : 'text-black/35'}`}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </span>{' '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            type="button"
            className={`text-[13px] font-black transition-colors ${isDark ? 'text-[#e8ff8a] hover:text-white' : 'text-black hover:text-gray-600'}`}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
