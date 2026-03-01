export const STRIPE_PLANS = {
    premium: {
        name: 'Voyageur Premium',
        mode: 'subscription' as const,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || '',
        amount: 500, // 5.00 CAD in cents
        currency: 'cad',
        interval: 'month' as const,
    },
    guide: {
        name: 'Guide IA',
        mode: 'payment' as const,
        priceId: process.env.NEXT_PUBLIC_STRIPE_GUIDE_PRICE_ID || '',
        amount: 1000, // 10.00 CAD in cents
        currency: 'cad',
    },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;
