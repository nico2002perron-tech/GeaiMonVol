import Stripe from "stripe";

function getStripeClient() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    return new Stripe(key, {
        apiVersion: "2025-01-27.acacia" as any,
        typescript: true,
    });
}

export const stripe = getStripeClient();
