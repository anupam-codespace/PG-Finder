'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthPage from '@/components/auth/AuthPage';
import SplashScreen from '@/components/SplashScreen';

export default function Home() {
  const [splashDone, setSplashDone] = useState(false);

  const handleDone = useCallback(() => {
    setSplashDone(true);
  }, []);

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleDone} />}
      <AuthPage />
    </>
  );
}
