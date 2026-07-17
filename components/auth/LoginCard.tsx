'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface LoginCardProps {
  onOtpRequired: (userId: string, email: string) => void;
  onLoginSuccess: (token: string, user: any) => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
}

export default function LoginCard({ onOtpRequired, onLoginSuccess, onSwitchToRegister, onForgotPassword }: LoginCardProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? 'Login failed. Please try again.'); triggerShake(); return; }
      
      if (data.token && data.user) {
        onLoginSuccess(data.token, data.user);
      } else {
        onOtpRequired(data.userId, email.trim());
      }
    } catch {
      setError('Network error. Check your connection and try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  return (
    <form
      id="login-form"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Sign in form"
      className={shake ? 'auth-shake' : ''}
      style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      {/* Email */}
      <div className="w-input-group">
        <label htmlFor="login-email" className="w-label">Email address</label>
        <input
          id="login-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="workmail@gmail.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          required
          disabled={loading}
          className="w-input"
          aria-required="true"
        />
      </div>

      {/* Password */}
      <div className="w-input-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label htmlFor="login-password" className="w-label">Password</label>
          <button type="button" onClick={onForgotPassword} disabled={loading} className="w-link" style={{ fontSize: '0.8rem' }}>
            Forgot password?
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            id="login-password"
            name="password"
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            required
            disabled={loading}
            className="w-input"
            style={{ paddingRight: 46 }}
            aria-required="true"
          />
          <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)} className="eye-btn" aria-label={showPw ? 'Hide password' : 'Show password'}>
            {showPw ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div id="login-error" role="alert" aria-live="assertive" className="w-error">
          <svg style={{ width: 17, height: 17, flexShrink: 0, marginTop: 1 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button id="login-submit-btn" type="submit" className="w-btn" disabled={!canSubmit} style={{ marginTop: 4 }}>
        {loading
          ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader2 size={19} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…
            </span>
          : 'Log In'
        }
      </button>

      {loading && <div className="w-loading-bar"><div className="w-loading-bar-inner" /></div>}

      {/* Switch */}
      <p style={{ textAlign: 'center', fontSize: '0.88rem', color: '#64748b', margin: '2px 0 0', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Have an account?{' '}
        <button type="button" id="switch-to-register-btn" onClick={onSwitchToRegister} disabled={loading} className="w-link">
          Sign up
        </button>
      </p>
    </form>
  );
}
