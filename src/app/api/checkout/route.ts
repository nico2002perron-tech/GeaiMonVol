import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getStripe, getOrCreateStripeCustomer } from '@/lib/stripe';

export async function POST() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;
    if (!priceId) {
      return NextResponse.json({ error: 'Configuration Stripe manquante.' }, { status: 500 });
    }

    const customerId = await getOrCreateStripeCustomer(user.id, user.email!);
    const stripe = getStripe();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/pricing?success=true`,
      cancel_url: `${siteUrl}/pricing?canceled=true`,
      metadata: { supabase_user_id: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Erreur lors de la création du checkout.' }, { status: 500 });
  }
}
