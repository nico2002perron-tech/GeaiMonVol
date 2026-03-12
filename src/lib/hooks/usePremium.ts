'use client';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useState, useEffect } from 'react';
import { FREE_GUIDE_MAX, FREE_WATCHLIST_MAX } from '@/lib/constants/premium';

export function usePremium() {
  const { profile, loading: authLoading } = useAuth();
  const [guideCount, setGuideCount] = useState(0);
  const [countLoading, setCountLoading] = useState(true);

  const isPremium = profile?.plan === 'premium';

  useEffect(() => {
    if (!profile) {
      setCountLoading(false);
      return;
    }

    fetch('/api/guide/count')
      .then(res => res.json())
      .then(data => setGuideCount(data.count || 0))
      .catch(() => {})
      .finally(() => setCountLoading(false));
  }, [profile]);

  return {
    isPremium,
    plan: profile?.plan || 'free',
    canGenerateGuide: isPremium || guideCount < FREE_GUIDE_MAX,
    guidesRemaining: isPremium ? Infinity : Math.max(0, FREE_GUIDE_MAX - guideCount),
    guideCount,
    watchlistLimit: isPremium ? Infinity : FREE_WATCHLIST_MAX,
    loading: authLoading || countLoading,
  };
}
