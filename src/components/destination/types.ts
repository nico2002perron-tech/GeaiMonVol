export interface FlightDeal {
    price: number;
    currency: string;
    airline: string;
    airlineLogo?: string;
    stops: number;
    departureDate: string;
    returnDate: string;
    durationMinutes: number;
    bookingLink: string;
    source: string;
    scannedAt: string;
    discount?: number;
    dealLevel?: string;
    tripNights?: number;
}

export interface HotelInfo {
    name: string;
    stars: number;
    pricePerNight: number;
    totalPrice: number;
    nights: number;
    rating: number;
    reviewCount: number;
    imageUrl: string;
    bookingUrl: string;
    isAllInclusive: boolean;
    amenities?: string[];
}

export interface TravelIntel {
    tagline: string;
    overallScore: number;
    weather: {
        bestMonths: string[];
        avoidMonths: string[];
        rainyMonths: string[];
        hurricaneRisk: string | null;
        avgTempHigh: { winter: number; summer: number };
        avgTempLow: { winter: number; summer: number };
        waterTemp?: { winter: number; summer: number };
        summary: string;
    };
    beach: {
        hasBeach: boolean;
        algaeSeason: string | null;
        jellyfishRisk: string | null;
        waterClarity: string | null;
        bestBeaches: string[] | null;
        tip: string | null;
    };
    crowds: {
        peakMonths: string[];
        shoulderMonths: string[];
        lowSeasonMonths: string[];
        springBreakWarning: string | null;
        tip: string;
    };
    budget: {
        dailyBudgetLow: number;
        dailyBudgetMid: number;
        dailyBudgetHigh: number;
        currency: string;
        currencyCode: string;
        exchangeInfo: string;
        mealCheap: string;
        mealMid: string;
        mealFancy: string;
        beerPrice: string;
        tipping: string;
        costOfLiving: string;
    };
    practical: {
        visa: string;
        vaccines: string | null;
        safety: string;
        safetyScore: number;
        language: string;
        english: string;
        timezone: string;
        plugType: string;
        cellService: string;
        drinkingWater: string;
        flightTime: string;
    };
    culture: {
        dos: string[];
        donts: string[];
        dressCode: string;
        bargaining: string | null;
        religion: string;
        festivals: string[];
    };
    food: {
        mustTry: Array<{ name: string; description: string; price: string }>;
        bestFoodAreas: string[];
        streetFood: string | null;
        foodSafety: string;
        alcohol: string;
    };
    monthlyMatrix: Array<{
        month: string;
        weather: number;
        crowd: number;
        price: number;
        overall: number;
    }>;
    proTips: string[];
    dayTrips: Array<{ name: string; description: string; distance: string; cost: string }>;
    transportation: {
        fromAirport: string;
        localTransport: string;
        uber: string;
        renting: string | null;
    };
}

export interface ForecastData {
    verdict: 'BUY_NOW' | 'BUY_SOON' | 'WAIT' | 'NEUTRAL';
    verdictScore: number;
    confidence: number;
    reasoning: string[];
    predicted7d: number;
    predicted14d: number;
    predicted30d: number;
    curve: Array<{ day: number; predicted: number; lower95: number; upper95: number }>;
    signals: Array<{ name: string; direction: 'bullish' | 'bearish' | 'neutral'; strength: number; score: number; label: string; detail: string }>;
    optimalWindow: { min: number; max: number; label: string };
    dataQuality: { points: number; spanDays: number; level: string };
    pronostic?: {
        verdictLine: string;
        reasons: Array<{ icon: string; text: string; impact: 'positive' | 'negative' | 'neutral' }>;
        monthlyOutlook: Array<{ month: string; medianPrice: number; vsCurrent: number }> | null;
        confidenceNote: string;
    };
}

export interface MonthStats {
    month: number;
    median: number;
    avg: number;
    min: number;
    max: number;
    p25: number;
    p75: number;
    count: number;
    topAirline: string | null;
}

export interface PackAnalysis {
    history: { currentPackPrice: number; avgFlightPrice90d: number; medianFlightPrice90d: number; priceChange: number; dataPoints: number };
    savings: { vsMedian: number; vsBookingSeparately: number; totalSavingsPercent: number };
    aiAnalysis: { verdict: string; confidence: number; summary: string; pros: string[]; cons: string[]; bestTimeAdvice: string };
    hotelHighlights: { scoreDescription: string; topAmenities: string[]; aiReview: string };
}
