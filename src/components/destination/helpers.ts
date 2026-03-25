export function formatDateFr(dateStr: string): string {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        const day = d.getDate();
        const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
        return `${day} ${months[d.getMonth()]}`;
    } catch { return dateStr; }
}

export function formatDuration(mins: number): string {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

export function getTripNights(dep: string, ret: string): number {
    if (!dep || !ret) return 0;
    return Math.round((new Date(ret).getTime() - new Date(dep).getTime()) / 86400000);
}

export function starRating(n: number): string {
    return '★'.repeat(Math.round(n));
}

export const AMENITY_ICONS: Record<string, string> = {
    'Free Wi-Fi': '📶', 'Wi-Fi': '📶', 'Free parking': '🅿️', 'Parking': '🅿️',
    'Outdoor pool': '🏊', 'Pool': '🏊', 'Indoor pool': '🏊', 'Hot tub': '♨️',
    'Spa': '💆', 'Beach access': '🏖️', 'Beach': '🏖️', 'Gym': '🏋️', 'Fitness': '🏋️',
    'Restaurant': '🍽️', 'Bar': '🍸', 'Room service': '🛎️', 'Air conditioning': '❄️', 'Airport shuttle': '🚌',
};

export const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
