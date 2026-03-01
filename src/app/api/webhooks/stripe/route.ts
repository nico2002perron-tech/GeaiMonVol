import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminSupabase } from '@/lib/supabase/admin';
import type Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    if (!webhookSecret) {
        console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured');
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error('[stripe-webhook] Signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = createAdminSupabase();

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.supabase_user_id;
                const plan = session.metadata?.plan;

                if (!userId) {
                    console.error('[stripe-webhook] No supabase_user_id in metadata');
                    break;
                }

                const updateData: Record<string, string> = {
                    stripe_customer_id: session.customer as string,
                };

                if (plan === 'premium') {
                    updateData.plan = 'premium';
                    updateData.subscription_status = 'active';
                } else if (plan === 'guide') {
                    updateData.plan = 'guide';
                }

                await supabase
                    .from('profiles')
                    .update(updateData)
                    .eq('id', userId);

                console.log(`[stripe-webhook] checkout.completed — user=${userId} plan=${plan}`);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                await supabase
                    .from('profiles')
                    .update({ subscription_status: subscription.status })
                    .eq('stripe_customer_id', customerId);

                console.log(`[stripe-webhook] subscription.updated — customer=${customerId} status=${subscription.status}`);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                await supabase
                    .from('profiles')
                    .update({
                        subscription_status: 'canceled',
                        plan: 'free',
                    })
                    .eq('stripe_customer_id', customerId);

                console.log(`[stripe-webhook] subscription.deleted — customer=${customerId}`);
                break;
            }

            default:
                console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
        }
    } catch (error: any) {
        console.error('[stripe-webhook] Processing error:', error.message);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
