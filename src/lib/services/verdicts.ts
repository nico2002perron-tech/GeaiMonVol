/**
 * Deterministic AI verdict computation from deal data.
 * Zero API calls — uses dealLevel, discount, and price averages.
 */

export type Verdict = 'URGENT' | 'ACHETER' | 'SURVEILLER' | 'ATTENDRE';

export interface VerdictResult {
    verdict: Verdict;
    confidence: number;
    oneLiner: string;
}

export function computeVerdict(
    dealLevel: string,
    discount: number,
    currentPrice: number,
    avgPrice: number,
    medianPrice: number,
    historyCount: number,
): VerdictResult {
    let verdict: Verdict;
    let confidence: number;
    let oneLiner: string;

    const refPrice = medianPrice > 0 ? medianPrice : avgPrice;
    const pctBelow = refPrice > 0 ? Math.round(((refPrice - currentPrice) / refPrice) * 100) : 0;

    // Determine verdict from deal level + discount
    if (dealLevel === 'lowest_ever' || (discount >= 35 && ['incredible', 'great'].includes(dealLevel))) {
        verdict = 'URGENT';
        confidence = 88;
        oneLiner = `Prix record! ${pctBelow}% sous la médiane.`;
    } else if (['incredible'].includes(dealLevel) || discount >= 30) {
        verdict = 'URGENT';
        confidence = 82;
        oneLiner = `Prix exceptionnel, ${discount}% de rabais!`;
    } else if (['great'].includes(dealLevel) || discount >= 25) {
        verdict = 'ACHETER';
        confidence = 75;
        oneLiner = `Excellent deal à ${currentPrice}$, ${discount}% sous le prix habituel.`;
    } else if (['good'].includes(dealLevel) || discount >= 15) {
        verdict = 'ACHETER';
        confidence = 65;
        oneLiner = `Bon prix à ${currentPrice}$, ${pctBelow}% sous la moyenne.`;
    } else if (['slight'].includes(dealLevel) || discount >= 5) {
        verdict = 'SURVEILLER';
        confidence = 55;
        oneLiner = `Prix correct mais pourrait descendre encore.`;
    } else {
        verdict = 'ATTENDRE';
        confidence = 50;
        oneLiner = `Prix dans la moyenne, pas de rabais significatif.`;
    }

    // Adjust confidence based on data quality
    if (historyCount < 5) {
        confidence = Math.max(confidence - 20, 30);
        oneLiner += ' (données limitées)';
    } else if (historyCount < 10) {
        confidence = Math.max(confidence - 10, 35);
    } else if (historyCount > 50) {
        confidence = Math.min(confidence + 5, 95);
    }

    return { verdict, confidence, oneLiner };
}

export const VERDICT_STYLES = {
    URGENT: {
        gradient: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
        bg: '#F5F3FF',
        color: '#6D28D9',
        label: 'URGENT',
        emoji: '⚡',
    },
    ACHETER: {
        gradient: 'linear-gradient(135deg, #059669, #047857)',
        bg: '#ECFDF5',
        color: '#059669',
        label: 'ACHETER',
        emoji: '✅',
    },
    SURVEILLER: {
        gradient: 'linear-gradient(135deg, #0077B6, #0369A1)',
        bg: '#EFF6FF',
        color: '#0077B6',
        label: 'SURVEILLER',
        emoji: '👀',
    },
    ATTENDRE: {
        gradient: 'linear-gradient(135deg, #D97706, #B45309)',
        bg: '#FFFBEB',
        color: '#D97706',
        label: 'ATTENDRE',
        emoji: '⏳',
    },
} as const;
