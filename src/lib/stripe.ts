import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
    if (!_stripe) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            throw new Error("STRIPE_SECRET_KEY environment variable is required");
        }
        _stripe = new Stripe(key, {
            apiVersion: "2025-01-27.acacia" as any,
            typescript: true,
        });
    }
    return _stripe;
}

// Lazy getter — only instantiated on first access at runtime
export const stripe = new Proxy({} as Stripe, {
    get(_target, prop) {
        return (getStripe() as any)[prop];
    },
});
