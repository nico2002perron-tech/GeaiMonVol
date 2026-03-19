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
    | 'watchlist'
    | 'priceInsights'
    | 'allDeals'
    | 'aiPackAnalysis';

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
        priceInsights: false,
        allDeals: false,
        aiPackAnalysis: false,
        watchlistMax: 3,
        guideMax: 1,
        maxTripDays: 7,
        maxTokens: 16384,
        dealsPerDestination: 3,
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
        priceInsights: true,
        allDeals: true,
        aiPackAnalysis: true,
        watchlistMax: Infinity,
        guideMax: Infinity,
        maxTripDays: 21,
        maxTokens: 32768,
        dealsPerDestination: Infinity,
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
export const FREE_DEALS_PER_DESTINATION = TIERS.free.dealsPerDestination;

export const PREMIUM_FEATURES = [
    { key: 'priceInsights' as const, icon: '📊', label: 'Analyse de prix complète', desc: 'Historique, tendance, meilleure semaine et mois le moins cher' },
    { key: 'allDeals' as const, icon: '✈️', label: 'Tous les deals', desc: 'Accès à tous les deals trouvés, pas de limite par destination' },
    { key: 'aiPackAnalysis' as const, icon: '🧠', label: 'Analyse IA tout-inclus', desc: 'L\'IA analyse tes packs vol + hôtel pour trouver le meilleur rapport qualité-prix' },
    { key: 'expeditions' as const, icon: '🗺️', label: 'Packs Expédition', desc: 'Itinéraires multi-étapes avec hébergements curated' },
    { key: 'inbox' as const, icon: '🔔', label: 'Boîte de réception', desc: 'Alertes personnalisées selon tes préférences' },
    { key: 'advancedAlerts' as const, icon: '⚡', label: 'Alertes prioritaires', desc: 'Reçois les deals en premier, avant les membres gratuits' },
    { key: 'aiGuides' as const, icon: '🤖', label: 'Guides IA illimités', desc: 'Guides de voyage personnalisés pour le monde entier' },
    { key: 'watchlist' as const, icon: '👁️', label: 'Watchlist illimitée', desc: 'Surveille autant de destinations que tu veux' },
];
