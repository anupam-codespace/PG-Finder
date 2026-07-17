'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600);
    const t2 = setTimeout(() => setPhase('exit'), 2500);
    const t3 = setTimeout(() => onDone(), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

        @keyframes splashBlob1 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(60px,-70px) scale(1.18); }
          70%      { transform: translate(-30px,45px) scale(0.92); }
        }
        @keyframes splashBlob2 {
          0%,100% { transform: translate(0,0) scale(1); }
          35%      { transform: translate(-70px,40px) scale(1.12); }
          65%      { transform: translate(45px,-30px) scale(1.05); }
        }
        @keyframes splashBlob3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(35px,55px) scale(1.15); }
        }
        @keyframes splashContentIn {
          from { opacity: 0; transform: translateY(32px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes splashContentOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-20px) scale(1.02); }
        }
        @keyframes splashLogoIn {
          from { opacity: 0; transform: translateY(20px) scale(0.88); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes splashWelcomeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 0.82; transform: translateY(0); }
        }
        @keyframes splashNameIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashTaglineIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 0.65; transform: translateY(0); }
        }
        @keyframes splashDividerIn {
          from { width: 0; opacity: 0; }
          to   { width: 56px; opacity: 0.5; }
        }
        @keyframes splashDotsIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.38; }
          40%            { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes ringPulse {
          0%   { transform: scale(1); opacity: 0.22; }
          100% { transform: scale(2.0); opacity: 0; }
        }
        @keyframes shimmerSweep {
          0%   { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.6); }
        }
        @keyframes gridFloat {
          0%,100% { opacity: 0.025; }
          50%      { opacity: 0.05; }
        }

        .splash-enter { animation: splashContentIn 0.65s cubic-bezier(0.16,1,0.3,1) both; }
        .splash-exit  { animation: splashContentOut 0.3s cubic-bezier(0.4,0,1,1) both; }

        .sp-logo    { animation: splashLogoIn    0.55s cubic-bezier(0.16,1,0.3,1) 0.10s both; }
        .sp-welcome { animation: splashWelcomeIn 0.50s cubic-bezier(0.16,1,0.3,1) 0.30s both; }
        .sp-name    { animation: splashNameIn    0.60s cubic-bezier(0.16,1,0.3,1) 0.44s both; }
        .sp-divider { animation: splashDividerIn 0.55s cubic-bezier(0.16,1,0.3,1) 0.60s both; }
        .sp-tagline { animation: splashTaglineIn 0.50s cubic-bezier(0.16,1,0.3,1) 0.72s both; }
        .sp-dots    { animation: splashDotsIn    0.50s cubic-bezier(0.16,1,0.3,1) 0.92s both; }
        .sp-footer  { animation: splashTaglineIn 0.50s cubic-bezier(0.16,1,0.3,1) 1.10s both; }

        .sp-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.6) 40%,
            rgba(255,255,255,0.9) 50%,
            rgba(255,255,255,0.6) 60%,
            rgba(255,255,255,0) 100%
          );
          background-size: 300% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shimmerSweep 2.8s ease-in-out 0.9s infinite;
        }
      `}</style>

      <div
        className={phase === 'exit' ? 'splash-exit' : 'splash-enter'}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(145deg, #0a0560 0%, #100784 18%, #2414c4 42%, #3b2ee8 62%, #1d39bd 80%, #0a4abf 100%)',
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          overflow: 'hidden',
        }}
      >
        {/* ── Animated Blobs ── */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
          <div style={{
            position:'absolute', top:'-20%', left:'-15%', width:'70%', height:'70%',
            background:'radial-gradient(circle, rgba(123,97,255,0.35) 0%, transparent 70%)',
            borderRadius:'50%', animation:'splashBlob1 8s ease-in-out infinite', filter:'blur(2px)',
          }}/>
          <div style={{
            position:'absolute', bottom:'-20%', right:'-15%', width:'65%', height:'65%',
            background:'radial-gradient(circle, rgba(14,165,233,0.25) 0%, transparent 70%)',
            borderRadius:'50%', animation:'splashBlob2 10s ease-in-out infinite', filter:'blur(2px)',
          }}/>
          <div style={{
            position:'absolute', top:'30%', left:'20%', width:'50%', height:'50%',
            background:'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            borderRadius:'50%', animation:'splashBlob3 12s ease-in-out infinite',
          }}/>
          {/* Stars */}
          {[
            { top:'9%',  left:'7%',  s:3, d:'0.0s', dur:2.2 },
            { top:'17%', left:'83%', s:2, d:'0.4s', dur:2.8 },
            { top:'73%', left:'11%', s:2, d:'0.8s', dur:3.1 },
            { top:'81%', left:'79%', s:3, d:'1.2s', dur:2.5 },
            { top:'36%', left:'93%', s:2, d:'0.6s', dur:2.0 },
            { top:'55%', left:'4%',  s:2, d:'1.0s', dur:3.4 },
            { top:'91%', left:'46%', s:2, d:'0.2s', dur:2.7 },
            { top:'5%',  left:'56%', s:2, d:'1.5s', dur:2.3 },
          ].map((p, i) => (
            <div key={i} style={{
              position:'absolute', top:p.top, left:p.left,
              width:p.s, height:p.s, borderRadius:'50%', background:'white',
              animation:`starTwinkle ${p.dur}s ease-in-out ${p.d} infinite`,
            }}/>
          ))}
          {/* Subtle grid */}
          <div style={{
            position:'absolute', inset:0,
            backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize:'44px 44px',
            animation:'gridFloat 6s ease-in-out infinite',
          }}/>
        </div>

        {/* ── Main Content ── */}
        <div style={{
          position:'relative', zIndex:10,
          display:'flex', flexDirection:'column',
          alignItems:'center', textAlign:'center',
          padding:'0 32px',
        }}>
          {/* Logo mark with pulsing rings */}
          <div className="sp-logo" style={{ marginBottom:36, position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{
              position:'absolute', width:130, height:130, borderRadius:'50%',
              border:'1px solid rgba(255,255,255,0.18)',
              animation:'ringPulse 2.4s ease-out 0.5s infinite',
            }}/>
            <div style={{
              position:'absolute', width:105, height:105, borderRadius:'50%',
              border:'1px solid rgba(255,255,255,0.22)',
              animation:'ringPulse 2.4s ease-out 0.9s infinite',
            }}/>
            <div style={{
              width:80, height:80, borderRadius:'50%',
              background:'rgba(255,255,255,0.11)',
              border:'1.5px solid rgba(255,255,255,0.28)',
              backdropFilter:'blur(16px)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 48px rgba(123,97,255,0.55), 0 8px 32px rgba(0,0,0,0.35)',
            }}>
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                <circle cx="19" cy="19" r="17.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                <rect x="15" y="6" width="8" height="12" rx="4" fill="rgba(255,255,255,0.92)"/>
                <rect x="17" y="17" width="4" height="8" rx="1" fill="rgba(255,255,255,0.85)"/>
                <rect x="11" y="25" width="16" height="2.5" rx="1.25" fill="rgba(255,255,255,0.92)"/>
                <circle cx="19" cy="12" r="3" fill="rgba(124,240,170,0.95)"/>
                <rect x="13" y="28.5" width="4" height="3.5" rx="1" fill="rgba(255,255,255,0.7)"/>
                <rect x="21" y="28.5" width="4" height="3.5" rx="1" fill="rgba(255,255,255,0.7)"/>
              </svg>
            </div>
          </div>

          {/* "Welcome to" */}
          <p className="sp-welcome" style={{
            margin: 0, fontSize:'0.95rem', fontWeight:500,
            color:'rgba(255,255,255,0.82)',
            letterSpacing:'0.14em', textTransform:'uppercase',
          }}>
            Welcome to
          </p>

          {/* "Patholab.Cloud" with shimmer */}
          <h1 className="sp-name" style={{
            margin:'10px 0 0', fontSize:'clamp(2.4rem, 9vw, 3.4rem)',
            fontWeight:900, letterSpacing:'-0.02em', lineHeight:1.05,
            color:'white', position:'relative',
          }}>
            <span className="sp-shimmer" aria-hidden="true" style={{
              position:'absolute', inset:0, color:'transparent',
              fontWeight:'inherit', fontSize:'inherit', letterSpacing:'inherit', lineHeight:'inherit',
            }}>Patholab.Cloud</span>
            Patholab.Cloud
          </h1>

          {/* Divider */}
          <div className="sp-divider" style={{
            height:1.5, margin:'22px auto 0',
            background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
            borderRadius:2,
          }}/>

          {/* Tagline */}
          <p className="sp-tagline" style={{
            margin:'14px 0 0', fontSize:'0.8rem', fontWeight:400,
            color:'rgba(255,255,255,0.6)',
            letterSpacing:'0.1em', textTransform:'uppercase',
          }}>
            Diagnostic Excellence
          </p>

          {/* Loading dots */}
          <div className="sp-dots" style={{
            display:'flex', gap:8, marginTop:52,
            alignItems:'center', justifyContent:'center',
          }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width:7, height:7, borderRadius:'50%',
                background:'rgba(255,255,255,0.72)',
                animation:`splashDot 1.2s ease-in-out ${i * 0.18}s infinite`,
              }}/>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sp-footer" style={{
          position:'absolute', bottom:32, left:0, right:0,
          textAlign:'center', fontSize:'0.68rem', fontWeight:500,
          color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em', textTransform:'uppercase',
        }}>
          Powered by Globiz
        </div>
      </div>
    </>
  );
}
