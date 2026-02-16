import { FLIGHTS, Flight } from './flights';

export interface Region {
    name: string;
    emoji: string;
    countries: string[];
    deals: Flight[];
}

// Mapping TopoJSON English names → French names used in our regions
const COUNTRY_NAME_MAP: Record<string, string> = {
    // Europe
    "France": "France",
    "Spain": "Espagne",
    "Portugal": "Portugal",
    "Italy": "Italie",
    "Germany": "Allemagne",
    "United Kingdom": "Royaume-Uni",
    "Greece": "Grèce",
    "Netherlands": "Pays-Bas",
    "Belgium": "Belgique",
    "Switzerland": "Suisse",
    "Ireland": "Irlande",
    "Norway": "Norvège",
    "Sweden": "Suède",
    "Finland": "Finlande",
    "Denmark": "Danemark",
    "Poland": "Pologne",
    "Czech Rep.": "Tchéquie",
    "Austria": "Autriche",
    "Hungary": "Hongrie",
    "Romania": "Roumanie",
    "Bulgaria": "Bulgarie",
    "Serbia": "Serbie",
    "Croatia": "Croatie",
    "Bosnia and Herz.": "Bosnie",
    "Albania": "Albanie",
    "North Macedonia": "Macédoine du Nord",
    "Ukraine": "Ukraine",
    "Belarus": "Biélorussie",
    "Lithuania": "Lituanie",
    "Latvia": "Lettonie",
    "Estonia": "Estonie",
    "Slovakia": "Slovaquie",
    "Slovenia": "Slovénie",
    "Iceland": "Islande",
    "Turkey": "Turquie",
    "Russia": "Russie",
    "Moldova": "Moldavie",
    "Montenegro": "Monténégro",
    "Luxembourg": "Luxembourg",
    "Cyprus": "Chypre",

    // Asie
    "Japan": "Japon",
    "Thailand": "Thaïlande",
    "Indonesia": "Indonésie",
    "Vietnam": "Vietnam",
    "South Korea": "Corée du Sud",
    "China": "Chine",
    "India": "Inde",
    "Philippines": "Philippines",
    "Malaysia": "Malaisie",
    "Myanmar": "Myanmar",
    "Cambodia": "Cambodge",
    "Laos": "Laos",
    "Taiwan": "Taïwan",
    "Mongolia": "Mongolie",
    "Kazakhstan": "Kazakhstan",
    "Uzbekistan": "Ouzbékistan",
    "Pakistan": "Pakistan",
    "Bangladesh": "Bangladesh",
    "Sri Lanka": "Sri Lanka",
    "Nepal": "Népal",
    "Iran": "Iran",
    "Iraq": "Irak",
    "Saudi Arabia": "Arabie saoudite",
    "Yemen": "Yémen",
    "Oman": "Oman",
    "United Arab Emirates": "Émirats arabes unis",
    "Qatar": "Qatar",
    "Kuwait": "Koweït",
    "Jordan": "Jordanie",
    "Israel": "Israël",
    "Lebanon": "Liban",
    "Syria": "Syrie",
    "Georgia": "Géorgie",
    "Armenia": "Arménie",
    "Azerbaijan": "Azerbaïdjan",
    "Turkmenistan": "Turkménistan",
    "Tajikistan": "Tadjikistan",
    "Kyrgyzstan": "Kirghizistan",
    "Afghanistan": "Afghanistan",
    "Bhutan": "Bhoutan",

    // Amérique du Nord
    "United States of America": "États-Unis",
    "United States": "États-Unis",
    "Mexico": "Mexique",
    "Canada": "Canada",
    "Greenland": "Groenland",

    // Amérique du Sud
    "Brazil": "Brésil",
    "Argentina": "Argentine",
    "Colombia": "Colombie",
    "Peru": "Pérou",
    "Chile": "Chili",
    "Venezuela": "Venezuela",
    "Ecuador": "Équateur",
    "Bolivia": "Bolivie",
    "Paraguay": "Paraguay",
    "Uruguay": "Uruguay",
    "Guyana": "Guyana",
    "Suriname": "Suriname",
    "Fr. S. Antarctic Lands": "TAAF",
    "French Guiana": "Guyane",

    // Afrique
    "Morocco": "Maroc",
    "Tunisia": "Tunisie",
    "Senegal": "Sénégal",
    "South Africa": "Afrique du Sud",
    "Egypt": "Égypte",
    "Algeria": "Algérie",
    "Libya": "Libye",
    "Niger": "Niger",
    "Mali": "Mali",
    "Chad": "Tchad",
    "Sudan": "Soudan",
    "Ethiopia": "Éthiopie",
    "Somalia": "Somalie",
    "Kenya": "Kenya",
    "Tanzania": "Tanzanie",
    "Dem. Rep. Congo": "RD Congo",
    "Congo": "Congo",
    "Angola": "Angola",
    "Namibia": "Namibie",
    "Mozambique": "Mozambique",
    "Madagascar": "Madagascar",
    "Cameroon": "Cameroun",
    "Nigeria": "Nigéria",
    "Ghana": "Ghana",
    "Ivory Coast": "Côte d'Ivoire",
    "Mauritania": "Mauritanie",
    "Guinea": "Guinée",
    "Burkina Faso": "Burkina Faso",
    "Benin": "Bénin",
    "Togo": "Togo",
    "Gabon": "Gabon",
    "Uganda": "Ouganda",
    "Rwanda": "Rwanda",
    "Zambia": "Zambie",
    "Zimbabwe": "Zimbabwe",
    "Botswana": "Botswana",
    "Malawi": "Malawi",
    "Central African Rep.": "République centrafricaine",
    "S. Sudan": "Soudan du Sud",
    "Djibouti": "Djibouti",
    "Eritrea": "Érythrée",
    "Sierra Leone": "Sierra Leone",
    "Liberia": "Libéria",
    "Guinea-Bissau": "Guinée-Bissau",
    "Gambia": "Gambie",
    "Eq. Guinea": "Guinée équatoriale",
    "Lesotho": "Lesotho",
    "eSwatini": "Eswatini",
    "Burundi": "Burundi",
    "Western Sahara": "Sahara occidental",

    // Caraïbes & Amérique Centrale
    "Cuba": "Cuba",
    "Dominican Rep.": "République Dominicaine",
    "Dominican Republic": "République Dominicaine",
    "Jamaica": "Jamaïque",
    "Haiti": "Haïti",
    "Bahamas": "Bahamas",
    "Puerto Rico": "Porto Rico",
    "Guatemala": "Guatemala",
    "Belize": "Belize",
    "Honduras": "Honduras",
    "El Salvador": "Salvador",
    "Nicaragua": "Nicaragua",
    "Costa Rica": "Costa Rica",
    "Panama": "Panama",

    // Océanie
    "Australia": "Australie",
    "New Zealand": "Nouvelle-Zélande",
    "Papua New Guinea": "Papouasie-Nouvelle-Guinée",
    "Fiji": "Fidji",
    "Solomon Is.": "Îles Salomon",
    "Vanuatu": "Vanuatu",
    "New Caledonia": "Nouvelle-Calédonie",
};

export const REGIONS: Record<string, Region> = {
    europe: {
        name: "Europe",
        emoji: "🇪🇺",
        countries: [
            "France", "Espagne", "Portugal", "Italie", "Allemagne", "Royaume-Uni", "Grèce", "Pays-Bas", "Belgique", "Suisse",
            "Irlande", "Norvège", "Suède", "Finlande", "Danemark", "Pologne", "Tchéquie", "Autriche", "Hongrie", "Roumanie",
            "Bulgarie", "Serbie", "Croatie", "Bosnie", "Albanie", "Macédoine du Nord", "Ukraine", "Biélorussie", "Lituanie",
            "Lettonie", "Estonie", "Slovaquie", "Slovénie", "Islande", "Russie", "Moldavie", "Monténégro", "Luxembourg",
            "Chypre", "Turquie", "Géorgie", "Arménie", "Azerbaïdjan", "Malte"
        ],
        deals: FLIGHTS.filter((f) =>
            ["France", "Espagne", "Portugal", "Italie"].includes(f.country)
        ),
    },
    asie: {
        name: "Asie",
        emoji: "🌏",
        countries: [
            "Japon", "Thaïlande", "Indonésie", "Vietnam", "Corée du Sud", "Chine", "Inde", "Philippines", "Malaisie",
            "Myanmar", "Cambodge", "Laos", "Taïwan", "Mongolie", "Kazakhstan", "Ouzbékistan", "Pakistan", "Bangladesh",
            "Sri Lanka", "Népal", "Iran", "Irak", "Arabie saoudite", "Yémen", "Oman", "Émirats arabes unis", "Qatar",
            "Koweït", "Jordanie", "Israël", "Liban", "Syrie", "Turkménistan", "Tadjikistan", "Kirghizistan", "Afghanistan",
            "Bhoutan"
        ],
        deals: FLIGHTS.filter((f) =>
            ["Japon", "Thaïlande", "Indonésie"].includes(f.country)
        ),
    },
    amerique_nord: {
        name: "Amérique du Nord",
        emoji: "🇺🇸",
        countries: ["États-Unis", "Mexique", "Canada", "Groenland"],
        deals: FLIGHTS.filter((f) =>
            ["États-Unis", "Mexique"].includes(f.country)
        ),
    },
    amerique_sud: {
        name: "Amérique du Sud",
        emoji: "🌎",
        countries: [
            "Brésil", "Argentine", "Colombie", "Pérou", "Chili", "Venezuela", "Équateur", "Bolivie", "Paraguay",
            "Uruguay", "Guyana", "Suriname", "TAAF", "Guyane"
        ],
        deals: [],
    },
    afrique: {
        name: "Afrique",
        emoji: "🌍",
        countries: [
            "Maroc", "Tunisie", "Sénégal", "Afrique du Sud", "Égypte", "Algérie", "Libye", "Niger", "Mali", "Tchad",
            "Soudan", "Éthiopie", "Somalie", "Kenya", "Tanzanie", "RD Congo", "Congo", "Angola", "Namibie", "Mozambique",
            "Madagascar", "Cameroun", "Nigéria", "Ghana", "Côte d'Ivoire", "Mauritanie", "Guinée", "Burkina Faso",
            "Bénin", "Togo", "Gabon", "Ouganda", "Rwanda", "Zambie", "Zimbabwe", "Botswana", "Malawi",
            "République centrafricaine", "Soudan du Sud", "Djibouti", "Érythrée", "Sierra Leone", "Libéria",
            "Guinée-Bissau", "Gambie", "Guinée équatoriale", "Lesotho", "Eswatini", "Burundi", "Sahara occidental"
        ],
        deals: FLIGHTS.filter((f) => ["Maroc"].includes(f.country)),
    },
    caraibes: {
        name: "Caraïbes",
        emoji: "🏝️",
        countries: [
            "Cuba", "République Dominicaine", "Jamaïque", "Haïti", "Bahamas", "Porto Rico", "Guatemala", "Belize",
            "Honduras", "Salvador", "Nicaragua", "Costa Rica", "Panama"
        ],
        deals: [],
    },
    oceanie: {
        name: "Océanie",
        emoji: "🦘",
        countries: [
            "Australie", "Nouvelle-Zélande", "Papouasie-Nouvelle-Guinée", "Fidji", "Îles Salomon", "Vanuatu",
            "Nouvelle-Calédonie"
        ],
        deals: []
    }
};

export function getRegionForCountry(country: string): string | null {
    // Try direct match first (French name)
    for (const [regionKey, region] of Object.entries(REGIONS)) {
        if (region.countries.includes(country)) {
            return regionKey;
        }
    }
    // Try mapping from English name
    const frenchName = COUNTRY_NAME_MAP[country];
    if (frenchName) {
        for (const [regionKey, region] of Object.entries(REGIONS)) {
            if (region.countries.includes(frenchName)) {
                return regionKey;
            }
        }
    }
    return null;
}
