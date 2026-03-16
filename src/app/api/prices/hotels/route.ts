import { NextResponse } from 'next/server';
import { getHotelPrices } from '@/lib/services/hotels';
import { TOUT_INCLUS_DESTINATIONS } from '@/lib/services/hotels';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const checkIn = searchParams.get('checkin') || searchParams.get('check_in');
    const checkOut = searchParams.get('checkout') || searchParams.get('check_out');

    if (!code) {
        return NextResponse.json(
            { error: 'Missing required parameter: code' },
            { status: 400 }
        );
    }

    // Check if this is a tout-inclus destination (free access)
    const isToutInclus = TOUT_INCLUS_DESTINATIONS.some(d => d.code === code);

    // If not tout-inclus, require premium (on-demand search)
    if (!isToutInclus) {
        // Check if user is premium
        try {
            const supabase = await createServerSupabase();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('plan')
                    .eq('id', user.id)
                    .single();

                if (profile?.plan !== 'premium') {
                    return NextResponse.json(
                        { error: 'Premium required for on-demand hotel search', requiresPremium: true },
                        { status: 403 }
                    );
                }
            } else {
                return NextResponse.json(
                    { error: 'Authentication required', requiresPremium: true },
                    { status: 401 }
                );
            }
        } catch {
            // If auth check fails, still allow tout-inclus
            if (!isToutInclus) {
                return NextResponse.json(
                    { error: 'Premium required', requiresPremium: true },
                    { status: 403 }
                );
            }
        }
    }

    try {
        const allInclusive = isToutInclus;
        const hotels = await getHotelPrices(
            code,
            checkIn || undefined,
            checkOut || undefined,
            allInclusive
        );

        return NextResponse.json({
            hotels,
            destination_code: code,
            is_all_inclusive: allInclusive,
            count: hotels.length,
            cache: hotels.length > 0 ? 'hit' : 'miss',
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch (error: any) {
        console.error('[Hotels API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch hotel prices' },
            { status: 500 }
        );
    }
}
