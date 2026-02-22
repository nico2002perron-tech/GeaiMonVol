import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { sendDealAlert } from '@/lib/services/email';
import { calculateRealDiscount } from '@/lib/services/flights';

export const maxDuration = 60;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret') || request.headers.get('x-cron-secret');

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = await createServerSupabase();

        // 1. Récupérer les derniers prix (dernières 2 heures)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const { data: latestPrices } = await supabase
            .from('price_history')
            .select('*')
            .gte('scanned_at', twoHoursAgo)
            .order('price', { ascending: true });

        if (!latestPrices || latestPrices.length === 0) {
            return NextResponse.json({ message: 'No new deals to process' });
        }

        // Dédupliquer par destination
        const uniqueDeals: Record<string, any> = {};
        for (const p of latestPrices) {
            if (!uniqueDeals[p.destination] || p.price < uniqueDeals[p.destination].price) {
                uniqueDeals[p.destination] = p;
            }
        }

        // 2. Récupérer les utilisateurs
        const { data: users } = await supabase
            .from('profiles')
            .select('*')
            .eq('email_notifications', true);

        if (!users || users.length === 0) {
            return NextResponse.json({ message: 'No users to notify' });
        }

        let totalSent = 0;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // 3. Pour chaque utilisateur, filtrer les deals pertinents
        for (const user of users) {
            const userDeals = [];

            for (const [dest, p] of Object.entries(uniqueDeals)) {
                // Pour chaque destination, calculer le vrai rabais
                const { data: history } = await supabase
                    .from('price_history')
                    .select('price, scanned_at')
                    .eq('destination', dest)
                    .gte('scanned_at', thirtyDaysAgo);

                const discountInfo = calculateRealDiscount((p as any).price, history || []);

                // Ne créer un deal que si c'est vraiment un bon deal
                if (!discountInfo.isGoodDeal) continue;

                // Ajouter le deal
                userDeals.push({
                    destination: dest,
                    price: (p as any).price,
                    oldPrice: discountInfo.avgPrice,
                    discount: discountInfo.discount,
                    dealLevel: discountInfo.dealLevel,
                    airline: (p as any).airline || 'Multiple',
                    route: `YUL – ${(p as any).destination_code || ''}`,
                    departureDate: (p as any).departure_date,
                    returnDate: (p as any).return_date,
                    googleFlightsLink: (p as any).raw_data?.google_flights_link
                });
            }

            if (userDeals.length > 0) {
                // Envoyer l'email
                await sendDealAlert(user.email, user.full_name || user.email, userDeals);
                totalSent++;
            }
        }

        return NextResponse.json({
            message: 'Alerts processed',
            usersNotified: totalSent,
            dealsProcessed: Object.keys(uniqueDeals).length
        });
    } catch (error: any) {
        console.error('Send alerts error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
