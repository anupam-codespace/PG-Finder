'use client';

import React, { useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface ResetPasswordCardProps {
  email: string;
  onResetSuccess: () => void;
  onCancel: () => void;
}

export default function ResetPasswordCard({ email, onResetSuccess, onCancel }: ResetPasswordCardProps) {
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
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

    const otpVal = otpCode.trim();
    const pwVal = newPassword;

    if (!otpVal || !pwVal) {
      setError('Please fill in all fields.');
      triggerShake();
      return;
    }

    if (pwVal.length < 6) {
      setError('Password must be at least 6 characters.');
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otpCode: otpVal,
          newPassword: pwVal,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Failed to reset password. Check your code.');
        triggerShake();
        return;
      }

      onResetSuccess();
    } catch {
      setError('Network error. Check your connection and try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = otpCode.trim().length > 0 && newPassword.length >= 6 && !loading;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={shake ? 'auth-shake' : ''}
      style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      {/* Email (Read Only) */}
      <div className="w-input-group">
        <label className="w-label">Resetting password for</label>
        <input
          type="text"
          value={email}
          disabled
          className="w-input"
          style={{ opacity: 0.65, cursor: 'not-allowed', background: '#e2e8f0' }}
        />
      </div>

      {/* OTP Code */}
      <div className="w-input-group">
        <label htmlFor="reset-otp" className="w-label">Enter 6-digit Reset OTP</label>
        <input
          id="reset-otp"
          type="text"
          maxLength={6}
          placeholder="000000"
          value={otpCode}
          onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '')); setError(''); }}
          required
          disabled={loading}
          className="w-input"
          style={{ letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.1rem' }}
        />
      </div>

      {/* New Password */}
      <div className="w-input-group">
        <label htmlFor="reset-password" className="w-label">New Password</label>
        <div style={{ position: 'relative' }}>
          <input
            id="reset-password"
            type={showPw ? 'text' : 'password'}
            placeholder="Min 6 characters"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
            required
            disabled={loading}
            className="w-input"
            style={{ paddingRight: 46 }}
          />
          <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)} className="eye-btn">
            {showPw ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="w-error">
          <svg style={{ width: 17, height: 17, flexShrink: 0, marginTop: 1 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <button type="submit" className="w-btn" disabled={!canSubmit} style={{ marginTop: 4 }}>
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Loader2 size={19} style={{ animation: 'spin 1s linear infinite' }} /> Updating Password…
          </span>
        ) : (
          'Reset Password'
        )}
      </button>

      {loading && <div className="w-loading-bar"><div className="w-loading-bar-inner" /></div>}

      <p style={{ textAlign: 'center', fontSize: '0.88rem', color: '#64748b', margin: '2px 0 0' }}>
        <button type="button" onClick={onCancel} disabled={loading} className="w-link">
          Cancel and go back
        </button>
      </p>
    </form>
  );
}
