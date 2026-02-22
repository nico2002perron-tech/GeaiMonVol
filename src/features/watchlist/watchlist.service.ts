import { getWatchlist, addToWatchlist, WatchlistItem } from "./watchlist.repository";

export const WatchlistService = {
    async getUserWatchlist(userId: string) {
        return await getWatchlist(userId);
    },

    async addDestination(userId: string, destination: string, targetPrice?: number) {
        if (!destination) throw new Error("Destination is required");
        await addToWatchlist(userId, destination, targetPrice);
    }
};
