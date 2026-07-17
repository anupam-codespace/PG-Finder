'use client';

import { useState, useCallback } from 'react';
import AuthPage from '@/components/auth/AuthPage';
import SplashScreen from '@/components/SplashScreen';

export default function Home() {
  const [splashDone, setSplashDone] = useState<boolean>(() => {
    // On server (SSR) always false. On client, skip if already shown this session.
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('splash_shown') === '1';
  });

  const handleDone = useCallback(() => {
    try { sessionStorage.setItem('splash_shown', '1'); } catch { /* ignore */ }
    setSplashDone(true);
  }, []);

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleDone} />}
      <AuthPage />
    </>
  );
}
