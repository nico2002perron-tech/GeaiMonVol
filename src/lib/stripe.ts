import Stripe from 'stripe';
import { createAdminSupabase } from '@/lib/supabase/admin';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
    stripeInstance = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
  }
  return stripeInstance;
}

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  const admin = createAdminSupabase();

  // Check if user already has a Stripe customer ID
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create new Stripe customer
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  // Save to profile
  await admin
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer.id;
}
