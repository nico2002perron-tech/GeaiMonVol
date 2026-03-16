import type { Profile } from '@/lib/types/database';
import type { CreateNotificationInput } from './notification.types';
import { createNotificationsBatch } from './notification.repository';
import { createAdminSupabase } from '@/lib/supabase/admin';

interface DealForMatching {
    destination: string;
    destination_code: string;
    price: number;
    discount: number;
    dealLevel: string;
    airline: string;
    departureDate?: string;
    returnDate?: string;
}

interface MatchResult {
    deal: DealForMatching;
    reasons: string[];
}

const MONTH_MAP: Record<string, number[]> = {
    'janvier': [1], 'février': [2], 'mars': [3], 'avril': [4],
    'mai': [5], 'juin': [6], 'juillet': [7], 'août': [8],
    'septembre': [9], 'octobre': [10], 'novembre': [11], 'décembre': [12],
    'hiver': [12, 1, 2], 'printemps': [3, 4, 5], 'été': [6, 7, 8], 'automne': [9, 10, 11],
};

/**
 * Match deals to a user's preferences
 * Returns deals that match with reasons why
 */
export function matchDealsToUser(user: Profile, deals: DealForMatching[]): MatchResult[] {
    const results: MatchResult[] = [];

    for (const deal of deals) {
        const reasons: string[] = [];

        // Check preferred destinations
        const prefDests = (user.preferred_destinations || []).map(d => d.toLowerCase());
        if (prefDests.includes(deal.destination.toLowerCase()) || prefDests.includes(deal.destination_code.toLowerCase())) {
            reasons.push('Ta destination préférée!');
        }

        // Check budget
        if (user.budget_max && deal.price <= user.budget_max) {
            reasons.push(`Dans ton budget (max ${user.budget_max}$)`);
        }

        // Check travel months
        if (deal.departureDate && user.travel_months && user.travel_months.length > 0) {
            const depMonth = new Date(deal.departureDate).getMonth() + 1;
            const userMonths = user.travel_months.flatMap(m => MONTH_MAP[m.toLowerCase()] || []);
            if (userMonths.includes(depMonth)) {
                reasons.push('Correspond à tes mois de voyage!');
            }
        }

        // Good deal level = always interesting
        const goodLevels = ['lowest_ever', 'incredible', 'great'];
        if (goodLevels.includes(deal.dealLevel)) {
            reasons.push(deal.dealLevel === 'lowest_ever' ? 'Prix record historique!' :
                         deal.dealLevel === 'incredible' ? 'Deal incroyable!' : 'Super deal!');
        }

        // Only include if at least one reason matches
        if (reasons.length > 0) {
            results.push({ deal, reasons });
        }
    }

    // Sort: more reasons = more relevant
    results.sort((a, b) => b.reasons.length - a.reasons.length);
    return results;
}

/**
 * Build notification title and body from a match
 */
function buildNotificationContent(match: MatchResult): { title: string; body: string } {
    const { deal, reasons } = match;
    const reasonStr = reasons[0]; // Primary reason

    const title = deal.discount > 0
        ? `${deal.destination} à ${Math.round(deal.price)}$ (-${deal.discount}%)`
        : `${deal.destination} à ${Math.round(deal.price)}$`;

    const parts = [reasonStr];
    if (deal.airline) parts.push(`Avec ${deal.airline}`);
    if (deal.departureDate) {
        const depDate = new Date(deal.departureDate).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });
        parts.push(`Départ le ${depDate}`);
    }

    return { title, body: parts.join(' · ') };
}

/**
 * Process deals and create notifications for all matching users
 * Called by the send-alerts cron
 */
export async function createDealNotifications(deals: DealForMatching[]): Promise<number> {
    if (deals.length === 0) return 0;

    const supabase = createAdminSupabase();

    // Get all users with email notifications enabled
    const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .eq('email_notifications', true);

    if (!users || users.length === 0) return 0;

    const allNotifications: CreateNotificationInput[] = [];

    for (const user of users) {
        const isPremium = user.plan === 'premium';

        // Premium: full matching. Free: only great+ deals for preferred destinations
        const matches = matchDealsToUser(user as Profile, deals);

        // Free users: limit to top 3 matches, only good+ deals
        const filteredMatches = isPremium
            ? matches
            : matches
                .filter(m => ['lowest_ever', 'incredible', 'great', 'good'].includes(m.deal.dealLevel))
                .slice(0, 3);

        for (const match of filteredMatches) {
            const { title, body } = buildNotificationContent(match);

            allNotifications.push({
                user_id: user.id,
                type: 'deal_match',
                title,
                body,
                destination: match.deal.destination,
                destination_code: match.deal.destination_code,
                deal_price: match.deal.price,
                deal_discount: match.deal.discount,
                deal_level: match.deal.dealLevel,
                metadata: {
                    airline: match.deal.airline,
                    departure_date: match.deal.departureDate,
                    return_date: match.deal.returnDate,
                    reasons: match.reasons,
                },
            });
        }
    }

    if (allNotifications.length === 0) return 0;

    // Batch insert (50 at a time)
    let created = 0;
    for (let i = 0; i < allNotifications.length; i += 50) {
        const batch = allNotifications.slice(i, i + 50);
        created += await createNotificationsBatch(batch);
    }

    console.log(`[Notifications] Created ${created} notifications for ${users.length} users`);
    return created;
}
