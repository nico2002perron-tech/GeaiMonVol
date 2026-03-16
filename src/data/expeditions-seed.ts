export interface ExpeditionSeed {
    slug: string;
    title: string;
    destinationCode: string;
    totalNights: number;
    difficulty: 'easy' | 'moderate' | 'adventurous';
    tags: string[];
    coverImage: string;
    descriptionFr: string;
    stops: {
        stopOrder: number;
        city: string;
        country: string;
        nights: number;
        descriptionFr: string;
        highlights: string[];
        accommodationType: string;
        lat: number;
        lng: number;
    }[];
}

export const EXPEDITIONS: ExpeditionSeed[] = [
    {
        slug: 'bali-14-jours',
        title: 'Bali — L\'île des dieux',
        destinationCode: 'DPS',
        totalNights: 14,
        difficulty: 'moderate',
        tags: ['Culture', 'Plage', 'Nature'],
        coverImage: '/expeditions/bali.jpg',
        descriptionFr: 'Explore Bali en 14 jours : des rizières d\'Ubud aux plages de Seminyak, en passant par les falaises de Nusa Penida et l\'ambiance surf de Canggu.',
        stops: [
            { stopOrder: 1, city: 'Ubud', country: 'Indonésie', nights: 4, descriptionFr: 'Cœur culturel de Bali. Rizières en terrasses, temples et marchés d\'artisanat.', highlights: ['Tegallalang Rice Terraces', 'Monkey Forest', 'Tirta Empul Temple'], accommodationType: 'villa', lat: -8.5069, lng: 115.2625 },
            { stopOrder: 2, city: 'Seminyak', country: 'Indonésie', nights: 4, descriptionFr: 'Plage, restaurants branchés et couchers de soleil iconiques.', highlights: ['Double Six Beach', 'Potato Head Club', 'Petitenget Temple'], accommodationType: 'hotel', lat: -8.6913, lng: 115.1683 },
            { stopOrder: 3, city: 'Nusa Penida', country: 'Indonésie', nights: 3, descriptionFr: 'Île sauvage avec falaises vertigineuses et snorkeling avec les mantas.', highlights: ['Kelingking Beach', 'Angel\'s Billabong', 'Manta Point'], accommodationType: 'hotel', lat: -8.7275, lng: 115.5444 },
            { stopOrder: 4, city: 'Canggu', country: 'Indonésie', nights: 3, descriptionFr: 'Ambiance surf et digital nomad, cafés et beach clubs.', highlights: ['Echo Beach', 'Tanah Lot Temple', 'Finns Beach Club'], accommodationType: 'villa', lat: -8.6478, lng: 115.1385 },
        ],
    },
    {
        slug: 'thailande-14-jours',
        title: 'Thaïlande — Du temple à la plage',
        destinationCode: 'BKK',
        totalNights: 14,
        difficulty: 'easy',
        tags: ['Culture', 'Plage', 'Street food'],
        coverImage: '/expeditions/thailande.jpg',
        descriptionFr: 'La Thaïlande en 14 jours : temples dorés de Bangkok, montagnes de Chiang Mai, plages paradisiaques de Krabi et vie nocturne de Phuket.',
        stops: [
            { stopOrder: 1, city: 'Bangkok', country: 'Thaïlande', nights: 3, descriptionFr: 'Capitale vibrante. Temples, marchés flottants et street food légendaire.', highlights: ['Grand Palace', 'Wat Arun', 'Chatuchak Market'], accommodationType: 'hotel', lat: 13.7563, lng: 100.5018 },
            { stopOrder: 2, city: 'Chiang Mai', country: 'Thaïlande', nights: 4, descriptionFr: 'Rose du Nord. Temples anciens, cours de cuisine et sanctuaires d\'éléphants.', highlights: ['Doi Suthep', 'Old City Temples', 'Night Bazaar'], accommodationType: 'hotel', lat: 18.7883, lng: 98.9853 },
            { stopOrder: 3, city: 'Krabi', country: 'Thaïlande', nights: 4, descriptionFr: 'Karsts calcaires et plages turquoise. Île hopping et kayak de mer.', highlights: ['Railay Beach', 'Phi Phi Islands', 'Tiger Cave Temple'], accommodationType: 'hotel', lat: 8.0863, lng: 98.9063 },
            { stopOrder: 4, city: 'Phuket', country: 'Thaïlande', nights: 3, descriptionFr: 'Plus grande île thaïlandaise. Plages, vie nocturne et Old Town charmante.', highlights: ['Patong Beach', 'Big Buddha', 'Old Phuket Town'], accommodationType: 'hotel', lat: 7.8804, lng: 98.3923 },
        ],
    },
    {
        slug: 'portugal-10-jours',
        title: 'Portugal — De Lisbonne à l\'Algarve',
        destinationCode: 'LIS',
        totalNights: 10,
        difficulty: 'easy',
        tags: ['Culture', 'Gastronomie', 'Plage'],
        coverImage: '/expeditions/portugal.jpg',
        descriptionFr: 'Le Portugal en 10 jours : ruelles colorées de Lisbonne, caves à porto de Porto et falaises dorées de l\'Algarve.',
        stops: [
            { stopOrder: 1, city: 'Lisbonne', country: 'Portugal', nights: 4, descriptionFr: 'Capitale aux 7 collines. Tramways, pastéis de nata et fado.', highlights: ['Belém Tower', 'Alfama', 'Time Out Market'], accommodationType: 'apartment', lat: 38.7223, lng: -9.1393 },
            { stopOrder: 2, city: 'Porto', country: 'Portugal', nights: 3, descriptionFr: 'Ville du porto et des azulejos. Ribeira classée UNESCO.', highlights: ['Ribeira', 'Caves de Porto', 'Librairie Lello'], accommodationType: 'hotel', lat: 41.1579, lng: -8.6291 },
            { stopOrder: 3, city: 'Lagos', country: 'Portugal', nights: 3, descriptionFr: 'Algarve : grottes marines, falaises dorées et plages cachées.', highlights: ['Ponta da Piedade', 'Praia Dona Ana', 'Benagil Cave'], accommodationType: 'apartment', lat: 37.1028, lng: -8.6732 },
        ],
    },
    {
        slug: 'perou-14-jours',
        title: 'Pérou — Des Andes au Pacifique',
        destinationCode: 'LIM',
        totalNights: 14,
        difficulty: 'adventurous',
        tags: ['Aventure', 'Culture', 'Nature'],
        coverImage: '/expeditions/perou.jpg',
        descriptionFr: 'Le Pérou en 14 jours : gastronomie de Lima, mystères de Cusco, Machu Picchu et canyons d\'Arequipa.',
        stops: [
            { stopOrder: 1, city: 'Lima', country: 'Pérou', nights: 3, descriptionFr: 'Capitale gastronomique de l\'Amérique du Sud. Ceviche et quartier bohème de Barranco.', highlights: ['Miraflores', 'Barranco', 'Huaca Pucllana'], accommodationType: 'hotel', lat: -12.0464, lng: -77.0428 },
            { stopOrder: 2, city: 'Cusco', country: 'Pérou', nights: 4, descriptionFr: 'Ancienne capitale inca à 3400m. Architecture coloniale sur fondations incas.', highlights: ['Plaza de Armas', 'Sacsayhuamán', 'San Pedro Market'], accommodationType: 'hotel', lat: -13.5320, lng: -71.9675 },
            { stopOrder: 3, city: 'Vallée Sacrée', country: 'Pérou', nights: 3, descriptionFr: 'Vallée fertile entre Cusco et le Machu Picchu. Sites incas et marchés traditionnels.', highlights: ['Machu Picchu', 'Ollantaytambo', 'Moray'], accommodationType: 'hotel', lat: -13.3333, lng: -72.0833 },
            { stopOrder: 4, city: 'Arequipa', country: 'Pérou', nights: 4, descriptionFr: 'La ville blanche. Canyon de Colca et architecture coloniale en sillar.', highlights: ['Canyon de Colca', 'Monastère Santa Catalina', 'Condors de Colca'], accommodationType: 'hotel', lat: -16.4090, lng: -71.5375 },
        ],
    },
    {
        slug: 'colombie-14-jours',
        title: 'Colombie — Salsa, café et Caraïbes',
        destinationCode: 'BOG',
        totalNights: 14,
        difficulty: 'moderate',
        tags: ['Culture', 'Plage', 'Aventure'],
        coverImage: '/expeditions/colombie.jpg',
        descriptionFr: 'La Colombie en 14 jours : art urbain de Bogota, printemps éternel de Medellín, charme colonial de Cartagena et plages de Santa Marta.',
        stops: [
            { stopOrder: 1, city: 'Bogota', country: 'Colombie', nights: 3, descriptionFr: 'Capitale culturelle à 2600m. Musées, street art et gastronomie émergente.', highlights: ['La Candelaria', 'Musée de l\'Or', 'Monserrate'], accommodationType: 'hotel', lat: 4.7110, lng: -74.0721 },
            { stopOrder: 2, city: 'Medellín', country: 'Colombie', nights: 4, descriptionFr: 'Ville de l\'innovation et du printemps éternel. Quartiers transformés et vie nocturne.', highlights: ['Comuna 13', 'El Poblado', 'Guatapé'], accommodationType: 'apartment', lat: 6.2476, lng: -75.5658 },
            { stopOrder: 3, city: 'Cartagena', country: 'Colombie', nights: 4, descriptionFr: 'Joyau colonial sur les Caraïbes. Murailles, couleurs et ceviche.', highlights: ['Ciudad Amurallada', 'Islas del Rosario', 'Getsemaní'], accommodationType: 'hotel', lat: 10.3910, lng: -75.5144 },
            { stopOrder: 4, city: 'Santa Marta', country: 'Colombie', nights: 3, descriptionFr: 'Porte d\'entrée du Parc Tayrona. Plages vierges et jungle tropicale.', highlights: ['Parque Tayrona', 'Minca', 'Playa Cristal'], accommodationType: 'hostel', lat: 11.2408, lng: -74.1990 },
        ],
    },
    {
        slug: 'japon-14-jours',
        title: 'Japon — Tradition et futurisme',
        destinationCode: 'NRT',
        totalNights: 14,
        difficulty: 'moderate',
        tags: ['Culture', 'Gastronomie', 'Technologie'],
        coverImage: '/expeditions/japon.jpg',
        descriptionFr: 'Le Japon en 14 jours : néons de Tokyo, sérénité de Hakone, temples de Kyoto et street food d\'Osaka.',
        stops: [
            { stopOrder: 1, city: 'Tokyo', country: 'Japon', nights: 4, descriptionFr: 'Mégapole futuriste. Shibuya, Akihabara, sushi et izakayas.', highlights: ['Shibuya Crossing', 'Senso-ji', 'Tsukiji Outer Market'], accommodationType: 'hotel', lat: 35.6762, lng: 139.6503 },
            { stopOrder: 2, city: 'Hakone', country: 'Japon', nights: 2, descriptionFr: 'Onsen avec vue sur le Mont Fuji. Sources chaudes et nature.', highlights: ['Lac Ashi', 'Vue sur le Mont Fuji', 'Owakudani'], accommodationType: 'hotel', lat: 35.2326, lng: 139.1070 },
            { stopOrder: 3, city: 'Kyoto', country: 'Japon', nights: 4, descriptionFr: 'Ancienne capitale impériale. 2000 temples, geishas et jardins zen.', highlights: ['Fushimi Inari', 'Bambouseraie d\'Arashiyama', 'Kinkaku-ji'], accommodationType: 'hotel', lat: 35.0116, lng: 135.7681 },
            { stopOrder: 4, city: 'Osaka', country: 'Japon', nights: 4, descriptionFr: 'Capitale du street food. Dotonbori, takoyaki et ambiance festive.', highlights: ['Dotonbori', 'Osaka Castle', 'Kuromon Market'], accommodationType: 'hotel', lat: 34.6937, lng: 135.5023 },
        ],
    },
    {
        slug: 'mexique-14-jours',
        title: 'Mexique — Du Yucatán à Mexico',
        destinationCode: 'CUN',
        totalNights: 14,
        difficulty: 'easy',
        tags: ['Culture', 'Plage', 'Gastronomie'],
        coverImage: '/expeditions/mexique.jpg',
        descriptionFr: 'Le Mexique en 14 jours : cénotes de Tulum, architecture coloniale de Mérida, art de Oaxaca et chaos magnifique de Mexico City.',
        stops: [
            { stopOrder: 1, city: 'Tulum', country: 'Mexique', nights: 3, descriptionFr: 'Ruines mayas sur la mer des Caraïbes. Cénotes et plages de sable blanc.', highlights: ['Ruines de Tulum', 'Gran Cenote', 'Playa Paraíso'], accommodationType: 'hotel', lat: 20.2114, lng: -87.4654 },
            { stopOrder: 2, city: 'Mérida', country: 'Mexique', nights: 3, descriptionFr: 'Capitale du Yucatán. Architecture coloniale pastel et gastronomie régionale.', highlights: ['Chichén Itzá', 'Paseo de Montejo', 'Marché Lucas de Gálvez'], accommodationType: 'hotel', lat: 20.9674, lng: -89.5926 },
            { stopOrder: 3, city: 'Oaxaca', country: 'Mexique', nights: 4, descriptionFr: 'Capitale culturelle du Mexique. Mezcal, mole et art textile zapotèque.', highlights: ['Monte Albán', 'Hierve el Agua', 'Mercado Benito Juárez'], accommodationType: 'hotel', lat: 17.0732, lng: -96.7266 },
            { stopOrder: 4, city: 'Mexico City', country: 'Mexique', nights: 4, descriptionFr: 'Mégapole de 22 millions. Musées, tacos al pastor et quartiers branchés.', highlights: ['Museo Nacional de Antropología', 'Coyoacán', 'Roma/Condesa'], accommodationType: 'apartment', lat: 19.4326, lng: -99.1332 },
        ],
    },
    {
        slug: 'costa-rica-10-jours',
        title: 'Costa Rica — Pura Vida',
        destinationCode: 'SJO',
        totalNights: 10,
        difficulty: 'moderate',
        tags: ['Nature', 'Aventure', 'Faune'],
        coverImage: '/expeditions/costa-rica.jpg',
        descriptionFr: 'Le Costa Rica en 10 jours : volcans d\'Arenal, forêt de nuages de Monteverde et plages de Manuel Antonio.',
        stops: [
            { stopOrder: 1, city: 'San José', country: 'Costa Rica', nights: 2, descriptionFr: 'Point d\'arrivée. Marché central et musée national.', highlights: ['Mercado Central', 'Teatro Nacional', 'Barrio Escalante'], accommodationType: 'hotel', lat: 9.9281, lng: -84.0907 },
            { stopOrder: 2, city: 'La Fortuna', country: 'Costa Rica', nights: 3, descriptionFr: 'Volcan Arenal, sources chaudes et aventures en plein air.', highlights: ['Volcan Arenal', 'Tabacón Hot Springs', 'Pont suspendu Mistico'], accommodationType: 'hotel', lat: 10.4679, lng: -84.6427 },
            { stopOrder: 3, city: 'Monteverde', country: 'Costa Rica', nights: 2, descriptionFr: 'Forêt de nuages unique. Tyroliennes et réserves biologiques.', highlights: ['Réserve de Monteverde', 'Pont suspendu', 'Night Tour'], accommodationType: 'hotel', lat: 10.3153, lng: -84.8254 },
            { stopOrder: 4, city: 'Manuel Antonio', country: 'Costa Rica', nights: 3, descriptionFr: 'Parc national avec singes, paresseux et plages paradisiaques.', highlights: ['Parc Nacional Manuel Antonio', 'Playa Espadilla', 'Observation de singes'], accommodationType: 'hotel', lat: 9.3920, lng: -84.1369 },
        ],
    },
];
