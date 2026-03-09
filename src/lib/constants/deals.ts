export const DEAL_LEVELS: Record<string, { label: string; bg: string; icon: string }> = {
    lowest_ever: { label: 'PRIX RECORD', bg: '#7C3AED', icon: '⚡' },
    incredible: { label: 'INCROYABLE', bg: '#DC2626', icon: '🔥' },
    great: { label: 'SUPER DEAL', bg: '#EA580C', icon: '✨' },
    good: { label: 'BON PRIX', bg: '#2E7DDB', icon: '👍' },
};

export const CANADA_CODES = ['YYZ', 'YOW', 'YVR', 'YYC', 'YEG', 'YWG', 'YHZ', 'YQB'];

// ── Country → Cities mapping for explore deals (country-level) ──
// When a deal is country-level (code = "MX", "BS", etc.), show these sub-destinations
export interface SubDestination {
    city: string;
    code: string; // IATA airport code
    image: string;
}

export const COUNTRY_SUBDESTINATIONS: Record<string, SubDestination[]> = {
    'MX': [
        { city: 'Cancun', code: 'CUN', image: 'https://images.unsplash.com/photo-1520116468414-046603d3d63b?w=400&h=250&fit=crop' },
        { city: 'Mexico City', code: 'MEX', image: 'https://images.unsplash.com/photo-1518659526054-190340b32735?w=400&h=250&fit=crop' },
        { city: 'Puerto Vallarta', code: 'PVR', image: 'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?w=400&h=250&fit=crop' },
        { city: 'Los Cabos', code: 'SJD', image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=250&fit=crop' },
    ],
    'US': [
        { city: 'New York', code: 'JFK', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=250&fit=crop' },
        { city: 'Miami', code: 'MIA', image: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=400&h=250&fit=crop' },
        { city: 'Fort Lauderdale', code: 'FLL', image: 'https://images.unsplash.com/photo-1589083130544-0d6a2926e519?w=400&h=250&fit=crop' },
        { city: 'Los Angeles', code: 'LAX', image: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=400&h=250&fit=crop' },
        { city: 'Las Vegas', code: 'LAS', image: 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=400&h=250&fit=crop' },
        { city: 'Orlando', code: 'MCO', image: 'https://images.unsplash.com/photo-1575089776834-8be34f3e78b8?w=400&h=250&fit=crop' },
    ],
    'FR': [
        { city: 'Paris', code: 'CDG', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=250&fit=crop' },
        { city: 'Nice', code: 'NCE', image: 'https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=400&h=250&fit=crop' },
        { city: 'Lyon', code: 'LYS', image: 'https://images.unsplash.com/photo-1524396309943-e03f5249f002?w=400&h=250&fit=crop' },
        { city: 'Marseille', code: 'MRS', image: 'https://images.unsplash.com/photo-1590075865003-e48277faa558?w=400&h=250&fit=crop' },
    ],
    'ES': [
        { city: 'Barcelone', code: 'BCN', image: 'https://images.unsplash.com/photo-1583422874117-10d21bb26055?w=400&h=250&fit=crop' },
        { city: 'Madrid', code: 'MAD', image: 'https://images.unsplash.com/photo-1539330665512-75ca0ad9068b?w=400&h=250&fit=crop' },
        { city: 'Malaga', code: 'AGP', image: 'https://images.unsplash.com/photo-1564221710304-0b37c8b4a5a6?w=400&h=250&fit=crop' },
    ],
    'PT': [
        { city: 'Lisbonne', code: 'LIS', image: 'https://images.unsplash.com/photo-1585211777166-73269c464104?w=400&h=250&fit=crop' },
        { city: 'Porto', code: 'OPO', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&h=250&fit=crop' },
    ],
    'IT': [
        { city: 'Rome', code: 'FCO', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=250&fit=crop' },
        { city: 'Milan', code: 'MXP', image: 'https://images.unsplash.com/photo-1520440229-6469a149ac59?w=400&h=250&fit=crop' },
        { city: 'Venise', code: 'VCE', image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400&h=250&fit=crop' },
        { city: 'Florence', code: 'FLR', image: 'https://images.unsplash.com/photo-1543429258-c5ca3e1e295b?w=400&h=250&fit=crop' },
    ],
    'GB': [
        { city: 'Londres', code: 'LHR', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=250&fit=crop' },
        { city: 'Manchester', code: 'MAN', image: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=400&h=250&fit=crop' },
        { city: 'Edimbourg', code: 'EDI', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=250&fit=crop' },
    ],
    'DO': [
        { city: 'Punta Cana', code: 'PUJ', image: 'https://images.unsplash.com/photo-1535916707207-35f97e715e1c?w=400&h=250&fit=crop' },
        { city: 'Santo Domingo', code: 'SDQ', image: 'https://images.unsplash.com/photo-1588429290185-4e2e25a51db1?w=400&h=250&fit=crop' },
        { city: 'Puerto Plata', code: 'POP', image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=400&h=250&fit=crop' },
    ],
    'CU': [
        { city: 'La Havane', code: 'HAV', image: 'https://images.unsplash.com/photo-1500759285222-a95626b934cb?w=400&h=250&fit=crop' },
        { city: 'Varadero', code: 'VRA', image: 'https://images.unsplash.com/photo-1570345070170-51d6e8f38953?w=400&h=250&fit=crop' },
        { city: 'Cayo Coco', code: 'CCC', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=250&fit=crop' },
    ],
    'BS': [
        { city: 'Nassau', code: 'NAS', image: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=250&fit=crop' },
        { city: 'Freeport', code: 'FPO', image: 'https://images.unsplash.com/photo-1559827291-bce9ecaf3f6d?w=400&h=250&fit=crop' },
    ],
    'JM': [
        { city: 'Montego Bay', code: 'MBJ', image: 'https://images.unsplash.com/photo-1580237541049-2d715a09486e?w=400&h=250&fit=crop' },
        { city: 'Kingston', code: 'KIN', image: 'https://images.unsplash.com/photo-1573641890406-1413e3a0e0a0?w=400&h=250&fit=crop' },
    ],
    'CR': [
        { city: 'San Jose', code: 'SJO', image: 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=400&h=250&fit=crop' },
        { city: 'Liberia', code: 'LIR', image: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=400&h=250&fit=crop' },
    ],
    'CO': [
        { city: 'Bogota', code: 'BOG', image: 'https://images.unsplash.com/photo-1568385247005-0d371d214862?w=400&h=250&fit=crop' },
        { city: 'Cartagena', code: 'CTG', image: 'https://images.unsplash.com/photo-1583997052103-b4a1cb974ce5?w=400&h=250&fit=crop' },
        { city: 'Medellin', code: 'MDE', image: 'https://images.unsplash.com/photo-1599413987323-b2b8c0d187a2?w=400&h=250&fit=crop' },
    ],
    'BR': [
        { city: 'Sao Paulo', code: 'GRU', image: 'https://images.unsplash.com/photo-1554168848-a261d7180836?w=400&h=250&fit=crop' },
        { city: 'Rio de Janeiro', code: 'GIG', image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&h=250&fit=crop' },
    ],
    'PE': [
        { city: 'Lima', code: 'LIM', image: 'https://images.unsplash.com/photo-1531968455001-5c5272a67c71?w=400&h=250&fit=crop' },
        { city: 'Cusco', code: 'CUZ', image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400&h=250&fit=crop' },
    ],
    'AR': [
        { city: 'Buenos Aires', code: 'EZE', image: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=400&h=250&fit=crop' },
    ],
    'GR': [
        { city: 'Athenes', code: 'ATH', image: 'https://images.unsplash.com/photo-1503152394-c571994fd383?w=400&h=250&fit=crop' },
        { city: 'Santorin', code: 'JTR', image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=250&fit=crop' },
    ],
    'NL': [
        { city: 'Amsterdam', code: 'AMS', image: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=400&h=250&fit=crop' },
    ],
    'IE': [
        { city: 'Dublin', code: 'DUB', image: 'https://images.unsplash.com/photo-1549918837-33fb394ea33d?w=400&h=250&fit=crop' },
    ],
    'DE': [
        { city: 'Berlin', code: 'BER', image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&h=250&fit=crop' },
        { city: 'Munich', code: 'MUC', image: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=400&h=250&fit=crop' },
    ],
    'MA': [
        { city: 'Marrakech', code: 'RAK', image: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&h=250&fit=crop' },
        { city: 'Casablanca', code: 'CMN', image: 'https://images.unsplash.com/photo-1569383746724-6f1b882b8f46?w=400&h=250&fit=crop' },
    ],
    'TH': [
        { city: 'Bangkok', code: 'BKK', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579367?w=400&h=250&fit=crop' },
        { city: 'Phuket', code: 'HKT', image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400&h=250&fit=crop' },
    ],
    'JP': [
        { city: 'Tokyo', code: 'NRT', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=250&fit=crop' },
        { city: 'Osaka', code: 'KIX', image: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400&h=250&fit=crop' },
    ],
    'ID': [
        { city: 'Bali', code: 'DPS', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=250&fit=crop' },
        { city: 'Jakarta', code: 'CGK', image: 'https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=400&h=250&fit=crop' },
    ],
    'VN': [
        { city: 'Ho Chi Minh', code: 'SGN', image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=250&fit=crop' },
        { city: 'Hanoi', code: 'HAN', image: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=400&h=250&fit=crop' },
    ],
    'IS': [
        { city: 'Reykjavik', code: 'KEF', image: 'https://images.unsplash.com/photo-1504541982954-541e20faee3a?w=400&h=250&fit=crop' },
    ],
    'CA': [
        { city: 'Toronto', code: 'YYZ', image: 'https://images.unsplash.com/photo-1517090504332-e94e18675f74?w=400&h=250&fit=crop' },
        { city: 'Vancouver', code: 'YVR', image: 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=400&h=250&fit=crop' },
        { city: 'Calgary', code: 'YYC', image: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=400&h=250&fit=crop' },
        { city: 'Ottawa', code: 'YOW', image: 'https://images.unsplash.com/photo-1558025137-0b406e0f5765?w=400&h=250&fit=crop' },
        { city: 'Halifax', code: 'YHZ', image: 'https://images.unsplash.com/photo-1575320181282-9afab399332c?w=400&h=250&fit=crop' },
    ],
    'GT': [
        { city: 'Guatemala City', code: 'GUA', image: 'https://images.unsplash.com/photo-1546975554-31ddee5aa5ce?w=400&h=250&fit=crop' },
    ],
    'BB': [
        { city: 'Bridgetown', code: 'BGI', image: 'https://images.unsplash.com/photo-1570063578733-6e2b913788ab?w=400&h=250&fit=crop' },
    ],
    'BZ': [
        { city: 'Belize City', code: 'BZE', image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=250&fit=crop' },
    ],
    'TR': [
        { city: 'Istanbul', code: 'IST', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400&h=250&fit=crop' },
        { city: 'Antalya', code: 'AYT', image: 'https://images.unsplash.com/photo-1589491106922-a3e2c5c92f58?w=400&h=250&fit=crop' },
    ],
    'EG': [
        { city: 'Le Caire', code: 'CAI', image: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=400&h=250&fit=crop' },
    ],
    'IN': [
        { city: 'Delhi', code: 'DEL', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=250&fit=crop' },
        { city: 'Mumbai', code: 'BOM', image: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=400&h=250&fit=crop' },
    ],
    'KR': [
        { city: 'Seoul', code: 'ICN', image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=400&h=250&fit=crop' },
    ],
};

// Country-level images for Skyscanner Explore results
export const COUNTRY_IMAGES: Record<string, string> = {
    'France': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
    'Espagne': 'https://images.unsplash.com/photo-1583422874117-10d21bb26055?w=400',
    'Spain': 'https://images.unsplash.com/photo-1583422874117-10d21bb26055?w=400',
    'Portugal': 'https://images.unsplash.com/photo-1585211777166-73269c464104?w=400',
    'Italie': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400',
    'Italy': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400',
    'Grèce': 'https://images.unsplash.com/photo-1503152394-c571994fd383?w=400',
    'Greece': 'https://images.unsplash.com/photo-1503152394-c571994fd383?w=400',
    'Royaume-Uni': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400',
    'United Kingdom': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400',
    'Irlande': 'https://images.unsplash.com/photo-1549918837-33fb394ea33d?w=400',
    'Ireland': 'https://images.unsplash.com/photo-1549918837-33fb394ea33d?w=400',
    'Pays-Bas': 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=400',
    'Netherlands': 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=400',
    'Allemagne': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400',
    'Germany': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400',
    'Maroc': 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400',
    'Morocco': 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400',
    'Japon': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
    'Japan': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
    'Thaïlande': 'https://images.unsplash.com/photo-1508009603885-50cf7c579367?w=400',
    'Thailand': 'https://images.unsplash.com/photo-1508009603885-50cf7c579367?w=400',
    'Indonésie': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400',
    'Indonesia': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400',
    'Mexique': 'https://images.unsplash.com/photo-1520116468414-046603d3d63b?w=400',
    'Mexico': 'https://images.unsplash.com/photo-1520116468414-046603d3d63b?w=400',
    'États-Unis': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
    'United States of America': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
    'Canada': 'https://images.unsplash.com/photo-1517090504332-e94e18675f74?w=400',
    'Cuba': 'https://images.unsplash.com/photo-1500759285222-a95626b934cb?w=400',
    'République dominicaine': 'https://images.unsplash.com/photo-1535916707207-35f97e715e1c?w=400',
    'Dominican Republic': 'https://images.unsplash.com/photo-1535916707207-35f97e715e1c?w=400',
    'Colombie': 'https://images.unsplash.com/photo-1568385247005-0d371d214862?w=400',
    'Colombia': 'https://images.unsplash.com/photo-1568385247005-0d371d214862?w=400',
    'Pérou': 'https://images.unsplash.com/photo-1531968455001-5c5272a67c71?w=400',
    'Peru': 'https://images.unsplash.com/photo-1531968455001-5c5272a67c71?w=400',
    'Brésil': 'https://images.unsplash.com/photo-1554168848-a261d7180836?w=400',
    'Brazil': 'https://images.unsplash.com/photo-1554168848-a261d7180836?w=400',
    'Argentine': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=400',
    'Argentina': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=400',
    'Islande': 'https://images.unsplash.com/photo-1504541982954-541e20faee3a?w=400',
    'Iceland': 'https://images.unsplash.com/photo-1504541982954-541e20faee3a?w=400',
    'Jamaïque': 'https://images.unsplash.com/photo-1580237541049-2d715a09486e?w=400',
    'Jamaica': 'https://images.unsplash.com/photo-1580237541049-2d715a09486e?w=400',
    'Costa Rica': 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=400',
    'Vietnam': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400',
    'Bahamas': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400',
    'Guatemala': 'https://images.unsplash.com/photo-1546975554-31ddee5aa5ce?w=400',
    'Barbade': 'https://images.unsplash.com/photo-1570063578733-6e2b913788ab?w=400',
    'Belize': 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400',
    'Trinité-et-Tobago': 'https://images.unsplash.com/photo-1585207693032-2a9edb81a64a?w=400',
    'Turquie': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400',
    'Inde': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400',
    'Corée du Sud': 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=400',
    'Égypte': 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=400',
};

export const CITY_IMAGES: Record<string, string> = {
    'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
    'Londres': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400',
    'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400',
    'Barcelone': 'https://images.unsplash.com/photo-1583422874117-10d21bb26055?w=400',
    'Lisbonne': 'https://images.unsplash.com/photo-1585211777166-73269c464104?w=400',
    'Athènes': 'https://images.unsplash.com/photo-1503152394-c571994fd383?w=400',
    'Dublin': 'https://images.unsplash.com/photo-1549918837-33fb394ea33d?w=400',
    'Amsterdam': 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=400',
    'Madrid': 'https://images.unsplash.com/photo-1539330665512-75ca0ad9068b?w=400',
    'Porto': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400',
    'Marrakech': 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400',
    'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
    'Bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579367?w=400',
    'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400',
    'Cancún': 'https://images.unsplash.com/photo-1520116468414-046603d3d63b?w=400',
    'Miami': 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=400',
    'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
    'Reykjavik': 'https://images.unsplash.com/photo-1504541982954-541e20faee3a?w=400',
    'Toronto': 'https://images.unsplash.com/photo-1517090504332-e94e18675f74?w=400&h=250&fit=crop',
    'Ottawa': 'https://images.unsplash.com/photo-1558025137-0b406e0f5765?w=400&h=250&fit=crop',
    'Vancouver': 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=400&h=250&fit=crop',
    'Calgary': 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=400&h=250&fit=crop',
    'Edmonton': 'https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?w=400&h=250&fit=crop',
    'Winnipeg': 'https://images.unsplash.com/photo-1560388259-2b8845dd4ee7?w=400&h=250&fit=crop',
    'Halifax': 'https://images.unsplash.com/photo-1575320181282-9afab399332c?w=400&h=250&fit=crop',
    'Québec': 'https://images.unsplash.com/photo-1545396280-acdb7441dd2e?w=400&h=250&fit=crop',
    'Fort Lauderdale': 'https://images.unsplash.com/photo-1589083130544-0d6a2926e519?w=400&h=250&fit=crop',
    'Punta Cana': 'https://images.unsplash.com/photo-1535916707207-35f97e715e1c?w=400&h=250&fit=crop',
    'Berlin': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&h=250&fit=crop',
    'La Havane': 'https://images.unsplash.com/photo-1500759285222-a95626b934cb?w=400&h=250&fit=crop',
    'Bogota': 'https://images.unsplash.com/photo-1568385247005-0d371d214862?w=400&h=250&fit=crop',
    'Lima': 'https://images.unsplash.com/photo-1531968455001-5c5272a67c71?w=400&h=250&fit=crop',
    'São Paulo': 'https://images.unsplash.com/photo-1554168848-a261d7180836?w=400&h=250&fit=crop',
    'Buenos Aires': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=400&h=250&fit=crop',
    'Los Angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=400&h=250&fit=crop',
    'Montego Bay': 'https://images.unsplash.com/photo-1580237541049-2d715a09486e?w=400&h=250&fit=crop',
    'San José': 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=400&h=250&fit=crop',
    'Cartagena': 'https://images.unsplash.com/photo-1583997052103-b4a1cb974ce5?w=400&h=250&fit=crop',
    'Ho Chi Minh': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=250&fit=crop',
    'Cuba (Varadero)': 'https://images.unsplash.com/photo-1570345070170-51d6e8f38953?w=400&h=250&fit=crop',
};

export const DEFAULT_CITY_IMAGE = 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=250&fit=crop';
