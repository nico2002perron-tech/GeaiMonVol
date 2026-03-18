import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { sendDealAlert } from '@/lib/services/email';
import { calculateRealDiscount } from '@/lib/services/flights';
import { createDealNotifications } from '@/features/notifications/notification.service';

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

        // 2. Récupérer les utilisateurs — triés premium d'abord
        const { data: users } = await supabase
            .from('profiles')
            .select('*')
            .eq('email_notifications', true)
            .order('plan', { ascending: false });

        if (!users || users.length === 0) {
            return NextResponse.json({ message: 'No users to notify' });
        }

        let totalSent = 0;
        // Use 90-day window to match /api/prices and calculateRealDiscount
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

        // 3. Pour chaque utilisateur, filtrer les deals pertinents
        for (const user of users) {
            const userDeals = [];
            const isPremium = user.plan === 'premium';

            for (const [dest, p] of Object.entries(uniqueDeals)) {
                // Pour chaque destination, calculer le vrai rabais
                const { data: history } = await supabase
                    .from('price_history')
                    .select('price, scanned_at')
                    .eq('destination', dest)
                    .gte('scanned_at', ninetyDaysAgo);

                const discountInfo = calculateRealDiscount((p as any).price, history || []);

                // Premium: seuil plus bas (alerte sur deals plus petits)
                // Free: isGoodDeal standard
                if (!isPremium && !discountInfo.isGoodDeal) continue;
                if (isPremium && discountInfo.discount < 5) continue;

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
                    bookingLink: (p as any).raw_data?.booking_link || (p as any).raw_data?.google_flights_link
                });
            }

            if (userDeals.length > 0) {
                // Envoyer l'email — Premium reçoit en premier (tri par plan desc)
                // + marqueur isPriority pour renforcer la valeur perçue
                await sendDealAlert(
                    user.email,
                    user.full_name || user.email,
                    userDeals,
                    isPremium,
                );
                totalSent++;
            }
        }

        // ── Create in-app notifications for matching users ──
        let notificationsCreated = 0;
        try {
            const dealsForMatching = Object.entries(uniqueDeals).map(([dest, p]: [string, any]) => ({
                destination: dest,
                destination_code: p.destination_code || '',
                price: p.price,
                discount: 0, // Will be recalculated in the service
                dealLevel: 'normal',
                airline: p.airline || '',
                departureDate: p.departure_date,
                returnDate: p.return_date,
            }));

            // Enrich with discount info
            for (const deal of dealsForMatching) {
                const { data: history } = await supabase
                    .from('price_history')
                    .select('price, scanned_at')
                    .eq('destination', deal.destination)
                    .gte('scanned_at', ninetyDaysAgo)
                    .limit(200);

                const discountInfo = calculateRealDiscount(deal.price, history || []);
                deal.discount = discountInfo.discount;
                deal.dealLevel = discountInfo.dealLevel;
            }

            notificationsCreated = await createDealNotifications(dealsForMatching);
        } catch (notifError) {
            console.error('[Alerts] Notification creation error:', notifError);
        }

        return NextResponse.json({
            message: 'Alerts processed',
            usersNotified: totalSent,
            dealsProcessed: Object.keys(uniqueDeals).length,
            notificationsCreated,
        });
    } catch (error: any) {
        console.error('Send alerts error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
