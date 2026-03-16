'use client';

import { useAuth } from '@/lib/auth/AuthProvider';
import { TIERS } from '@/lib/constants/premium';
import type { PremiumFeature, TierName } from '@/lib/constants/premium';

interface PremiumGateResult {
    hasAccess: boolean;
    showUpsell: boolean;
    tier: TierName;
    isPremium: boolean;
    loading: boolean;
}

/**
 * Check if the current user has access to a premium feature.
 * Returns { hasAccess, showUpsell } for easy gating.
 *
 * Usage:
 *   const { hasAccess, showUpsell } = usePremiumGate('expeditions');
 *   if (showUpsell) return <PremiumUpsell feature="expeditions" />;
 */
export function usePremiumGate(feature: PremiumFeature): PremiumGateResult {
    const { profile, loading } = useAuth();
    const tier: TierName = profile?.plan === 'premium' ? 'premium' : 'free';
    const isPremium = tier === 'premium';

    // Check if the feature exists in the tier config
    const tierConfig = TIERS[tier];
    const hasAccess = feature === 'watchlist'
        ? tierConfig.watchlistMax > 0
        : !!(tierConfig as Record<string, any>)[feature];

    return {
        hasAccess,
        showUpsell: !hasAccess && !loading,
        tier,
        isPremium,
        loading,
    };
}
