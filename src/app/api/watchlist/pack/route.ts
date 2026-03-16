import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
        }

        const body = await request.json();
        const { destination, destination_code, target_price, flight_price, hotel_price_per_night, hotel_name, nights } = body;

        if (!destination || !destination_code || !target_price) {
            return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
        }

        // Use the existing watchlist table with pack-specific metadata
        const { data, error } = await supabase
            .from('watchlist')
            .upsert({
                user_id: user.id,
                destination,
                destination_code,
                target_price: target_price,
                is_pack: true,
                pack_details: {
                    flight_price,
                    hotel_price_per_night,
                    hotel_name,
                    nights: nights || 7,
                },
                created_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,destination_code',
            });

        if (error) {
            console.error('[Pack Watchlist] Insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Alerte pack creee!' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
        }

        await supabase
            .from('watchlist')
            .delete()
            .eq('user_id', user.id)
            .eq('destination_code', code)
            .eq('is_pack', true);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
