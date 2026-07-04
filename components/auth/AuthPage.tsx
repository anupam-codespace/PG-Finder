'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import LoginCard from './LoginCard';
import RegisterCard from './RegisterCard';
import OtpVerificationCard from './OtpVerificationCard';
import Dashboard from '../dashboard/Dashboard';

type View = 'login' | 'register' | 'otp';
type OtpPurpose = 'LOGIN' | 'REGISTER';

interface OtpContext {
  userId: string;
  email: string;
  purpose: OtpPurpose;
}

interface AuthUser {
  id: string;
  email: string;
  isVerified: boolean;
}

function ViewTransition({
  id,
  activeId,
  children,
}: {
  id: string;
  activeId: string;
  children: React.ReactNode;
}) {
  const isActive = id === activeId;
  const hasMounted = useRef(false);
  if (isActive) hasMounted.current = true;
  if (!hasMounted.current) return null;

  return (
    <div
      role="tabpanel"
      aria-hidden={!isActive}
      style={{
        display: isActive ? 'block' : 'none',
        animation: isActive ? 'authFadeSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1) both' : 'none',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}

// ── Left Panel Headline content per view ──────────────────
const LEFT_CONTENT: Record<View, { tag: string; title: string; sub: string }> = {
  login: {
    tag: 'Welcome back',
    title: 'Streamline your lab.\nDeliver results faster.',
    sub: 'Globiz Patholab brings clinicians and labs together on one intelligent platform.',
  },
  register: {
    tag: 'Get started for free',
    title: 'Built for pathology\nprofessionals.',
    sub: 'Join hundreds of labs already managing reports, patients, and diagnostics — effortlessly.',
  },
  otp: {
    tag: 'Almost there',
    title: 'Secure your\naccount in seconds.',
    sub: 'We use email-based OTP verification to keep your diagnostic data safe and protected.',
  },
};

export default function AuthPage() {
  const [view, setView] = useState<View>('login');
  const [otpContext, setOtpContext] = useState<OtpContext | null>(null);
  const [authedUser, setAuthedUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      const token = localStorage.getItem('auth_token');
      if (stored && token) setAuthedUser(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const handleLoginOtpRequired = useCallback((userId: string, email: string) => {
    setOtpContext({ userId, email, purpose: 'LOGIN' });
    setView('otp');
  }, []);

  const handleRegisterOtpRequired = useCallback((userId: string, email: string) => {
    setOtpContext({ userId, email, purpose: 'REGISTER' });
    setView('otp');
  }, []);

  const handleVerified = useCallback((token: string, user: AuthUser) => {
    try {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    } catch { /* ignore */ }
    setAuthedUser(user);
  }, []);

  const handleBackFromOtp = useCallback(() => {
    setView(otpContext?.purpose === 'REGISTER' ? 'register' : 'login');
    setOtpContext(null);
  }, [otpContext]);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    } catch { /* ignore */ }
    setAuthedUser(null);
    setOtpContext(null);
    setView('login');
  }, []);

  if (authedUser) return <Dashboard user={authedUser} onLogout={handleLogout} />;

  const left = LEFT_CONTENT[view];

  // ── Mobile: gradient-top + white-card-bottom header titles ──
  const mobileTitle =
    view === 'login' ? 'Sign In' :
    view === 'register' ? 'Sign Up' : 'Verify Email';
  const mobileSub =
    view === 'login' ? 'Welcome back! Please sign in.' :
    view === 'register' ? 'Create your account to get started.' :
    'Check your inbox for the code.';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

        /* ── Keyframes ── */
        @keyframes authFadeSlide {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes leftFadeIn {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes blob1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(40px,-50px) scale(1.1); }
          66%      { transform: translate(-20px,30px) scale(0.95); }
        }
        @keyframes blob2 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(-50px,30px) scale(1.08); }
          66%      { transform: translate(30px,-20px) scale(1.05); }
        }
        @keyframes blob3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(25px,40px) scale(1.12); }
        }
        @keyframes mobileHeaderIn {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        /* ── Shared font ── */
        .auth-font { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }

        /* ════════════════════════════════════════
           DESKTOP LAYOUT  (≥ 900px)
        ════════════════════════════════════════ */
        .auth-shell {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: #f1f3ff;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
        }

        .auth-card {
          display: flex;
          width: 100%;
          max-width: 980px;
          min-height: 580px;
          border-radius: 28px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.04),
            0 8px 24px rgba(0,0,0,0.06),
            0 32px 64px rgba(0,0,0,0.06);
        }

        /* ── Left gradient panel ── */
        .auth-left {
          display: none;
          position: relative;
          width: 44%;
          flex-shrink: 0;
          overflow: hidden;
          background: linear-gradient(145deg, #100784 0%, #2414c4 28%, #3b2ee8 52%, #1d39bd 75%, #0a4abf 100%);
          padding: 48px 44px;
          flex-direction: column;
          justify-content: space-between;
        }

        /* ── Right form panel ── */
        .auth-right {
          flex: 1;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 52px 56px;
          min-width: 0;
        }

        /* ── Left panel tag pill ── */
        .left-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          letter-spacing: 0.02em;
          backdrop-filter: blur(8px);
          margin-bottom: 32px;
          width: fit-content;
        }

        .left-tag::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #7cf0aa;
          box-shadow: 0 0 6px #7cf0aa;
        }

        /* ── Left panel headline ── */
        .left-headline {
          font-size: clamp(1.7rem, 3vw, 2.2rem);
          font-weight: 800;
          color: #ffffff;
          line-height: 1.18;
          letter-spacing: -0.03em;
          white-space: pre-line;
          margin: 0 0 16px;
        }

        .left-sub {
          font-size: 0.92rem;
          font-weight: 500;
          color: rgba(255,255,255,0.7);
          line-height: 1.65;
          max-width: 300px;
        }

        /* ── Left panel feature pills row ── */
        .left-features {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 36px;
        }

        .left-feature-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 10px;
          padding: 6px 12px;
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          backdrop-filter: blur(6px);
        }

        /* ── Left panel bottom branding ── */
        .left-bottom {
          margin-top: auto;
          padding-top: 32px;
        }

        .left-brand {
          font-size: 0.78rem;
          font-weight: 700;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* ── Blob decorations ── */
        .blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        /* ── Right panel form heading ── */
        .form-title {
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.03em;
          margin: 0 0 6px;
          line-height: 1.2;
        }

        .form-sub {
          font-size: 0.9rem;
          font-weight: 500;
          color: #64748b;
          margin: 0 0 32px;
          line-height: 1.5;
        }

        /* ── MOBILE LAYOUT  (< 900px) ── */
        @media (min-width: 900px) {
          .auth-shell {
            background: #f1f3ff;
          }
          .auth-left {
            display: flex;
          }
          /* Hide mobile-only elements on desktop */
          .mobile-header { display: none !important; }
          .mobile-card-wrap { border-radius: 0 !important; margin-top: 0 !important; box-shadow: none !important; padding-bottom: 0 !important; background: transparent !important; }
        }

        @media (max-width: 899px) {
          .auth-shell {
            padding: 0;
            background: #2d14c9;
            align-items: stretch;
          }
          .auth-card {
            flex-direction: column;
            border-radius: 0;
            max-width: 430px;
            min-height: 100vh;
            margin: 0 auto;
            box-shadow: none;
          }
          .auth-left { display: none; }
          .auth-right {
            background: transparent;
            padding: 0;
            flex: 1;
            align-items: stretch;
            justify-content: flex-start;
          }
          .form-title, .form-sub { display: none; }
          .form-content-wrap {
            background: #ffffff;
            border-top-left-radius: 28px;
            border-top-right-radius: 28px;
            margin-top: -28px;
            padding: 32px 24px 40px;
            flex: 1;
            box-shadow: 0 -4px 40px rgba(0,0,0,0.08);
          }
        }

        /* ── Desktop form content wrapper ── */
        @media (min-width: 900px) {
          .form-content-wrap {
            width: 100%;
            max-width: 380px;
          }
          .mobile-header { display: none; }
        }

        /* ── Input system ── */
        .w-input-group { display: flex; flex-direction: column; gap: 6px; }
        .w-label {
          font-size: 0.83rem;
          font-weight: 600;
          color: #374151;
          letter-spacing: -0.01em;
        }
        .w-input {
          width: 100%;
          height: 48px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: #f8faff;
          font-size: 0.95rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #0f172a;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .w-input::placeholder { color: #9ca3af; }
        .w-input:hover:not(:focus) { border-color: #c7d2fe; background: #f0f2ff; }
        .w-input:focus {
          border-color: #3b2ee8;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(59,46,232,0.09);
        }
        .w-input-error { border-color: #f87171 !important; }
        .w-input-error:focus { box-shadow: 0 0 0 4px rgba(239,68,68,0.08) !important; }

        /* ── Primary button ── */
        .w-btn {
          width: 100%;
          height: 50px;
          border-radius: 13px;
          background: linear-gradient(135deg, #2414c4 0%, #3b2ee8 100%);
          color: #fff;
          font-size: 0.97rem;
          font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
          border: none;
          cursor: pointer;
          letter-spacing: -0.01em;
          transition: opacity 0.18s, transform 0.14s, box-shadow 0.18s;
          box-shadow: 0 4px 16px rgba(59,46,232,0.32);
          position: relative;
          overflow: hidden;
        }
        .w-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.12) 100%);
          opacity: 0;
          transition: opacity 0.18s;
        }
        .w-btn:hover:not(:disabled)::after { opacity: 1; }
        .w-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(59,46,232,0.38);
        }
        .w-btn:active:not(:disabled) {
          transform: translateY(1px) scale(0.98);
          box-shadow: 0 2px 8px rgba(59,46,232,0.22);
        }
        .w-btn:disabled { opacity: 0.42; cursor: not-allowed; box-shadow: none; }

        /* ── Link button ── */
        .w-link {
          background: none; border: none; padding: 0;
          color: #3b2ee8; font-weight: 700;
          font-size: inherit; font-family: inherit;
          cursor: pointer;
          transition: color 0.15s;
          text-decoration: none;
        }
        .w-link:hover { color: #2414c4; text-decoration: underline; }
        .w-link:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Error / success banners ── */
        .w-error {
          display: flex; align-items: flex-start; gap: 9px;
          padding: 11px 13px; border-radius: 11px;
          background: #fff5f5; border: 1px solid #fecaca;
          color: #dc2626; font-size: 0.85rem; font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .w-success {
          display: flex; align-items: center; gap: 9px;
          padding: 11px 13px; border-radius: 11px;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          color: #16a34a; font-size: 0.85rem; font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Eye toggle ── */
        .eye-btn {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; padding: 6px;
          cursor: pointer; color: #94a3b8;
          transition: color 0.14s; border-radius: 8px;
          -webkit-tap-highlight-color: transparent;
        }
        .eye-btn:hover { color: #475569; }

        /* ── Strength bar ── */
        .strength-bar { height: 4px; flex: 1; border-radius: 99px; transition: background 0.3s; }

        /* ── OTP boxes ── */
        .otp-box {
          width: 52px; height: 60px; border-radius: 14px;
          border: 1.5px solid #e2e8f0; background: #f8faff;
          text-align: center; font-size: 1.5rem; font-weight: 800;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #0f172a; outline: none; caret-color: transparent;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
          -webkit-tap-highlight-color: transparent;
        }
        .otp-box:focus { border-color: #3b2ee8; background: #fff; box-shadow: 0 0 0 4px rgba(59,46,232,0.1); }
        .otp-box.filled { border-color: #3b2ee8; background: #eef0ff; color: #3b2ee8; }
        .otp-box:disabled { opacity: 0.45; cursor: not-allowed; }

        @media (max-width: 899px) {
          .otp-box { width: 46px; height: 56px; }
        }

        /* ── Divider ── */
        .w-divider {
          display: flex; align-items: center; gap: 12px;
          color: #cbd5e1; font-size: 0.8rem; font-weight: 600;
        }
        .w-divider::before, .w-divider::after {
          content: ''; flex: 1; height: 1px; background: #f1f5f9;
        }

        /* ── Shake animation ── */
        @keyframes authShake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        .auth-shake { animation: authShake 0.42s cubic-bezier(0.36,0.07,0.19,0.97) both; }

        /* ── Loading bar ── */
        .w-loading-bar {
          height: 3px; width: 100%; overflow: hidden;
          border-radius: 99px; background: #e0e7ff;
        }
        .w-loading-bar-inner {
          height: 100%; width: 45%; border-radius: 99px;
          background: linear-gradient(90deg, #3b2ee8, #818cf8);
          animation: pulse 1.4s ease-in-out infinite;
        }

        /* ── Resend btn ── */
        .resend-btn {
          background: none; border: none; padding: 0;
          color: #3b2ee8; font-weight: 700; font-size: 0.875rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer; display: flex; align-items: center; gap: 5px;
          transition: color 0.15s;
        }
        .resend-btn:hover { color: #2414c4; text-decoration: underline; }
        .resend-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <main className="auth-shell auth-font">
        <div className="auth-card">

          {/* ════ LEFT GRADIENT PANEL ════ */}
          <div className="auth-left">
            {/* Blobs */}
            <div className="blob" style={{ width: 320, height: 320, top: -80, left: -80, background: 'radial-gradient(circle, rgba(110,150,255,0.5) 0%, transparent 70%)', animation: 'blob1 11s ease-in-out infinite' }} />
            <div className="blob" style={{ width: 280, height: 280, bottom: -60, right: -60, background: 'radial-gradient(circle, rgba(60,210,230,0.35) 0%, transparent 70%)', animation: 'blob2 14s ease-in-out infinite' }} />
            <div className="blob" style={{ width: 200, height: 200, top: '45%', left: '55%', background: 'radial-gradient(circle, rgba(160,90,255,0.3) 0%, transparent 70%)', animation: 'blob3 9s ease-in-out infinite 2s' }} />

            {/* Content */}
            <div key={view} style={{ animation: 'leftFadeIn 0.55s cubic-bezier(0.16,1,0.3,1) both', position: 'relative', zIndex: 1 }}>
              <span className="left-tag">{left.tag}</span>
              <h1 className="left-headline">{left.title}</h1>
              <p className="left-sub">{left.sub}</p>

              <div className="left-features">
                {[
                  'Lab Reports',
                  'Patient Records',
                  'Secure & HIPAA',
                  'Real-time Sync',
                ].map((label) => (
                  <span key={label} className="left-feature-pill">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom brand */}
            <div className="left-bottom" style={{ position: 'relative', zIndex: 1 }}>
              <p className="left-brand">© {new Date().getFullYear()} Globiz Patholab</p>
            </div>
          </div>

          {/* ════ RIGHT FORM PANEL ════ */}
          <div className="auth-right">

            {/* Mobile-only gradient header */}
            <div
              key={`mob-${view}`}
              className="mobile-header"
              style={{
                minHeight: 220,
                padding: '56px 28px 52px',
                animation: 'mobileHeaderIn 0.45s cubic-bezier(0.16,1,0.3,1) both',
              }}
            >
              <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                {mobileTitle}
              </h1>
              <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500, margin: 0 }}>
                {mobileSub}
              </p>
            </div>

            {/* Shared form content area */}
            <div className="form-content-wrap">
              {/* Desktop heading */}
              <div style={{ marginBottom: 28 }} className="desktop-heading">
                <p className="form-sub" style={{ marginBottom: 4, fontSize: '0.8rem', fontWeight: 700, color: '#6366f1', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {view === 'login' ? 'Sign In' : view === 'register' ? 'Create Account' : 'Verify Email'}
                </p>
                <h2 className="form-title">
                  {view === 'login' ? 'Get Started Now' :
                   view === 'register' ? 'Create Your Account' :
                   'Enter Your Code'}
                </h2>
                {(view === 'login' || view === 'register') && (
                  <p className="form-sub">
                    {view === 'login' ? 'Please sign in to your account to continue.' :
                     'Fill in your details to create a new account.'}
                  </p>
                )}
              </div>

              {/* Form views */}
              <ViewTransition id="login" activeId={view}>
                <LoginCard
                  onOtpRequired={(uid, em) => { setOtpContext({ userId: uid, email: em, purpose: 'LOGIN' }); setView('otp'); }}
                  onLoginSuccess={handleVerified}
                  onSwitchToRegister={() => setView('register')}
                />
              </ViewTransition>

              <ViewTransition id="register" activeId={view}>
                <RegisterCard
                  onOtpRequired={(uid, em) => { setOtpContext({ userId: uid, email: em, purpose: 'REGISTER' }); setView('otp'); }}
                  onSwitchToLogin={() => setView('login')}
                />
              </ViewTransition>

              <ViewTransition id="otp" activeId={view}>
                {otpContext && (
                  <OtpVerificationCard
                    userId={otpContext.userId}
                    email={otpContext.email}
                    purpose={otpContext.purpose}
                    onVerified={handleVerified}
                    onBack={handleBackFromOtp}
                  />
                )}
              </ViewTransition>

              {/* Footer */}
              <p style={{ marginTop: 28, textAlign: 'center', fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 600, letterSpacing: '0.02em' }}>
                © {new Date().getFullYear()} Globiz Patholab · All rights reserved
              </p>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
