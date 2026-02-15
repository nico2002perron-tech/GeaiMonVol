import { createClient } from "@/lib/supabase/server";

export interface WatchlistItem {
    id: string;
    userId: string;
    destination: string;
    targetPrice?: number;
    createdAt: string;
}

export async function getWatchlist(userId: string): Promise<WatchlistItem[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", userId);

    if (error) return [];
    return data as WatchlistItem[];
}

export async function addToWatchlist(userId: string, destination: string, targetPrice?: number) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("watchlist")
        .insert({ user_id: userId, destination, target_price: targetPrice });

    if (error) throw error;
}
