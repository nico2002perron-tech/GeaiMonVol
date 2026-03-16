import { MetadataRoute } from 'next';

const DESTINATION_CODES = [
    'CDG', 'CUN', 'PUJ', 'VRA', 'HAV', 'FLL', 'JFK', 'BCN', 'LIS', 'FCO',
    'LHR', 'RAK', 'BKK', 'NRT', 'BOG', 'LIM', 'GRU', 'DPS', 'MIA', 'LAX',
    'KEF', 'ATH', 'DUB', 'AMS', 'OPO', 'MBJ', 'SJO', 'CTG', 'EZE', 'SGN',
    'MAD', 'BER', 'YYZ', 'YOW', 'YVR', 'YYC', 'YEG', 'YWG', 'YHZ', 'YQB',
];

export default function sitemap(): MetadataRoute.Sitemap {
    return DESTINATION_CODES.map(code => ({
        url: `https://geaimonvol.com/destination/${code}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
    }));
}
