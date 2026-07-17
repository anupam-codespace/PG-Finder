'use client';

import React, { useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface ForgotPasswordCardProps {
  onOtpSent: (email: string) => void;
  onBackToLogin: () => void;
}

export default function ForgotPasswordCard({ onOtpSent, onBackToLogin }: ForgotPasswordCardProps) {
  const [email, setEmail] = useState('');
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
    
    const emailVal = email.trim();
    if (!emailVal) {
      setError('Please enter your email address.');
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message ?? 'Failed to send reset code. Please try again.');
        triggerShake();
        return;
      }

      onOtpSent(emailVal);
    } catch {
      setError('Network error. Check your connection and try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={shake ? 'auth-shake' : ''}
      style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      <div className="w-input-group">
        <label htmlFor="reset-email" className="w-label">Email address</label>
        <input
          id="reset-email"
          type="email"
          placeholder="workmail@gmail.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          required
          disabled={loading}
          className="w-input"
        />
      </div>

      {error && (
        <div role="alert" className="w-error">
          <svg style={{ width: 17, height: 17, flexShrink: 0, marginTop: 1 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <button type="submit" className="w-btn" disabled={loading || !email.trim()} style={{ marginTop: 4 }}>
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Loader2 size={19} style={{ animation: 'spin 1s linear infinite' }} /> Sending Code…
          </span>
        ) : (
          'Send Reset Code'
        )}
      </button>

      {loading && <div className="w-loading-bar"><div className="w-loading-bar-inner" /></div>}

      <p style={{ textAlign: 'center', fontSize: '0.88rem', color: '#64748b', margin: '2px 0 0' }}>
        <button type="button" onClick={onBackToLogin} disabled={loading} className="w-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to Login
        </button>
      </p>
    </form>
  );
}
