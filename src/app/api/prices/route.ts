import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createServerSupabase();

        // Get the latest price for each destination
        const { data, error } = await supabase
            .from('price_history')
            .select('*')
            .order('scanned_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Deduplicate: keep only the latest price per destination
        const latest: Record<string, any> = {};
        for (const row of data || []) {
            if (!latest[row.destination]) {
                latest[row.destination] = row;
            }
        }

        return NextResponse.json({
            prices: Object.values(latest),
            updatedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
