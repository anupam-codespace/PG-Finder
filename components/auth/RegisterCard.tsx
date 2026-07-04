'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { validateEmailDomain } from '@/lib/email-validator';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface RegisterCardProps {
  onOtpRequired: (userId: string, email: string) => void;
  onSwitchToLogin: () => void;
}

export default function RegisterCard({ onOtpRequired, onSwitchToLogin }: RegisterCardProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const validate = (): string | null => {
    if (!email.trim() || !password || !confirmPw) return 'All fields are required.';
    const dc = validateEmailDomain(email.trim());
    if (!dc.isValid) return dc.message || 'Please enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password !== confirmPw) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    const err = validate();
    if (err) { setError(err); triggerShake(); return; }
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? 'Registration failed.'); triggerShake(); return; }
      onOtpRequired(data.userId, email.trim());
    } catch {
      setError('Network error. Check your connection and try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthMeta: Record<number, { label: string; color: string }> = {
    1: { label: 'Weak', color: '#ef4444' },
    2: { label: 'Moderate', color: '#f59e0b' },
    3: { label: 'Good', color: '#3b82f6' },
    4: { label: 'Strong', color: '#10b981' },
  };

  const mismatch = confirmPw.length > 0 && confirmPw !== password;
  const canSubmit = email.trim() && password && confirmPw && !loading;

  return (
    <form
      id="register-form"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Create account form"
      className={shake ? 'auth-shake' : ''}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* Email */}
      <div className="w-input-group">
        <label htmlFor="reg-email" className="w-label">Email address</label>
        <input
          id="reg-email" name="email" type="email" inputMode="email"
          autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          placeholder="workmail@gmail.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          required disabled={loading}
          className="w-input" aria-required="true"
        />
      </div>

      {/* Password */}
      <div className="w-input-group">
        <label htmlFor="reg-password" className="w-label">Password</label>
        <div style={{ position: 'relative' }}>
          <input
            id="reg-password" name="password"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            required disabled={loading}
            className="w-input" style={{ paddingRight: 46 }}
            aria-required="true"
            aria-describedby={password ? 'pw-strength' : undefined}
          />
          <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)} className="eye-btn">
            {showPw ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>

        {/* Strength meter */}
        {password && (
          <div id="pw-strength" aria-live="polite" style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', gap: 5, marginBottom: 4 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="strength-bar" style={{ background: i <= strength ? (strengthMeta[strength]?.color ?? '#e2e8f0') : '#e2e8f0' }} />
              ))}
            </div>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: strengthMeta[strength]?.color ?? '#9ca3af', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
              {strengthMeta[strength]?.label ?? ''}
            </p>
          </div>
        )}
      </div>

      {/* Confirm password */}
      <div className="w-input-group">
        <label htmlFor="reg-confirm" className="w-label">Confirm Password</label>
        <input
          id="reg-confirm" name="confirmPassword"
          type={showPw ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirmPw}
          onChange={(e) => { setConfirmPw(e.target.value); setError(''); }}
          required disabled={loading}
          className={`w-input${mismatch ? ' w-input-error' : ''}`}
          aria-required="true" aria-invalid={mismatch}
        />
        {mismatch && (
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ef4444', margin: '3px 0 0', fontFamily: "'Plus Jakarta Sans', sans-serif" }} aria-live="polite">
            Passwords do not match.
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div id="register-error" role="alert" aria-live="assertive" className="w-error">
          <svg style={{ width: 17, height: 17, flexShrink: 0, marginTop: 1 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button id="register-submit-btn" type="submit" className="w-btn" disabled={!canSubmit} style={{ marginTop: 4 }}>
        {loading
          ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader2 size={19} style={{ animation: 'spin 1s linear infinite' }} /> Creating account…
            </span>
          : 'Sign Up'
        }
      </button>

      {loading && <div className="w-loading-bar"><div className="w-loading-bar-inner" /></div>}

      {/* Switch */}
      <p style={{ textAlign: 'center', fontSize: '0.88rem', color: '#64748b', margin: '2px 0 0', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Already have an account?{' '}
        <button type="button" id="switch-to-login-btn" onClick={onSwitchToLogin} disabled={loading} className="w-link">
          Log In
        </button>
      </p>
    </form>
  );
}
