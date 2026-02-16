import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { calculateRealDiscount } from '@/lib/services/flights';

export async function GET() {
    try {
        const supabase = await createServerSupabase();

        // Derniers prix (24 dernières heures)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: latestPrices, error } = await supabase
            .from('price_history')
            .select('*')
            .gte('scanned_at', oneDayAgo)
            .order('price', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Dédupliquer : garder le meilleur prix par destination
        const bestByDest: Record<string, any> = {};
        for (const row of latestPrices || []) {
            if (!bestByDest[row.destination] || row.price < bestByDest[row.destination].price) {
                bestByDest[row.destination] = row;
            }
        }

        // Pour chaque destination, calculer le rabais réel basé sur l'historique
        const enrichedPrices = [];
        for (const [dest, price] of Object.entries(bestByDest)) {
            // Chercher l'historique des 30 derniers jours
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const { data: history } = await supabase
                .from('price_history')
                .select('price, scanned_at')
                .eq('destination', dest)
                .gte('scanned_at', thirtyDaysAgo)
                .order('scanned_at', { ascending: false });

            const discountInfo = calculateRealDiscount(
                (price as any).price,
                history || []
            );

            enrichedPrices.push({
                ...(price as any),
                discount: discountInfo.discount,
                avgPrice: discountInfo.avgPrice,
                lowestEver: discountInfo.lowestEver,
                isGoodDeal: discountInfo.isGoodDeal,
                dealLevel: discountInfo.dealLevel,
            });
        }

        // Trier : les meilleurs deals en premier
        enrichedPrices.sort((a, b) => {
            // Priorité aux deals classés "incredible" et "lowest_ever"
            const levelOrder: Record<string, number> = {
                lowest_ever: 0,
                incredible: 1,
                great: 2,
                good: 3,
                slight: 4,
                normal: 5,
            };
            const levelDiff = (levelOrder[a.dealLevel] || 5) - (levelOrder[b.dealLevel] || 5);
            if (levelDiff !== 0) return levelDiff;
            return b.discount - a.discount;
        });

        return NextResponse.json({
            prices: enrichedPrices,
            count: enrichedPrices.length,
            updatedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
