'use client';

import React from 'react';
import { LogOut, User, CheckCircle } from 'lucide-react';

interface AuthUser {
  id: string;
  email: string;
  isVerified: boolean;
}

export default function Dashboard({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blob-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(30px, -30px) scale(1.05); }
          66%      { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes blob-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-30px, 30px) scale(1.08); }
        }

        .dash-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }

        .dash-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(80px);
          opacity: 0.5;
          z-index: 1;
        }

        .dash-card {
          position: relative;
          z-index: 10;
          background: #ffffff;
          border-radius: 24px;
          padding: 48px 40px;
          max-width: 440px;
          width: 100%;
          text-align: center;
          box-shadow: 
            0 4px 6px -1px rgba(0, 0, 0, 0.05),
            0 10px 15px -3px rgba(0, 0, 0, 0.05),
            0 20px 25px -5px rgba(59, 46, 232, 0.03);
          border: 1px solid #e2e8f0;
          animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .dash-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #eef0ff 0%, #e0e7ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b2ee8;
          margin: 0 auto 24px;
          box-shadow: 0 4px 12px rgba(59, 46, 232, 0.12);
        }

        .dash-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0 0 8px;
        }

        .dash-sub {
          font-size: 0.9rem;
          color: #64748b;
          font-weight: 500;
          line-height: 1.5;
          margin: 0 0 28px;
        }

        .dash-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 0 0 24px;
        }

        .dash-user-info {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 99px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 28px;
        }

        .dash-status {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #10b981;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          justify-content: center;
          margin-top: 4px;
        }

        .dash-btn-logout {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 48px;
          width: 100%;
          border-radius: 12px;
          background: #3b2ee8;
          color: white;
          border: none;
          font-size: 0.9rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          box-shadow: 0 4px 12px rgba(59, 46, 232, 0.2);
        }

        .dash-btn-logout:hover {
          background: #2518b5;
          transform: translateY(-1px);
        }

        .dash-btn-logout:active {
          transform: translateY(1px);
        }

        .dash-footer {
          position: relative;
          z-index: 10;
          margin-top: 24px;
          font-size: 0.72rem;
          color: #94a3b8;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        @media (max-width: 480px) {
          .dash-card {
            padding: 36px 24px;
          }
        }
      `}</style>

      <div className="dash-page">
        {/* Background blobs */}
        <div className="dash-blob" style={{ width: 400, height: 400, top: -100, left: -100, background: 'radial-gradient(circle, #e0e7ff, #c7d2fe)', animation: 'blob-a 12s ease-in-out infinite' }} />
        <div className="dash-blob" style={{ width: 350, height: 350, bottom: -80, right: -80, background: 'radial-gradient(circle, #dbeafe, #bfdbfe)', animation: 'blob-b 15s ease-in-out infinite' }} />

        <div className="dash-card">
          {/* Avatar Icon */}
          <div className="dash-avatar">
            <User size={28} />
          </div>

          {/* Heading */}
          <h1 className="dash-title">Welcome back!</h1>
          <p className="dash-sub">
            You have successfully logged in to Globiz Patholab.
          </p>

          <div className="dash-divider" />

          {/* User badge */}
          <div className="dash-user-info">
            <User size={14} style={{ color: '#6366f1' }} />
            <span>{user.email}</span>
          </div>

          <div className="dash-status">
            <CheckCircle size={12} fill="#10b981" stroke="#ffffff" />
            <span>Verified Account</span>
          </div>

          <div style={{ marginTop: 28 }}>
            {/* Sign out */}
            <button id="dashboard-signout-btn" onClick={onLogout} className="dash-btn-logout">
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>

        <p className="dash-footer">© {new Date().getFullYear()} Globiz Patholab · All rights reserved</p>
      </div>
    </>
  );
}
