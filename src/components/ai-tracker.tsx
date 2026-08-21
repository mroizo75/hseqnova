'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { detectAIReferral, trackAIReferral, trackAIPageView } from '@/lib/ai-analytics';

export function AITracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Detect and track AI referral on first load
    const aiSource = detectAIReferral();
    if (aiSource) {
      trackAIReferral(aiSource, pathname);
    }
  }, []); // Only run once on mount

  useEffect(() => {
    // Track page views for AI sessions
    trackAIPageView(pathname);
  }, [pathname]); // Run on every route change

  return null; // This component doesn't render anything
}

