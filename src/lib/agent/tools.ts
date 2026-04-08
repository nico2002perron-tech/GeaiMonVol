// ============================================
// GeaiAI Agent — Tool Definitions
// Anthropic SDK tool_use format
// ============================================

import type Anthropic from '@anthropic-ai/sdk';

/**
 * Chaque outil a :
 *  - name : identifiant unique
 *  - description : ce que Claude voit pour décider quand l'utiliser
 *  - input_schema : JSON Schema des paramètres
 */
export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'chercher_deals',
    description:
      "Cherche les meilleurs deals de vols disponibles en ce moment au départ de Montréal. " +
      "Utilise cet outil quand l'utilisateur demande les deals actuels, les bons prix, ou veut savoir où voyager pour pas cher.",
    input_schema: {
      type: 'object' as const,
      properties: {
        budget_max: {
          type: 'number',
          description: "Budget maximum en CAD (optionnel). Si l'utilisateur mentionne un budget, passe-le ici.",
        },
        continent: {
          type: 'string',
          description: "Filtrer par continent : 'europe', 'ameriques', 'asie', 'afrique', 'caraibes' (optionnel).",
        },
      },
      required: [],
    },
  },
  {
    name: 'chercher_vols',
    description:
      "Cherche des vols spécifiques vers une destination précise avec des dates. " +
      "Utilise cet outil quand l'utilisateur demande les prix vers une ville/pays spécifique.",
    input_schema: {
      type: 'object' as const,
      properties: {
        destination_code: {
          type: 'string',
          description: "Code IATA de l'aéroport de destination (ex: CDG pour Paris, CUN pour Cancún, BCN pour Barcelone).",
        },
        destination_city: {
          type: 'string',
          description: "Nom de la ville de destination.",
        },
      },
      required: ['destination_code', 'destination_city'],
    },
  },
  {
    name: 'historique_prix',
    description:
      "Consulte l'historique des prix (90 derniers jours) pour une destination. " +
      "Utilise cet outil pour savoir si le prix actuel est bon, voir les tendances, ou comparer.",
    input_schema: {
      type: 'object' as const,
      properties: {
        destination: {
          type: 'string',
          description: "Nom de la destination (ex: 'Paris', 'Cancún').",
        },
        destination_code: {
          type: 'string',
          description: "Code IATA (ex: 'CDG', 'CUN').",
        },
      },
      required: ['destination'],
    },
  },
  {
    name: 'ajouter_watchlist',
    description:
      "Ajoute une destination à la watchlist de l'utilisateur pour recevoir des alertes de prix. " +
      "Utilise cet outil quand l'utilisateur dit vouloir surveiller un prix ou recevoir une alerte.",
    input_schema: {
      type: 'object' as const,
      properties: {
        destination: {
          type: 'string',
          description: "Nom de la destination à surveiller.",
        },
        target_price: {
          type: 'number',
          description: "Prix cible en CAD — l'alerte se déclenche quand le prix descend en-dessous.",
        },
      },
      required: ['destination'],
    },
  },
  {
    name: 'info_destination',
    description:
      "Obtient des informations complètes sur une destination : météo, culture, budget estimé, " +
      "quoi faire, où manger, meilleur moment pour visiter. Utilise cet outil quand l'utilisateur " +
      "veut en savoir plus sur un endroit avant de réserver.",
    input_schema: {
      type: 'object' as const,
      properties: {
        destination: {
          type: 'string',
          description: "Nom de la destination.",
        },
        mois: {
          type: 'string',
          description: "Mois de voyage visé (optionnel, ex: 'juin', 'décembre').",
        },
      },
      required: ['destination'],
    },
  },
];

// Map des codes IATA pour les destinations populaires
export const IATA_CODES: Record<string, string> = {
  paris: 'CDG', cancun: 'CUN', 'cancún': 'CUN',
  'punta cana': 'PUJ', varadero: 'VRA', 'la havane': 'HAV',
  'fort lauderdale': 'FLL', 'new york': 'JFK', barcelone: 'BCN',
  lisbonne: 'LIS', rome: 'FCO', londres: 'LHR',
  marrakech: 'RAK', bangkok: 'BKK', tokyo: 'NRT',
  bogota: 'BOG', lima: 'LIM', 'são paulo': 'GRU', 'sao paulo': 'GRU',
  bali: 'DPS', miami: 'MIA', 'los angeles': 'LAX',
  reykjavik: 'KEF', athènes: 'ATH', dublin: 'DUB',
  amsterdam: 'AMS', porto: 'OPO', 'montego bay': 'MBJ',
  'san josé': 'SJO', 'san jose': 'SJO', cartagena: 'CTG',
  'buenos aires': 'EZE', 'ho chi minh': 'SGN',
  madrid: 'MAD', berlin: 'BER', séoul: 'ICN', seoul: 'ICN',
  'le caire': 'CAI', istanbul: 'IST', 'las vegas': 'LAS',
  toronto: 'YYZ', vancouver: 'YVR', calgary: 'YYC',
};

// Mapping continent -> pays pour le filtre
export const CONTINENT_COUNTRIES: Record<string, string[]> = {
  europe: ['France', 'Espagne', 'Portugal', 'Italie', 'Royaume-Uni', 'Allemagne', 'Pays-Bas', 'Irlande', 'Grèce', 'Islande', 'Turquie'],
  ameriques: ['États-Unis', 'Canada', 'Colombie', 'Pérou', 'Brésil', 'Argentine', 'Costa Rica', 'Guatemala'],
  asie: ['Thaïlande', 'Japon', 'Indonésie', 'Vietnam', 'Corée du Sud'],
  afrique: ['Maroc', 'Égypte'],
  caraibes: ['Mexique', 'Rép. Dominicaine', 'Cuba', 'Jamaïque', 'Barbade'],
};
