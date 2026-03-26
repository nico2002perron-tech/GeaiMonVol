import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { sendWeeklyDigest } from '@/lib/services/email';
import { calculateRealDiscount } from '@/lib/services/flights';
import { MAX_PRICE } from '@/lib/constants/deals';

export const maxDuration = 60;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    const secret = searchParams.get('secret')
        || request.headers.get('x-cron-secret')
        || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = await createServerSupabase();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const today = new Date().toISOString().split('T')[0];

        // 1. Récupérer les meilleurs prix de la semaine
        const { data: weekPrices } = await supabase
            .from('price_history')
            .select('destination, destination_code, price, airline, departure_date, return_date, scanned_at, raw_data')
            .gte('scanned_at', sevenDaysAgo)
            .neq('source', 'historical_seed')
            .not('source', 'like', 'google_flights%')
            .not('source', 'eq', 'skyscanner_explore')
            .lte('price', MAX_PRICE)
            .order('price', { ascending: true });

        if (!weekPrices || weekPrices.length === 0) {
            return NextResponse.json({ message: 'No deals this week' });
        }

        // Dédupliquer par destination — garder le meilleur prix + futur departure
        const bestByDest: Record<string, any> = {};
        for (const row of weekPrices) {
            if (row.departure_date && row.departure_date < today) continue;
            const key = row.destination_code || row.destination;
            if (key.length === 2) continue; // skip country codes
            if (!bestByDest[key] || row.price < bestByDest[key].price) {
                bestByDest[key] = row;
            }
        }

        // Calculer les rabais
        const enriched = [];
        for (const [, p] of Object.entries(bestByDest)) {
            const { data: history } = await supabase
                .from('price_history')
                .select('price, scanned_at')
                .eq('destination', p.destination)
                .gte('scanned_at', ninetyDaysAgo)
                .limit(200);

            const info = calculateRealDiscount(p.price, history || []);
            if (info.discount < 5) continue; // skip deals with no real discount

            enriched.push({
                destination: p.destination,
                price: p.price,
                oldPrice: info.avgPrice,
                discount: info.discount,
                dealLevel: info.dealLevel,
                airline: p.airline || '',
                route: `YUL – ${p.destination_code || ''}`,
                departureDate: p.departure_date,
                returnDate: p.return_date,
            });
        }

        // Trier par meilleur deal et prendre le top 7
        const levelOrder: Record<string, number> = { lowest_ever: 0, incredible: 1, great: 2, good: 3, slight: 4, normal: 5 };
        enriched.sort((a, b) => {
            const d = (levelOrder[a.dealLevel] ?? 5) - (levelOrder[b.dealLevel] ?? 5);
            return d !== 0 ? d : b.discount - a.discount;
        });
        const topDeals = enriched.slice(0, 7);

        if (topDeals.length === 0) {
            return NextResponse.json({ message: 'No good deals this week' });
        }

        // 2. Récupérer TOUS les utilisateurs avec alertes activées
        const { data: users } = await supabase
            .from('profiles')
            .select('id, email, full_name, plan')
            .eq('email_notifications', true);

        if (!users || users.length === 0) {
            return NextResponse.json({ message: 'No users with alerts enabled' });
        }

        // 3. Envoyer le digest à chaque utilisateur
        let sent = 0;
        for (const user of users) {
            try {
                await sendWeeklyDigest(
                    user.email,
                    user.full_name || user.email.split('@')[0],
                    topDeals,
                );
                sent++;
            } catch (err) {
                console.error(`[WeeklyDigest] Failed for ${user.email}:`, err);
            }
        }

        return NextResponse.json({
            message: 'Weekly digest sent',
            usersSent: sent,
            totalUsers: users.length,
            dealsIncluded: topDeals.length,
            topDeal: topDeals[0] ? `${topDeals[0].destination} à ${Math.round(topDeals[0].price)}$` : null,
        });
    } catch (error: any) {
        console.error('[WeeklyDigest] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
