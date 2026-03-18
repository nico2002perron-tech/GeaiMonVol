// ═══════════════════════════════════════════════════════════════
// GeAI Price Forecast Engine
// Statistical predictive model combining 6 independent signals
// into a composite buy/wait recommendation with confidence band.
//
// Methods: OLS regression, seasonal decomposition, z-score mean
// reversion, EMA crossover momentum, coefficient of variation,
// and Google Flights market assessment integration.
// ═══════════════════════════════════════════════════════════════

// ── Types ──

export interface ForecastInput {
    dailyPrices: Array<{ date: string; price: number }>;
    monthlyMedians: Array<{ month: number; median: number; avg: number; min: number; max: number; count: number }>;
    googlePriceLevel: 'low' | 'typical' | 'high' | null;
    googleTypicalRange: [number, number] | null;
    googlePriceHistory: Array<[number, number]> | null;
    currentBestPrice: number;
    destination: string;
}

export interface ForecastSignal {
    name: string;
    direction: 'bullish' | 'bearish' | 'neutral';
    strength: number;   // 0–100
    score: number;       // -100 to +100 (positive = buy)
    label: string;
    detail: string;
}

export interface ForecastCurvePoint {
    day: number;
    predicted: number;
    lower95: number;
    upper95: number;
}

export interface PriceForecast {
    verdict: 'BUY_NOW' | 'BUY_SOON' | 'WAIT' | 'NEUTRAL';
    verdictScore: number;     // -100 to +100
    confidence: number;        // 0–100
    reasoning: string[];
    predicted7d: number;
    predicted14d: number;
    predicted30d: number;
    curve: ForecastCurvePoint[];
    signals: ForecastSignal[];
    optimalWindow: { min: number; max: number; label: string };
    dataQuality: { points: number; spanDays: number; level: 'excellent' | 'good' | 'fair' | 'limited' };
    // Enriched details
    savingsDetail: {
        currentPrice: number;
        avgHistorical: number;
        vsAvg: number;             // current - avg (negative = saving)
        vsAvgPct: number;          // percentage
        lowestSeen: number;
        highestSeen: number;
        potentialSaving7d: number;  // estimated saving if waiting 7 days
        potentialSaving30d: number; // estimated saving if waiting 30 days
    };
    nextMonthComparison: {
        currentMonth: string;
        nextMonth: string;
        currentMedian: number;
        nextMedian: number;
        difference: number;        // negative = next month cheaper
        recommendation: string;
    } | null;
    priceContext: string;           // one-liner summary for users
    // Simple 3-reason pronostic
    pronostic: {
        verdictLine: string;           // One clear sentence: buy or wait
        reasons: Array<{
            icon: string;
            text: string;
            impact: 'positive' | 'negative' | 'neutral';
        }>;                            // Exactly 3 data-backed reasons
        monthlyOutlook: Array<{
            month: string;
            medianPrice: number;
            vsCurrent: number;
        }> | null;
        confidenceNote: string;
    };
}

// ── Statistical Primitives ──

function mean(arr: number[]): number {
    return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function stdDev(arr: number[]): number {
    if (arr.length < 2) return 0;
    const m = mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}

function median(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Ordinary Least Squares linear regression */
function ols(points: Array<{ x: number; y: number }>): { slope: number; intercept: number; r2: number } {
    const n = points.length;
    if (n < 2) return { slope: 0, intercept: points[0]?.y || 0, r2: 0 };

    const sx = points.reduce((s, p) => s + p.x, 0);
    const sy = points.reduce((s, p) => s + p.y, 0);
    const sxy = points.reduce((s, p) => s + p.x * p.y, 0);
    const sxx = points.reduce((s, p) => s + p.x * p.x, 0);

    const denom = n * sxx - sx * sx;
    if (Math.abs(denom) < 1e-10) return { slope: 0, intercept: sy / n, r2: 0 };

    const slope = (n * sxy - sx * sy) / denom;
    const intercept = (sy - slope * sx) / n;

    const yMean = sy / n;
    const ssTot = points.reduce((s, p) => s + (p.y - yMean) ** 2, 0);
    const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
    const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

    return { slope, intercept, r2 };
}

/** Exponential Moving Average */
function ema(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    const alpha = 2 / (period + 1);
    let result = prices[0];
    for (let i = 1; i < prices.length; i++) {
        result = alpha * prices[i] + (1 - alpha) * result;
    }
    return result;
}

/** Remove outliers using IQR (interquartile range) method.
 *  Keeps only prices within [Q1 - 1.5*IQR, Q3 + 1.5*IQR]. */
function removeOutliers<T extends { price: number }>(data: T[]): T[] {
    if (data.length < 4) return data;
    const sorted = [...data].sort((a, b) => a.price - b.price);
    const q1 = sorted[Math.floor(sorted.length * 0.25)].price;
    const q3 = sorted[Math.floor(sorted.length * 0.75)].price;
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    return data.filter(d => d.price >= lower && d.price <= upper);
}

// ── Signal Generators ──

function trendSignal(dailyPrices: Array<{ date: string; price: number }>): ForecastSignal {
    // Use last 30 days for short-term trend
    const recent = dailyPrices.slice(-30);
    if (recent.length < 5) {
        return { name: 'Tendance', direction: 'neutral', strength: 0, score: 0, label: 'Données insuffisantes', detail: 'Moins de 5 jours de données.' };
    }

    const points = recent.map((p, i) => ({ x: i, y: p.price }));
    const reg = ols(points);
    const dailyChange = reg.slope;
    const pctPerWeek = mean(recent.map(p => p.price)) > 0
        ? (dailyChange * 7 / mean(recent.map(p => p.price))) * 100
        : 0;

    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let score = 0;
    let label = '';
    let detail = '';

    if (pctPerWeek < -1.5) {
        direction = 'bullish'; // prices going down = good for buyer
        score = Math.min(80, Math.round(Math.abs(pctPerWeek) * 15));
        label = `En baisse`;
        detail = `Les prix baissent d'environ ${Math.abs(dailyChange).toFixed(0)}$ par jour. Bonne nouvelle pour toi!`;
    } else if (pctPerWeek > 1.5) {
        direction = 'bearish';
        score = -Math.min(80, Math.round(pctPerWeek * 15));
        label = `En hausse`;
        detail = `Les prix montent d'environ ${dailyChange.toFixed(0)}$ par jour. Plus tu attends, plus ça risque de coûter cher.`;
    } else {
        direction = 'neutral';
        score = 10; // slight positive: stable = ok to buy
        label = 'Stables';
        detail = `Les prix sont relativement stables cette semaine. Pas de pression à acheter tout de suite.`;
    }

    return {
        name: 'Tendance',
        direction,
        strength: Math.min(100, Math.round(reg.r2 * 100)),
        score,
        label,
        detail,
    };
}

function seasonalitySignal(
    monthlyMedians: Array<{ month: number; median: number; count: number }>,
    currentMonth: number
): ForecastSignal {
    const valid = monthlyMedians.filter(m => m.count > 0);
    if (valid.length < 3) {
        return { name: 'Saisonnalité', direction: 'neutral', strength: 0, score: 0, label: 'Données insuffisantes', detail: 'Moins de 3 mois de données historiques.' };
    }

    const overallMedian = median(valid.map(m => m.median));
    const currentData = monthlyMedians.find(m => m.month === currentMonth);
    const nextMonth = (currentMonth + 1) % 12;
    const nextData = monthlyMedians.find(m => m.month === nextMonth);

    // Rank current month (1 = cheapest)
    const sorted = [...valid].sort((a, b) => a.median - b.median);
    const rank = sorted.findIndex(m => m.month === currentMonth) + 1;

    const currentMedian = currentData?.median || overallMedian;
    const seasonalIndex = overallMedian > 0 ? currentMedian / overallMedian : 1;

    let score = 0;
    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let label = '';
    let detail = '';

    if (seasonalIndex < 0.9) {
        direction = 'bullish';
        score = Math.min(70, Math.round((1 - seasonalIndex) * 200));
        label = `Basse saison`;
        detail = `Historiquement, ce mois fait partie des moins chers de l'année (${rank}e sur ${valid.length} mois). C'est le bon moment!`;
    } else if (seasonalIndex > 1.1) {
        direction = 'bearish';
        score = -Math.min(70, Math.round((seasonalIndex - 1) * 200));
        label = `Haute saison`;
        detail = `Ce mois est habituellement un des plus chers de l'année (${rank}e sur ${valid.length}). Les prix sont environ ${Math.round((seasonalIndex - 1) * 100)}% plus hauts que la moyenne.`;
    } else {
        direction = 'neutral';
        score = 0;
        label = `Saison normale`;
        detail = 'Ce mois-ci n\'est ni particulièrement cher ni bon marché par rapport au reste de l\'année.';
    }

    // Adjust if next month is cheaper
    if (nextData && currentData && nextData.median < currentData.median * 0.92) {
        score -= 20;
        detail += ` À noter: le mois prochain est généralement ${Math.round((1 - nextData.median / currentData.median) * 100)}% moins cher.`;
    }

    return { name: 'Saisonnalité', direction, strength: Math.min(100, valid.length * 12), score, label, detail };
}

function volatilitySignal(dailyPrices: Array<{ date: string; price: number }>): ForecastSignal {
    const prices = dailyPrices.map(p => p.price);
    if (prices.length < 5) {
        return { name: 'Volatilité', direction: 'neutral', strength: 0, score: 0, label: 'Données insuffisantes', detail: '' };
    }

    const m = mean(prices);
    const sd = stdDev(prices);
    const cv = m > 0 ? sd / m : 0;

    let level: string;
    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let score = 0;
    let detail = '';

    if (cv < 0.08) {
        level = 'Très stables';
        direction = 'bullish';
        score = 15;
        detail = `Les prix ne bougent presque pas. Peu de risque de mauvaise surprise si tu achètes maintenant.`;
    } else if (cv < 0.18) {
        level = 'Normaux';
        score = 0;
        detail = `Les prix bougent un peu, mais rien d'anormal. C'est un comportement habituel pour cette destination.`;
    } else {
        level = 'Imprévisibles';
        direction = 'bearish';
        score = -15;
        detail = `Les prix changent beaucoup d'un jour à l'autre. Tu pourrais trouver mieux en attendant, mais aussi payer plus cher.`;
    }

    return { name: 'Volatilité', direction, strength: Math.round(cv * 300), score, label: level, detail };
}

function meanReversionSignal(
    dailyPrices: Array<{ date: string; price: number }>,
    currentPrice: number
): ForecastSignal {
    const prices = dailyPrices.map(p => p.price);
    if (prices.length < 10) {
        return { name: 'Prix vs habitude', direction: 'neutral', strength: 0, score: 0, label: 'Données insuffisantes', detail: '' };
    }

    const m = mean(prices);
    const sd = stdDev(prices);
    const z = sd > 0 ? (currentPrice - m) / sd : 0;

    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let score = 0;
    let label = '';
    let detail = '';

    if (z < -1.0) {
        direction = 'bullish';
        score = Math.min(80, Math.round(Math.abs(z) * 35));
        label = `Plus bas que d'habitude`;
        detail = `Le prix actuel est ${Math.round(Math.abs(z) * sd)}$ en dessous de la moyenne habituelle (${Math.round(m)}$). C'est un bon prix comparé à l'historique!`;
    } else if (z > 1.0) {
        direction = 'bearish';
        score = -Math.min(80, Math.round(z * 35));
        label = `Plus cher que d'habitude`;
        detail = `Le prix est ${Math.round(z * sd)}$ au-dessus de ce qu'on voit normalement (moyenne: ${Math.round(m)}$). En attendant un peu, tu pourrais économiser.`;
    } else {
        label = `Dans la normale`;
        detail = `Le prix tourne autour de la moyenne habituelle de ${Math.round(m)}$. Rien de spécial à signaler.`;
    }

    return { name: 'Prix vs habitude', direction, strength: Math.min(100, Math.round(Math.abs(z) * 40)), score, label, detail };
}

function momentumSignal(dailyPrices: Array<{ date: string; price: number }>): ForecastSignal {
    const prices = dailyPrices.map(p => p.price);
    if (prices.length < 14) {
        return { name: 'Vitesse des prix', direction: 'neutral', strength: 0, score: 0, label: 'Données insuffisantes', detail: '' };
    }

    const shortEma = ema(prices, 7);
    const longEma = ema(prices, 21);
    const currentPrice = prices[prices.length - 1];

    // EMA crossover signal
    const crossover = longEma > 0 ? ((shortEma - longEma) / longEma) * 100 : 0;

    // Rate of change (last 7 vs previous 7)
    const recent7 = mean(prices.slice(-7));
    const prev7 = mean(prices.slice(-14, -7));
    const roc = prev7 > 0 ? ((recent7 - prev7) / prev7) * 100 : 0;

    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let score = 0;
    let label = '';
    let detail = '';

    if (crossover < -2 && roc < -1) {
        direction = 'bullish'; // prices decelerating = good for buyer
        score = Math.min(60, Math.round(Math.abs(crossover) * 10));
        label = 'Les prix descendent';
        detail = `Les prix sont en baisse rapide ces derniers jours. C'est le bon moment pour en profiter avant que ça remonte.`;
    } else if (crossover > 2 && roc > 1) {
        direction = 'bearish';
        score = -Math.min(60, Math.round(crossover * 10));
        label = 'Les prix montent vite';
        detail = `Les prix accélèrent à la hausse. Attention, ça risque de continuer à monter.`;
    } else if (roc < -1) {
        direction = 'bullish';
        score = 20;
        label = 'Légère baisse';
        detail = `Les prix ont baissé de ${Math.abs(roc).toFixed(1)}% cette semaine. Tendance encourageante.`;
    } else if (roc > 1) {
        direction = 'bearish';
        score = -20;
        label = 'Légère hausse';
        detail = `Les prix ont augmenté de ${roc.toFixed(1)}% cette semaine. Ça pourrait continuer.`;
    } else {
        label = 'Stable';
        detail = 'Les prix ne bougent pas beaucoup ces derniers jours.';
    }

    return { name: 'Vitesse des prix', direction, strength: Math.min(100, Math.round(Math.abs(crossover) * 20)), score, label, detail };
}

function googleSignal(
    priceLevel: 'low' | 'typical' | 'high' | null,
    typicalRange: [number, number] | null,
    currentPrice: number
): ForecastSignal | null {
    if (!priceLevel) return null;

    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let score = 0;
    let label = '';
    let detail = '';

    const inRange = typicalRange
        ? currentPrice >= typicalRange[0] && currentPrice <= typicalRange[1]
        : true;
    const rangeStr = typicalRange ? `${Math.round(typicalRange[0])}$–${Math.round(typicalRange[1])}$` : '';

    if (priceLevel === 'low') {
        direction = 'bullish';
        score = 50;
        label = 'Prix bas';
        detail = `Google Flights confirme que les prix sont plus bas que d'habitude pour cette destination${rangeStr ? ` (normalement entre ${rangeStr})` : ''}. Excellent moment!`;
    } else if (priceLevel === 'high') {
        direction = 'bearish';
        score = -40;
        label = 'Prix élevés';
        detail = `Google Flights indique que les prix sont plus hauts que la normale${rangeStr ? ` (habituellement entre ${rangeStr})` : ''}. Ça vaut la peine d'attendre.`;
    } else {
        label = 'Prix normaux';
        detail = `Google Flights considère que les prix sont dans la fourchette habituelle${rangeStr ? ` (${rangeStr})` : ''}. Rien d'exceptionnel.`;
        if (!inRange && typicalRange && currentPrice < typicalRange[0]) {
            score = 25;
            direction = 'bullish';
            detail += ' En fait, le prix actuel est même un peu sous la normale!';
        }
    }

    return { name: 'Google Flights', direction, strength: 75, score, label, detail };
}

// ── Forecast Generator ──

export function generateForecast(input: ForecastInput): PriceForecast | null {
    const { monthlyMedians, googlePriceLevel, googleTypicalRange, googlePriceHistory, currentBestPrice } = input;

    if (input.dailyPrices.length < 5) return null;

    // Filter out aberrant prices (outliers) before any analysis
    const dailyPrices = removeOutliers(input.dailyPrices);
    if (dailyPrices.length < 5) return null;

    const prices = dailyPrices.map(p => p.price);
    const currentMonth = new Date().getMonth();
    const m = mean(prices);
    const sd = stdDev(prices);

    // ── Generate all signals ──
    const signals: ForecastSignal[] = [];
    const trend = trendSignal(dailyPrices);
    signals.push(trend);

    const seasonality = seasonalitySignal(monthlyMedians, currentMonth);
    signals.push(seasonality);

    const volatility = volatilitySignal(dailyPrices);
    signals.push(volatility);

    const reversion = meanReversionSignal(dailyPrices, currentBestPrice);
    signals.push(reversion);

    const momentum = momentumSignal(dailyPrices);
    signals.push(momentum);

    const google = googleSignal(googlePriceLevel, googleTypicalRange, currentBestPrice);
    if (google) signals.push(google);

    // ── Weighted composite score ──
    const weights: Record<string, number> = {
        'Tendance': 0.25,
        'Saisonnalité': 0.20,
        'Prix vs habitude': 0.20,
        'Vitesse des prix': 0.15,
        'Volatilité': 0.08,
        'Google Flights': 0.12,
    };
    let totalWeight = 0;
    let weightedScore = 0;
    for (const sig of signals) {
        const w = weights[sig.name] || 0.1;
        weightedScore += sig.score * w;
        totalWeight += w;
    }
    const verdictScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;

    // ── Confidence ──
    const spanDays = dailyPrices.length > 1
        ? Math.round((new Date(dailyPrices[dailyPrices.length - 1].date).getTime() - new Date(dailyPrices[0].date).getTime()) / 86400000)
        : 0;
    let confidence = Math.min(95, Math.max(15,
        Math.round(
            20 +
            Math.min(30, dailyPrices.length * 0.5) +
            Math.min(20, spanDays * 0.3) +
            (google ? 15 : 0) +
            Math.min(10, monthlyMedians.filter(m => m.count > 0).length * 1.5)
        )
    ));

    // ── Verdict ──
    let verdict: PriceForecast['verdict'];
    if (verdictScore >= 35) verdict = 'BUY_NOW';
    else if (verdictScore >= 15) verdict = 'BUY_SOON';
    else if (verdictScore <= -25) verdict = 'WAIT';
    else verdict = 'NEUTRAL';

    // ── Reasoning ──
    const reasoning: string[] = [];
    const bullish = signals.filter(s => s.direction === 'bullish').sort((a, b) => b.score - a.score);
    const bearish = signals.filter(s => s.direction === 'bearish').sort((a, b) => a.score - b.score);

    if (bullish.length > 0) {
        const names = bullish.map(s => s.name.toLowerCase()).join(', ');
        reasoning.push(`${bullish.length > 1 ? 'Plusieurs indicateurs sont en ta faveur' : 'Un indicateur est en ta faveur'}: ${names}.`);
    }
    if (bearish.length > 0) {
        const names = bearish.map(s => s.name.toLowerCase()).join(', ');
        reasoning.push(`${bearish.length > 1 ? 'Quelques points à surveiller' : 'Un point à surveiller'}: ${names}.`);
    }
    if (verdict === 'BUY_NOW') {
        reasoning.push('Tout indique que c\'est un très bon moment pour acheter!');
    } else if (verdict === 'BUY_SOON') {
        reasoning.push('Les conditions sont plutôt bonnes — garde un œil et achète bientôt.');
    } else if (verdict === 'WAIT') {
        reasoning.push('Les prix pourraient baisser prochainement — patience, surveille les prochains jours.');
    }

    // ── Forecast Curve (30 days) ──
    // Simple model: linear trend + seasonal adjustment + mean reversion pull
    const reg = ols(prices.slice(-30).map((p, i) => ({ x: i, y: p })));
    const lastPrice = prices[prices.length - 1];
    const monthlyValid = monthlyMedians.filter(m => m.count > 0);
    const overallAvg = monthlyValid.length > 0 ? mean(monthlyValid.map(m => m.median)) : m;

    const curve: ForecastCurvePoint[] = [];
    for (let d = 0; d <= 30; d++) {
        // Trend component
        const trendDelta = reg.slope * d;

        // Mean reversion pull (exponential decay toward mean)
        const reversionRate = 0.02; // 2% per day toward mean
        const reversionPull = (m - lastPrice) * (1 - Math.exp(-reversionRate * d));

        // Seasonal micro-adjustment
        const futureMonth = new Date(Date.now() + d * 86400000).getMonth();
        const futureMonthData = monthlyMedians.find(mm => mm.month === futureMonth);
        const seasonalAdj = futureMonthData && overallAvg > 0
            ? (futureMonthData.median / overallAvg - 1) * lastPrice * 0.1
            : 0;

        const predicted = Math.max(0, Math.round(lastPrice + trendDelta * 0.6 + reversionPull * 0.3 + seasonalAdj * 0.1));

        // Confidence band widens with time
        const bandWidth = sd * Math.sqrt(d / 7) * 1.2;
        const lower95 = Math.max(0, Math.round(predicted - 1.96 * bandWidth));
        const upper95 = Math.round(predicted + 1.96 * bandWidth);

        curve.push({ day: d, predicted, lower95, upper95 });
    }

    const predicted7d = curve.find(c => c.day === 7)?.predicted || lastPrice;
    const predicted14d = curve.find(c => c.day === 14)?.predicted || lastPrice;
    const predicted30d = curve.find(c => c.day === 30)?.predicted || lastPrice;

    // ── Optimal booking window ──
    let optMin = 0, optMax = 7;
    let optLabel = '';
    if (verdict === 'BUY_NOW') {
        optMin = 0; optMax = 3;
        optLabel = 'Achète dans les prochaines 48h pour le meilleur prix';
    } else if (verdict === 'BUY_SOON') {
        optMin = 3; optMax = 10;
        optLabel = 'Bon moment pour acheter dans les 3 à 10 prochains jours';
    } else if (verdict === 'WAIT') {
        // Find the predicted dip
        const minPredicted = curve.reduce((best, c) => c.predicted < best.predicted ? c : best);
        optMin = Math.max(5, minPredicted.day - 3);
        optMax = Math.min(30, minPredicted.day + 5);
        optLabel = `On prévoit de meilleurs prix dans environ ${minPredicted.day} jours`;
    } else {
        optMin = 0; optMax = 14;
        optLabel = 'Pas de moment idéal clair — tu peux acheter quand ça te convient';
    }

    // ── Data quality ──
    let level: PriceForecast['dataQuality']['level'] = 'limited';
    if (dailyPrices.length >= 60 && spanDays >= 50) level = 'excellent';
    else if (dailyPrices.length >= 30 && spanDays >= 25) level = 'good';
    else if (dailyPrices.length >= 10) level = 'fair';

    // ── Savings detail ──
    const lowestSeen = Math.min(...prices);
    const highestSeen = Math.max(...prices);
    const vsAvg = currentBestPrice - m;
    const vsAvgPct = m > 0 ? (vsAvg / m) * 100 : 0;
    const potentialSaving7d = currentBestPrice - predicted7d;
    const potentialSaving30d = currentBestPrice - predicted30d;

    const savingsDetail = {
        currentPrice: currentBestPrice,
        avgHistorical: Math.round(m),
        vsAvg: Math.round(vsAvg),
        vsAvgPct: Math.round(vsAvgPct),
        lowestSeen: Math.round(lowestSeen),
        highestSeen: Math.round(highestSeen),
        potentialSaving7d: Math.round(potentialSaving7d),
        potentialSaving30d: Math.round(potentialSaving30d),
    };

    // ── Next month comparison ──
    const monthNamesFr = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const nextMonthIdx = (currentMonth + 1) % 12;
    const curMonthData = monthlyMedians.find(mm => mm.month === currentMonth);
    const nextMonthData = monthlyMedians.find(mm => mm.month === nextMonthIdx);

    let nextMonthComparison: PriceForecast['nextMonthComparison'] = null;
    if (curMonthData && curMonthData.count > 0 && nextMonthData && nextMonthData.count > 0) {
        const diff = nextMonthData.median - curMonthData.median;
        let rec = '';
        if (diff < -30) {
            rec = `${monthNamesFr[nextMonthIdx]} est généralement ${Math.abs(Math.round(diff))}$ moins cher. Si tu peux attendre, ça vaut le coup!`;
        } else if (diff > 30) {
            rec = `Attention, ${monthNamesFr[nextMonthIdx]} est habituellement ${Math.round(diff)}$ plus cher. Mieux vaut acheter ce mois-ci.`;
        } else {
            rec = `Les prix sont similaires entre ${monthNamesFr[currentMonth]} et ${monthNamesFr[nextMonthIdx]}.`;
        }
        nextMonthComparison = {
            currentMonth: monthNamesFr[currentMonth],
            nextMonth: monthNamesFr[nextMonthIdx],
            currentMedian: curMonthData.median,
            nextMedian: nextMonthData.median,
            difference: Math.round(diff),
            recommendation: rec,
        };
    }

    // ── One-liner price context ──
    let priceContext = '';
    if (vsAvgPct <= -15) {
        priceContext = `Ce prix est ${Math.abs(Math.round(vsAvgPct))}% sous la moyenne — c'est rare, fonce!`;
    } else if (vsAvgPct <= -5) {
        priceContext = `Ce prix est ${Math.abs(Math.round(vsAvgPct))}% sous la moyenne habituelle. Bon deal.`;
    } else if (vsAvgPct >= 15) {
        priceContext = `Ce prix est ${Math.round(vsAvgPct)}% au-dessus de la moyenne. Attendre pourrait valoir le coup.`;
    } else if (vsAvgPct >= 5) {
        priceContext = `Ce prix est légèrement au-dessus de la moyenne (+${Math.round(vsAvgPct)}%).`;
    } else {
        priceContext = `Ce prix est dans la moyenne habituelle pour cette destination.`;
    }

    // ── Pronostic — concrete conversational forecast ──
    const pronostic = buildPronostic({
        verdict,
        currentBestPrice,
        predicted7d,
        predicted14d,
        predicted30d,
        curve,
        confidence,
        trend,
        seasonality,
        reversion,
        momentum,
        volatility,
        google,
        monthlyMedians,
        currentMonth,
        dailyPrices,
        m,
        sd,
        lowestSeen,
        highestSeen,
        vsAvg,
        vsAvgPct,
        spanDays,
        dailyPricesCount: dailyPrices.length,
    });

    return {
        verdict,
        verdictScore,
        confidence,
        reasoning,
        predicted7d,
        predicted14d,
        predicted30d,
        curve,
        signals,
        optimalWindow: { min: optMin, max: optMax, label: optLabel },
        dataQuality: { points: dailyPrices.length, spanDays, level },
        savingsDetail,
        nextMonthComparison,
        priceContext,
        pronostic,
    };
}

// ── Pronostic Builder — 3 clear reasons + monthly outlook ──

function buildPronostic(ctx: {
    verdict: PriceForecast['verdict'];
    currentBestPrice: number;
    predicted7d: number;
    predicted14d: number;
    predicted30d: number;
    curve: ForecastCurvePoint[];
    confidence: number;
    trend: ForecastSignal;
    seasonality: ForecastSignal;
    reversion: ForecastSignal;
    momentum: ForecastSignal;
    volatility: ForecastSignal;
    google: ForecastSignal | null;
    monthlyMedians: ForecastInput['monthlyMedians'];
    currentMonth: number;
    dailyPrices: Array<{ date: string; price: number }>;
    m: number;
    sd: number;
    lowestSeen: number;
    highestSeen: number;
    vsAvg: number;
    vsAvgPct: number;
    spanDays: number;
    dailyPricesCount: number;
}): PriceForecast['pronostic'] {
    const {
        verdict, currentBestPrice, predicted7d, predicted30d,
        curve, confidence,
        monthlyMedians, currentMonth, dailyPrices, m, sd,
        lowestSeen, vsAvg, vsAvgPct,
        spanDays, dailyPricesCount,
    } = ctx;

    const monthNamesFr = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    type Reason = PriceForecast['pronostic']['reasons'][0];

    // ── Reason 1: LE PRIX — Where does it stand vs history? ──
    let r1: Reason;
    if (dailyPricesCount >= 10) {
        const absVsAvg = Math.abs(Math.round(vsAvg));
        if (vsAvg < -10) {
            r1 = { icon: '✅', text: `Le prix est ${absVsAvg}$ sous la moyenne habituelle (${Math.round(m)}$)`, impact: 'positive' };
        } else if (vsAvg > 10) {
            r1 = { icon: '⚠️', text: `Le prix est ${absVsAvg}$ au-dessus de la moyenne habituelle (${Math.round(m)}$)`, impact: 'negative' };
        } else {
            r1 = { icon: '📊', text: `Le prix est dans la moyenne habituelle (${Math.round(m)}$)`, impact: 'neutral' };
        }
    } else {
        r1 = { icon: '📊', text: `Pas assez de données pour comparer le prix`, impact: 'neutral' };
    }

    // ── Reason 2: LA TENDANCE — Are prices going up or down? ──
    let r2: Reason;
    const recent14 = dailyPrices.slice(-14);
    if (recent14.length >= 5) {
        const reg14 = ols(recent14.map((p, i) => ({ x: i, y: p.price })));
        const weeklyChange = Math.round(reg14.slope * 7);
        if (weeklyChange <= -3) {
            r2 = { icon: '📉', text: `Les prix baissent (~${Math.abs(weeklyChange)}$/semaine ces derniers jours)`, impact: 'positive' };
        } else if (weeklyChange >= 3) {
            r2 = { icon: '📈', text: `Les prix montent (~${weeklyChange}$/semaine ces derniers jours)`, impact: 'negative' };
        } else {
            r2 = { icon: '➡️', text: `Les prix sont stables ces derniers jours`, impact: 'neutral' };
        }
    } else {
        r2 = { icon: '➡️', text: `Pas assez de jours de données pour voir la tendance`, impact: 'neutral' };
    }

    // ── Reason 3: LA SAISON — Is this a good or bad time of year? ──
    let r3: Reason;
    const validMonths = monthlyMedians.filter(mm => mm.count >= 2);
    if (validMonths.length >= 3) {
        const sorted = [...validMonths].sort((a, b) => a.median - b.median);
        const curMonthData = monthlyMedians.find(mm => mm.month === currentMonth);
        const rank = curMonthData ? sorted.findIndex(mm => mm.month === currentMonth) + 1 : 0;
        const cheapestMonth = sorted[0];
        const isCheap = rank > 0 && rank <= Math.ceil(sorted.length / 3);
        const isExpensive = rank > 0 && rank > Math.ceil(sorted.length * 2 / 3);

        if (isCheap) {
            r3 = { icon: '📅', text: `${cap(monthNamesFr[currentMonth])} est un des mois les moins chers (${rank}e sur ${sorted.length})`, impact: 'positive' };
        } else if (isExpensive && cheapestMonth) {
            r3 = { icon: '📅', text: `${cap(monthNamesFr[currentMonth])} est une période chère — le meilleur mois: ${monthNamesFr[cheapestMonth.month]} (${Math.round(cheapestMonth.median)}$)`, impact: 'negative' };
        } else {
            r3 = { icon: '📅', text: `${cap(monthNamesFr[currentMonth])} est un mois moyen pour les prix`, impact: 'neutral' };
        }
    } else {
        r3 = { icon: '📅', text: `Pas assez de mois de données pour l'analyse saisonnière`, impact: 'neutral' };
    }

    // ── VERDICT LINE ──
    let verdictLine = '';
    if (verdict === 'BUY_NOW') {
        if (vsAvg < -20) {
            verdictLine = `C'est le temps d'acheter — tu économises ${Math.abs(Math.round(vsAvg))}$ vs la moyenne.`;
        } else if (currentBestPrice <= lowestSeen * 1.05) {
            verdictLine = `C'est le temps d'acheter — prix proche du plus bas observé (${Math.round(lowestSeen)}$).`;
        } else {
            verdictLine = `C'est le temps d'acheter — les conditions sont favorables.`;
        }
    } else if (verdict === 'BUY_SOON') {
        const savPossible = Math.max(0, currentBestPrice - Math.min(predicted7d, predicted30d));
        if (savPossible > 15) {
            verdictLine = `Bon prix, surveille les prochains jours — possible baisse de ~${Math.round(savPossible)}$.`;
        } else {
            verdictLine = `C'est un bon moment — pas de baisse significative en vue.`;
        }
    } else if (verdict === 'WAIT') {
        const minPt = curve.reduce((best, c) => c.predicted < best.predicted ? c : best, curve[0]);
        const waitEst = Math.max(3, minPt.day);
        const savEst = Math.max(5, currentBestPrice - minPt.predicted);
        verdictLine = `Attends environ ${waitEst} jours — le prix pourrait baisser d'environ ${Math.round(savEst)}$.`;
    } else {
        verdictLine = `Prix normal — tu peux acheter quand ça te convient.`;
    }

    // ── MONTHLY OUTLOOK — next 3 months ──
    let monthlyOutlook: PriceForecast['pronostic']['monthlyOutlook'] = null;
    const outlookItems: Array<{ month: string; medianPrice: number; vsCurrent: number }> = [];
    for (let i = 1; i <= 3; i++) {
        const mIdx = (currentMonth + i) % 12;
        const mData = monthlyMedians.find(mm => mm.month === mIdx);
        if (mData && mData.count >= 2) {
            outlookItems.push({
                month: cap(monthNamesFr[mIdx]),
                medianPrice: Math.round(mData.median),
                vsCurrent: Math.round(mData.median - currentBestPrice),
            });
        }
    }
    if (outlookItems.length >= 2) {
        monthlyOutlook = outlookItems;
    }

    // ── CONFIDENCE NOTE ──
    let confidenceNote: string;
    if (confidence >= 70 && dailyPricesCount >= 40) {
        confidenceNote = `Basé sur ${dailyPricesCount} prix observés sur ${spanDays > 30 ? Math.round(spanDays / 30) + ' mois' : spanDays + ' jours'}`;
    } else if (confidence >= 45) {
        confidenceNote = `Basé sur ${dailyPricesCount} observations`;
    } else {
        confidenceNote = `Données limitées (${dailyPricesCount} obs.)`;
    }

    return {
        verdictLine,
        reasons: [r1, r2, r3],
        monthlyOutlook,
        confidenceNote,
    };
}
