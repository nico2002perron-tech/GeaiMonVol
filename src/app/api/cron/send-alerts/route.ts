import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { sendDealAlert } from '@/lib/services/email';
import { calculateDiscount } from '@/lib/services/flights';

export const maxDuration = 60;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = await createServerSupabase();

        // Get users who want email notifications
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, email, full_name, plan, preferred_destinations, budget_max, email_notifications')
            .eq('email_notifications', true);

        if (usersError || !users) {
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        // Get latest prices (last 6 hours)
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
        const { data: prices, error: pricesError } = await supabase
            .from('price_history')
            .select('*')
            .gte('scanned_at', sixHoursAgo)
            .order('scanned_at', { ascending: false });

        if (pricesError || !prices || prices.length === 0) {
            return NextResponse.json({ message: 'No recent prices to alert on' });
        }

        // Get previous prices for comparison (6-12 hours ago)
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
        const { data: oldPrices } = await supabase
            .from('price_history')
            .select('destination, price')
            .gte('scanned_at', twelveHoursAgo)
            .lt('scanned_at', sixHoursAgo)
            .order('scanned_at', { ascending: false });

        // Build old price map
        const oldPriceMap: Record<string, number> = {};
        if (oldPrices) {
            for (const p of oldPrices) {
                if (!oldPriceMap[p.destination]) {
                    oldPriceMap[p.destination] = p.price;
                }
            }
        }

        // Deduplicate latest prices (keep cheapest per destination)
        const latestByDest: Record<string, any> = {};
        for (const p of prices) {
            if (!latestByDest[p.destination] || p.price < latestByDest[p.destination].price) {
                latestByDest[p.destination] = p;
            }
        }

        let emailsSent = 0;

        for (const user of users) {
            const userDeals: any[] = [];

            for (const [dest, price] of Object.entries(latestByDest)) {
                const p = price as any;
                const oldPrice = oldPriceMap[dest] || Math.round(p.price * 1.4); // Fallback estimate
                const discount = Math.round(((oldPrice - p.price) / oldPrice) * 100);

                // Premium users: only get deals matching their preferences
                if (user.plan === 'premium') {
                    const isInPreferred = user.preferred_destinations?.includes(dest);
                    const isUnderBudget = user.budget_max ? p.price <= user.budget_max : true;

                    if (isInPreferred || isUnderBudget) {
                        userDeals.push({
                            destination: dest,
                            price: p.price,
                            oldPrice,
                            discount: Math.max(discount, 0),
                            airline: p.airline || 'Multiple',
                            route: `YUL – ${p.destination_code || ''}`,
                            departureDate: p.departure_date,
                            returnDate: p.return_date,
                        });
                    }
                } else {
                    // Free users: get all deals (no filtering)
                    if (discount >= 20) { // Only send if at least 20% off
                        userDeals.push({
                            destination: dest,
                            price: p.price,
                            oldPrice,
                            discount: Math.max(discount, 0),
                            airline: p.airline || 'Multiple',
                            route: `YUL – ${p.destination_code || ''}`,
                            departureDate: p.departure_date,
                            returnDate: p.return_date,
                        });
                    }
                }
            }

            if (userDeals.length === 0) continue;

            // Sort by biggest discount
            userDeals.sort((a, b) => b.discount - a.discount);

            // Free: max 3 deals. Premium: all deals.
            const dealsToSend = user.plan === 'premium'
                ? userDeals
                : userDeals.slice(0, 3);

            // Send email
            const result = await sendDealAlert(
                user.email,
                user.full_name || 'Voyageur',
                dealsToSend
            );

            if (result) {
                emailsSent++;

                // Log alert in database
                for (const deal of dealsToSend) {
                    await supabase.from('alerts_sent').insert({
                        user_id: user.id,
                        type: 'price_drop',
                        destination: deal.destination,
                        price: deal.price,
                        message: `${deal.destination} à ${deal.price}$ (-${deal.discount}%)`,
                        email_sent: true,
                    });
                }
            }

            // Rate limit: wait between emails
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        return NextResponse.json({
            message: 'Alerts sent',
            emailsSent,
            usersProcessed: users.length,
        });
    } catch (error: any) {
        console.error('Alert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
