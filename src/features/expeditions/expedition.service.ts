import type { ExpeditionWithStops, ExpeditionPricing } from './expedition.types';

export function calculateExpeditionPricing(
    expedition: ExpeditionWithStops,
    flightPrice: number | null
): ExpeditionPricing {
    const perStopCost = expedition.stops.map((stop) => {
        // Use cheapest accommodation or estimate
        const cheapest = stop.accommodations?.length
            ? Math.min(...stop.accommodations.map((a) => a.price_per_night || 80))
            : 80; // fallback estimate

        return {
            city: stop.city,
            nights: stop.nights,
            pricePerNight: cheapest,
            total: cheapest * stop.nights,
        };
    });

    const accommodationTotal = perStopCost.reduce((sum, s) => sum + s.total, 0);
    const grandTotal = flightPrice != null ? flightPrice + accommodationTotal : null;

    return { flightPrice, accommodationTotal, perStopCost, grandTotal };
}

export function getDifficultyLabel(difficulty: string): string {
    switch (difficulty) {
        case 'easy': return 'Facile';
        case 'moderate': return 'Modéré';
        case 'adventurous': return 'Aventurier';
        default: return difficulty;
    }
}

export function getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
        case 'easy': return '#22c55e';
        case 'moderate': return '#f59e0b';
        case 'adventurous': return '#ef4444';
        default: return '#888';
    }
}

export function getTagStyle(tag: string): { bg: string; color: string } {
    const map: Record<string, { bg: string; color: string }> = {
        'Culture': { bg: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' },
        'Plage': { bg: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff' },
        'Nature': { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' },
        'Aventure': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
        'Gastronomie': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
        'Street food': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
        'Technologie': { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
        'Faune': { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
    };
    return map[tag] || { bg: 'rgba(255,255,255,0.08)', color: '#ccc' };
}
