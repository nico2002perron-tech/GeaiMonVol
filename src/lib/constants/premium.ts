export const PREMIUM_PRICE = 4.99;

// ── Feature access by tier ──
// Free: deals, tout-inclus, destination pages, basic alerts
// Premium: + inbox, advanced alerts, expeditions, AI guides, unlimited watchlist

export type PremiumFeature =
    | 'deals'
    | 'toutInclus'
    | 'destinationPages'
    | 'basicAlerts'
    | 'inbox'
    | 'advancedAlerts'
    | 'expeditions'
    | 'aiGuides'
    | 'watchlist';

export const TIERS = {
    free: {
        deals: true,
        toutInclus: true,
        destinationPages: true,
        basicAlerts: true,
        inbox: false,
        advancedAlerts: false,
        expeditions: false,
        aiGuides: false,
        watchlistMax: 3,
        guideMax: 1,
        maxTripDays: 7,
        maxTokens: 16384,
    },
    premium: {
        deals: true,
        toutInclus: true,
        destinationPages: true,
        basicAlerts: true,
        inbox: true,
        advancedAlerts: true,
        expeditions: true,
        aiGuides: true,
        watchlistMax: Infinity,
        guideMax: Infinity,
        maxTripDays: 21,
        maxTokens: 32768,
    },
} as const;

export type TierName = keyof typeof TIERS;

// Keep backwards-compatible exports
export const FREE_WATCHLIST_MAX = TIERS.free.watchlistMax;
export const FREE_GUIDE_MAX = TIERS.free.guideMax;
export const FREE_MAX_TRIP_DAYS = TIERS.free.maxTripDays;
export const PREMIUM_MAX_TRIP_DAYS = TIERS.premium.maxTripDays;
export const FREE_MAX_TOKENS = TIERS.free.maxTokens;
export const PREMIUM_MAX_TOKENS = TIERS.premium.maxTokens;

// Feature descriptions for upsell UI
export const PREMIUM_FEATURES = [
    { key: 'expeditions' as const, icon: '🗺️', label: 'Packs Expédition', desc: 'Itinéraires multi-étapes avec hébergements curated' },
    { key: 'inbox' as const, icon: '🔔', label: 'Boîte de réception', desc: 'Alertes personnalisées selon tes préférences' },
    { key: 'advancedAlerts' as const, icon: '⚡', label: 'Alertes avancées', desc: 'Matching intelligent par destination, budget et mois' },
    { key: 'aiGuides' as const, icon: '🤖', label: 'Guides IA illimités', desc: 'Guides de voyage personnalisés pour le monde entier' },
    { key: 'watchlist' as const, icon: '👁️', label: 'Watchlist illimitée', desc: 'Surveille autant de destinations que tu veux' },
];
