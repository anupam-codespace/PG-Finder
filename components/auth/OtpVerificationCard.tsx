'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const OTP_LEN = 6;
const COOLDOWN = 60;

interface OtpProps {
  userId: string;
  email: string;
  purpose: 'LOGIN' | 'REGISTER';
  onVerified: (token: string, user: { id: string; email: string; isVerified: boolean }) => void;
  onBack: () => void;
}

export default function OtpVerificationCard({ userId, email, purpose, onVerified, onBack }: OtpProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [countdown, setCountdown] = useState(COOLDOWN);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lastCode = useRef('');

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };
  const focusAt = (i: number) => inputRefs.current[i]?.focus();

  const handleChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1);
    setDigits(prev => { const n = [...prev]; n[i] = d; return n; });
    setError('');
    if (d && i < OTP_LEN - 1) focusAt(i + 1);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[i]) { setDigits(prev => { const n = [...prev]; n[i] = ''; return n; }); }
      else if (i > 0) focusAt(i - 1);
    }
    if (e.key === 'ArrowLeft' && i > 0) focusAt(i - 1);
    if (e.key === 'ArrowRight' && i < OTP_LEN - 1) focusAt(i + 1);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
    if (!p) return;
    const n = Array(OTP_LEN).fill('');
    p.split('').forEach((c, i) => { n[i] = c; });
    setDigits(n);
    focusAt(Math.min(p.length, OTP_LEN) - 1);
  };

  const code = digits.join('');
  const isComplete = digits.every(d => d !== '');

  const handleVerify = useCallback(async (c: string) => {
    if (!c || c.length !== OTP_LEN || loading) return;
    if (lastCode.current === c) return;
    lastCode.current = c;
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otpCode: c, purpose }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Verification failed. Please try again.');
        triggerShake();
        setDigits(Array(OTP_LEN).fill(''));
        lastCode.current = '';
        setTimeout(() => focusAt(0), 50);
        return;
      }
      onVerified(data.token, data.user);
    } catch {
      setError('Network error. Please check your connection.');
      triggerShake();
      lastCode.current = '';
    } finally {
      setLoading(false);
    }
  }, [loading, userId, purpose, onVerified]);

  useEffect(() => {
    if (isComplete) handleVerify(digits.join(''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, code]);

  const handleResend = async () => {
    if (countdown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendSuccess(false);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, purpose }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? 'Could not resend OTP.'); return; }
      setCountdown(COOLDOWN);
      setResendSuccess(true);
      setDigits(Array(OTP_LEN).fill(''));
      lastCode.current = '';
      setTimeout(() => focusAt(0), 50);
    } catch {
      setError('Network error. Could not resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  const progress = Math.round(((COOLDOWN - countdown) / COOLDOWN) * 100);
  const circ = 2 * Math.PI * 8;

  return (
    <div className={shake ? 'auth-shake' : ''}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: '0.85rem', color: '#64748b', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: '0 0 4px' }}>
          Check this email for the 6-digit code:
        </p>
        <p style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
          {email}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* OTP boxes */}
        <div
          style={{ display: 'flex', justifyContent: 'center', gap: 8 }}
          role="group"
          aria-label="One-time password input"
          onPaste={handlePaste}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onFocus={e => e.target.select()}
              disabled={loading}
              autoFocus={i === 0}
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              aria-label={`Digit ${i + 1} of ${OTP_LEN}`}
              aria-required="true"
              className={`otp-box${d ? ' filled' : ''}`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div id="otp-error" role="alert" aria-live="assertive" className="w-error">
            <svg style={{ width: 17, height: 17, flexShrink: 0, marginTop: 1 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Resend success */}
        {resendSuccess && !error && (
          <div role="status" aria-live="polite" className="w-success">
            <svg style={{ width: 17, height: 17, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>A new code has been sent to your email.</span>
          </div>
        )}

        {/* Verify button */}
        <button id="otp-verify-btn" type="button" onClick={() => handleVerify(code)} className="w-btn" disabled={!isComplete || loading} style={{ marginTop: 2 }}>
          {loading
            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Loader2 size={19} style={{ animation: 'spin 1s linear infinite' }} /> Verifying…
              </span>
            : 'Verify Code'
          }
        </button>

        {loading && <div className="w-loading-bar"><div className="w-loading-bar-inner" /></div>}

        {/* Resend + back */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 4 }}>
          {countdown > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8', fontFamily: "'Plus Jakarta Sans', sans-serif" }} aria-live="polite">
              <svg style={{ width: 18, height: 18, transform: 'rotate(-90deg)', flexShrink: 0 }} viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2.5" />
                <circle cx="10" cy="10" r="8" fill="none" stroke="#3b2ee8" strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={circ * (1 - progress / 100)}
                  style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
              <span>Resend in <strong style={{ color: '#475569' }}>{countdown}s</strong></span>
            </div>
          ) : (
            <button type="button" id="otp-resend-btn" onClick={handleResend} disabled={resendLoading} className="resend-btn">
              {resendLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={13} />}
              {resendLoading ? 'Sending…' : 'Resend code'}
            </button>
          )}

          <button type="button" id="otp-back-btn" onClick={onBack} disabled={loading}
            style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', transition: 'color 0.14s' }}
            onMouseOver={e => (e.currentTarget.style.color = '#64748b')}
            onMouseOut={e => (e.currentTarget.style.color = '#94a3b8')}
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
