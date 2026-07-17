'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const tFade = setTimeout(() => setVisible(false), 2500);
    const tDone = setTimeout(() => onDone(), 2900);
    return () => { clearTimeout(tFade); clearTimeout(tDone); };
  }, []); // Empty deps — runs once, never re-triggers

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #060440 0%, #0e0672 22%, #1e10a8 48%, #2a1ed4 70%, #1628a8 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        overflow: 'hidden',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <style>{`
        @keyframes sp_ring {
          0%   { transform: scale(1);   opacity: 0.35; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes sp_logoIn {
          0%   { opacity: 0; transform: translateY(16px) scale(0.92); }
          100% { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes sp_textIn {
          0%   { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes sp_dot {
          0%, 80%, 100% { transform: translateY(0);    opacity: 0.3; }
          40%            { transform: translateY(-8px); opacity: 1;   }
        }
        @keyframes sp_vignette {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }

        .sp_logoIn   { animation: sp_logoIn 0.65s cubic-bezier(0.16,1,0.3,1) 0.1s  both; }
        .sp_welcomeIn{ animation: sp_textIn  0.5s  cubic-bezier(0.16,1,0.3,1) 0.35s both; }
        .sp_nameIn   { animation: sp_textIn  0.55s cubic-bezier(0.16,1,0.3,1) 0.48s both; }
        .sp_lineIn   { animation: sp_textIn  0.5s  cubic-bezier(0.16,1,0.3,1) 0.60s both; }
        .sp_tagIn    { animation: sp_textIn  0.5s  cubic-bezier(0.16,1,0.3,1) 0.72s both; }
        .sp_dotsIn   { animation: sp_textIn  0.5s  cubic-bezier(0.16,1,0.3,1) 0.90s both; }
      `}</style>

      {/* Subtle radial vignette overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(0,0,20,0.55) 100%)',
        animation: 'sp_vignette 1s ease both',
      }}/>

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center',
        padding: '0 48px',
      }}>

        {/* ── Logo ── */}
        <div className="sp_logoIn" style={{
          marginBottom: 36,
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Single pulsing ring */}
          <div style={{
            position: 'absolute',
            width: 108, height: 108,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.28)',
            animation: 'sp_ring 2.8s ease-out 0.5s infinite',
          }}/>

          {/* Logo circle — solid brand color, no glass effect */}
          <div style={{
            width: 80, height: 80,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            border: '1.5px solid rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(80,60,220,0.5)',
          }}>
            {/* Flask + Leaf SVG — traced from the brand logo, white strokes */}
            <svg
              width="44" height="52"
              viewBox="0 0 44 52"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Stopper cap at top */}
              <rect x="13" y="0" width="18" height="7" rx="3.5" fill="white"/>
              {/* Slot inside stopper */}
              <rect x="18.5" y="2" width="7" height="3" rx="1.5" fill="rgba(14,6,114,0.4)"/>

              {/* Flask neck + spiral body — single continuous stroke path */}
              {/* Neck goes down, curves right, spirals around to form circle */}
              <path
                d="
                  M 19 7
                  L 19 14
                  C 19 22, 8 24, 8 34
                  A 14 14 0 1 0 36 34
                  C 36 26, 28 22, 25 22
                  C 22 22, 19 24, 19 28
                "
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Leaf inside the circle */}
              <path
                d="M 18 36 C 18 30, 26 28, 28 34 C 26 38, 18 40, 18 36 Z"
                fill="white"
              />
            </svg>
          </div>
        </div>

        {/* "Welcome to" */}
        <p className="sp_welcomeIn" style={{
          margin: 0,
          fontSize: '0.82rem',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.65)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          Welcome to
        </p>

        {/* "Patholab.Cloud" — 600 weight, not heavy */}
        <h1 className="sp_nameIn" style={{
          margin: '11px 0 0',
          fontSize: 'clamp(2.1rem, 9vw, 3rem)',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          lineHeight: 1.0,
          color: 'white',
        }}>
          Patholab.Cloud
        </h1>

        {/* Thin divider */}
        <div className="sp_lineIn" style={{
          width: 48,
          height: 1,
          background: 'rgba(255,255,255,0.3)',
          margin: '20px auto 0',
        }}/>

        {/* Tagline */}
        <p className="sp_tagIn" style={{
          margin: '13px 0 0',
          fontSize: '0.72rem',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          Diagnostic Excellence
        </p>

        {/* Loading dots */}
        <div className="sp_dotsIn" style={{
          display: 'flex', gap: 7, marginTop: 54,
          alignItems: 'center', justifyContent: 'center',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.6)',
              animation: `sp_dot 1.3s ease-in-out ${i * 0.21}s infinite`,
            }}/>
          ))}
        </div>
      </div>
    </div>
  );
}
