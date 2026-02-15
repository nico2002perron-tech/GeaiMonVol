import { FLIGHTS, Flight } from './flights';

export interface Region {
    name: string;
    emoji: string;
    countries: string[];
    deals: Flight[];
}

export const REGIONS: Record<string, Region> = {
    europe: {
        name: "Europe",
        emoji: "🇪🇺",
        countries: [
            "France", "Espagne", "Portugal", "Italie", "Allemagne",
            "Royaume-Uni", "Grèce", "Pays-Bas", "Belgique", "Suisse",
        ],
        deals: FLIGHTS.filter((f) =>
            ["France", "Espagne", "Portugal", "Italie"].includes(f.country)
        ),
    },
    asie: {
        name: "Asie",
        emoji: "🌏",
        countries: [
            "Japon", "Thaïlande", "Indonésie", "Vietnam",
            "Corée du Sud", "Chine", "Inde", "Philippines", "Malaisie",
        ],
        deals: FLIGHTS.filter((f) =>
            ["Japon", "Thaïlande", "Indonésie"].includes(f.country)
        ),
    },
    amerique_nord: {
        name: "Amérique du Nord",
        emoji: "🇺🇸",
        countries: ["États-Unis", "Mexique"],
        deals: FLIGHTS.filter((f) =>
            ["États-Unis", "Mexique"].includes(f.country)
        ),
    },
    afrique: {
        name: "Afrique",
        emoji: "🌍",
        countries: ["Maroc", "Tunisie", "Sénégal", "Afrique du Sud", "Égypte"],
        deals: FLIGHTS.filter((f) => ["Maroc"].includes(f.country)),
    },
    caraibes: {
        name: "Caraïbes",
        emoji: "🏝️",
        countries: ["Cuba", "République Dominicaine", "Jamaïque"],
        deals: [],
    },
};

export function getRegionForCountry(country: string): string | null {
    for (const [regionKey, region] of Object.entries(REGIONS)) {
        if (region.countries.includes(country)) {
            return regionKey;
        }
    }
    return null;
}
