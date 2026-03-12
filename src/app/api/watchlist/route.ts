import { NextRequest, NextResponse } from "next/server";
import { WatchlistService } from "@/features/watchlist/watchlist.service";
import { createServerSupabase } from "@/lib/supabase/server";
import { FREE_WATCHLIST_MAX } from "@/lib/constants/premium";

export async function GET(req: NextRequest) {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await WatchlistService.getUserWatchlist(user.id);
    return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { destination, targetPrice } = await req.json();

    if (!destination || typeof destination !== 'string' || !destination.trim()) {
        return NextResponse.json({ error: "Invalid destination" }, { status: 400 });
    }
    if (targetPrice !== undefined && (typeof targetPrice !== 'number' || targetPrice < 0)) {
        return NextResponse.json({ error: "Invalid target price" }, { status: 400 });
    }

    try {
        // Check free tier watchlist limit
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .single();

        if (profile?.plan !== 'premium') {
            const existing = await WatchlistService.getUserWatchlist(user.id);
            if (existing.length >= FREE_WATCHLIST_MAX) {
                return NextResponse.json({
                    error: 'Limite de watchlist atteinte. Passe Premium pour un suivi illimité !',
                    upgrade_required: true,
                }, { status: 403 });
            }
        }

        await WatchlistService.addDestination(user.id, destination, targetPrice);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
