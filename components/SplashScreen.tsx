'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [isNative, setIsNative] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Check if running on a native mobile platform (Capacitor)
    const checkNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform();
    setIsNative(checkNative);

    if (!checkNative) {
      // If web, finish immediately to skip splash screen
      onDone();
      return;
    }

    // Keep splash screen visible for 7 seconds on native apps
    const tFade = setTimeout(() => setVisible(false), 7000);
    const tDone = setTimeout(() => onDone(), 7400);

    return () => {
      clearTimeout(tFade);
      clearTimeout(tDone);
    };
  }, [onDone]);

  // If we've confirmed we are on web, don't render anything
  if (isNative === false) {
    return null;
  }

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
        background: '#060440', // Flat, classic solid dark blue background
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        overflow: 'hidden',
        WebkitFontSmoothing: 'antialiased',
        // Hide on web instantly even before JS hydration if possible (safeguard)
        display: typeof window !== 'undefined' && !(window as any).Capacitor?.isNativePlatform() ? 'none' : 'flex',
      }}
    >
      <style>{`
        @keyframes sp_fadeIn {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes sp_dot {
          0%, 80%, 100% { transform: translateY(0);    opacity: 0.3; }
          40%            { transform: translateY(-6px); opacity: 1;   }
        }
        .sp_anim {
          animation: sp_fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* Subtle radial vignette overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(0,0,20,0.55) 100%)',
      }}/>

      {/* Content wrapper */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '0 40px',
      }}>

        {/* "Welcome to" text */}
        <p 
          className="sp_anim"
          style={{
            margin: 0,
            fontSize: '0.82rem',
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.65)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            animationDelay: '0.1s',
            lineHeight: 1,
          }}
        >
          Welcome to
        </p>

        {/* "Patholab.Cloud" title (Less bold, clean 500 weight) */}
        <h1 
          className="sp_anim"
          style={{
            margin: '14px 0 0',
            fontSize: 'clamp(2.1rem, 9vw, 2.9rem)',
            fontWeight: 500, // Clean, less bold, classic look
            letterSpacing: '-0.01em',
            color: '#ffffff',
            animationDelay: '0.22s',
            lineHeight: 1.0,
          }}
        >
          Patholab.Cloud
        </h1>

        {/* Clean, thin divider line */}
        <div 
          className="sp_anim"
          style={{
            width: 48,
            height: 1,
            background: 'rgba(255, 255, 255, 0.25)',
            margin: '22px auto 0',
            animationDelay: '0.35s',
          }}
        />

        {/* Tagline */}
        <p 
          className="sp_anim"
          style={{
            margin: '14px 0 0',
            fontSize: '0.72rem',
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.45)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            animationDelay: '0.48s',
            lineHeight: 1,
          }}
        >
          Diagnostic Excellence
        </p>

        {/* Loading Dots */}
        <div 
          className="sp_anim"
          style={{
            display: 'flex',
            gap: 6,
            marginTop: 48,
            alignItems: 'center',
            justifyContent: 'center',
            animationDelay: '0.6s',
          }}
        >
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.5)',
              animation: `sp_dot 1.3s ease-in-out ${i * 0.2}s infinite`,
            }}/>
          ))}
        </div>

      </div>
    </div>
  );
}
