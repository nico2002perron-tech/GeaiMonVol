import { NextRequest, NextResponse } from "next/server";
import { WatchlistService } from "@/features/watchlist/watchlist.service";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await WatchlistService.getUserWatchlist(user.id);
    return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { destination, targetPrice } = await req.json();
    try {
        await WatchlistService.addDestination(user.id, destination, targetPrice);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
