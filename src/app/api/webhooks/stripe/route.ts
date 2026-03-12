import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminSupabase } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const stripe = getStripe();
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createAdminSupabase();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        await admin
          .from('profiles')
          .update({
            plan: 'premium',
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
          })
          .eq('id', userId);

        console.log(`[Stripe] User ${userId} upgraded to premium`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        // Map Stripe status to our subscription_status
        const mappedStatus = status === 'active' ? 'active'
          : status === 'past_due' ? 'past_due'
          : status === 'canceled' ? 'canceled'
          : status;

        const plan = status === 'active' || status === 'past_due' ? 'premium' : 'free';

        await admin
          .from('profiles')
          .update({
            plan,
            subscription_status: mappedStatus,
          })
          .eq('stripe_customer_id', customerId);

        console.log(`[Stripe] Customer ${customerId} subscription updated: ${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        await admin
          .from('profiles')
          .update({
            plan: 'free',
            subscription_status: 'inactive',
          })
          .eq('stripe_customer_id', customerId);

        console.log(`[Stripe] Customer ${customerId} subscription deleted`);
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    console.error(`[Stripe] Error handling ${event.type}:`, err);
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
