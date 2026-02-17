'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { HOTELS } from '@/lib/data/hotels';
import { FLIGHTS } from '@/lib/data/flights';
import { useLivePrices } from '@/lib/hooks/useLivePrices';

const CITY_IMAGES: Record<string, string> = {
    'Toronto': 'https://images.unsplash.com/photo-1517090504332-e94e18675f74?w=400&h=250&fit=crop',
    'Ottawa': 'https://images.unsplash.com/photo-1558025137-0b406e0f5765?w=400&h=250&fit=crop',
    'Vancouver': 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=400&h=250&fit=crop',
    'Calgary': 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=400&h=250&fit=crop',
    'Edmonton': 'https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?w=400&h=250&fit=crop',
    'Winnipeg': 'https://images.unsplash.com/photo-1560388259-2b8845dd4ee7?w=400&h=250&fit=crop',
    'Halifax': 'https://images.unsplash.com/photo-1575320181282-9afab399332c?w=400&h=250&fit=crop',
    'Québec': 'https://images.unsplash.com/photo-1545396280-acdb7441dd2e?w=400&h=250&fit=crop',
    'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=250&fit=crop',
    'Cancún': 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=400&h=250&fit=crop',
    'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=250&fit=crop',
    'Barcelone': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=250&fit=crop',
    'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=250&fit=crop',
    'Lisbonne': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=400&h=250&fit=crop',
    'Londres': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=250&fit=crop',
    'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=250&fit=crop',
    'Bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=250&fit=crop',
    'Marrakech': 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=400&h=250&fit=crop',
    'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=250&fit=crop',
    'Miami': 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=400&h=250&fit=crop',
    'Fort Lauderdale': 'https://images.unsplash.com/photo-1589083130544-0d6a2926e519?w=400&h=250&fit=crop',
    'Punta Cana': 'https://images.unsplash.com/photo-1535916707207-35f97e715e1c?w=400&h=250&fit=crop',
    'Cuba (Varadero)': 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=250&fit=crop',
    'La Havane': 'https://images.unsplash.com/photo-1570299437522-25057f1bec96?w=400&h=250&fit=crop',
    'Bogota': 'https://images.unsplash.com/photo-1568385247005-0d371d214862?w=400&h=250&fit=crop',
    'Lima': 'https://images.unsplash.com/photo-1531968455001-5c5272a67c71?w=400&h=250&fit=crop',
    'São Paulo': 'https://images.unsplash.com/photo-1554168848-a261d7180836?w=400&h=250&fit=crop',
    'Buenos Aires': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=400&h=250&fit=crop',
    'Amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=250&fit=crop',
    'Dublin': 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=400&h=250&fit=crop',
    'Athènes': 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=400&h=250&fit=crop',
    'Reykjavik': 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=400&h=250&fit=crop',
    'Porto': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&h=250&fit=crop',
    'Madrid': 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=400&h=250&fit=crop',
    'Los Angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=400&h=250&fit=crop',
    'Montego Bay': 'https://images.unsplash.com/photo-1580237541049-2d715a09486e?w=400&h=250&fit=crop',
    'San José': 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=400&h=250&fit=crop',
    'Cartagena': 'https://images.unsplash.com/photo-1583997052103-b4a1cb974ce5?w=400&h=250&fit=crop',
    'Ho Chi Minh': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=250&fit=crop',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=250&fit=crop';

interface DealStripProps {
    deals?: any[];
    loading?: boolean;
    onViewChange?: (view: 'world' | 'canada') => void;
}

export default function DealStrip({ deals = [], loading = false, onViewChange }: DealStripProps) {
    const [activeTab, setActiveTab] = useState<'international' | 'canada'>('international');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
    const supabase = createClient();
    const [watchedDeals, setWatchedDeals] = useState<string[]>([]);

    // Load user's watchlist
    useEffect(() => {
        if (!user) return;
        const loadWatchlist = async () => {
            const { data } = await supabase
                .from('watchlist')
                .select('destination')
                .eq('user_id', user.id);
            if (data) setWatchedDeals((data || []).map((w: any) => w.destination));
        };
        loadWatchlist();
    }, [user]);

    const toggleWatchlist = async (deal: any) => {
        if (!user) {
            router.push('/auth');
            return;
        }

        const isWatched = watchedDeals.includes(deal.city);

        if (isWatched) {
            await supabase
                .from('watchlist')
                .delete()
                .eq('user_id', user.id)
                .eq('destination', deal.city);
            setWatchedDeals(prev => prev.filter(d => d !== deal.city));
        } else {
            await supabase
                .from('watchlist')
                .upsert({
                    user_id: user.id,
                    destination: deal.city,
                    country: deal.country,
                    target_price: deal.price,
                }, { onConflict: 'user_id,destination' });
            setWatchedDeals(prev => [...prev, deal.city]);
        }
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        let animationId: number;
        let scrollSpeed = 0.5; // pixels per frame

        const scroll = () => {
            if (!isHovering && el) {
                el.scrollLeft += scrollSpeed;
                // Reset to beginning when reaching the end
                if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
                    el.scrollLeft = 0;
                }
            }
            animationId = requestAnimationFrame(scroll);
        };

        animationId = requestAnimationFrame(scroll);
        return () => cancelAnimationFrame(animationId);
    }, [isHovering]);



    const CANADA_CODES = ['YYZ', 'YOW', 'YVR', 'YYC', 'YEG', 'YWG', 'YHZ', 'YQB'];

    // Filter deals based on tab
    const allMappedDeals = (deals || []).length > 0
        ? (deals || []).map(p => ({
            city: p.destination,
            code: p.destination_code,
            price: p.price,
            airline: p.airline,
            stops: p.stops,
            route: `YUL – ${p.destination_code}`,
            dates: `${p.departure_date} → ${p.return_date}`,
            disc: p.discount || 0,
            oldPrice: p.avgPrice || 0,
            dealLevel: p.dealLevel,
            priceLevel: p.priceLevel,
            source: p.source,
            img: FLIGHTS.find(f => f.city === p.destination)?.img || '',
            imgSmall: FLIGHTS.find(f => f.city === p.destination)?.imgSmall || '',
            country: FLIGHTS.find(f => f.city === p.destination)?.country || '',
            tags: [],
            lat: FLIGHTS.find(f => f.city === p.destination)?.lat || 0,
            lon: FLIGHTS.find(f => f.city === p.destination)?.lon || 0,
            id: p.destination_code,
            googleFlightsLink: p.googleFlightsLink || p.raw_data?.google_flights_link || ''
        }))
        : [...FLIGHTS].sort((a, b) => (b.disc || 0) - (a.disc || 0)).map(f => ({
            ...f,
            code: f.route.split(' – ')[1] || '',
            source: 'static'
        }));

    const filteredDeals = (allMappedDeals || []).filter(deal => {
        const code = deal.code || '';
        if (activeTab === 'canada') {
            return CANADA_CODES.includes(code) || deal.source === 'google_flights_canada';
        } else {
            return !CANADA_CODES.includes(code) && deal.source !== 'google_flights_canada';
        }
    });

    const displayDeals = filteredDeals;


    return (
        <div className="strip">
            <div className="strip-head">
                <div className="strip-head-left">
                    <div className="strip-title">
                        <span style={{ fontWeight: 700, color: '#1A2B42' }}>
                            {activeTab === 'international' ? 'Meilleurs deals' : 'Vols à travers le'}
                        </span>
                        {' '}
                        <span style={{ fontWeight: 700, color: '#2E7DDB' }}>
                            {activeTab === 'international' ? 'internationaux' : 'Canada'}
                        </span>
                    </div>
                    <div className="strip-tabs">
                        {/* Onglet International */}
                        <button
                            onClick={() => {
                                setActiveTab('international');
                                onViewChange?.('world');
                            }}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 100,
                                border: 'none',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: "'Outfit', sans-serif",
                                transition: 'all 0.2s',
                                background: activeTab === 'international' ? 'white' : 'none',
                                color: activeTab === 'international' ? '#1A2B42' : '#8FA3B8',
                                boxShadow: activeTab === 'international' ? '0 1px 4px rgba(26,43,66,0.08)' : 'none',
                            }}
                        >
                            ✈️ International
                        </button>

                        {/* Onglet Canada */}
                        <button
                            onClick={() => {
                                setActiveTab('canada');
                                onViewChange?.('canada');
                            }}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 100,
                                border: 'none',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: "'Outfit', sans-serif",
                                transition: 'all 0.2s',
                                background: activeTab === 'canada' ? 'white' : 'none',
                                color: activeTab === 'canada' ? '#1A2B42' : '#8FA3B8',
                                boxShadow: activeTab === 'canada' ? '0 1px 4px rgba(26,43,66,0.08)' : 'none',
                            }}
                        >
                            🍁 Intra-pays
                        </button>

                        {/* Onglet Hôtels PRO */}
                        <button
                            style={{
                                padding: '6px 14px',
                                borderRadius: 100,
                                border: 'none',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'default',
                                fontFamily: "'Outfit', sans-serif",
                                background: 'rgba(26,43,66,0.04)',
                                color: '#8FA3B8',
                                position: 'relative',
                                opacity: 0.7,
                                marginLeft: '8px'
                            }}
                            disabled
                        >
                            <span style={{ textDecoration: 'line-through' }}>🏨 Hôtels</span>
                            <span style={{
                                position: 'absolute',
                                top: -8,
                                right: -12,
                                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                color: 'white',
                                fontSize: 8,
                                fontWeight: 800,
                                padding: '2px 5px',
                                borderRadius: 100,
                                letterSpacing: '0.5px',
                            }}>
                                PRO
                            </span>
                        </button>

                        {/* Onglet Plannings PRO */}
                        <button
                            style={{
                                padding: '6px 14px',
                                borderRadius: 100,
                                border: 'none',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'default',
                                fontFamily: "'Outfit', sans-serif",
                                background: 'rgba(26,43,66,0.04)',
                                color: '#8FA3B8',
                                position: 'relative',
                                opacity: 0.7,
                                marginLeft: '12px'
                            }}
                            disabled
                        >
                            <span style={{ textDecoration: 'line-through' }}>📍 Plannings</span>
                            <span style={{
                                position: 'absolute',
                                top: -8,
                                right: -12,
                                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                color: 'white',
                                fontSize: 8,
                                fontWeight: 800,
                                padding: '2px 5px',
                                borderRadius: 100,
                                letterSpacing: '0.5px',
                            }}>
                                PRO
                            </span>
                        </button>
                    </div>
                </div>
                <button className="strip-more">Voir tout</button>
            </div>

            {/* Panel Vols */}
            <div className="strip-panel show">
                <div
                    className="strip-row"
                    id="stripRow"
                    ref={scrollRef}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                >
                    {(displayDeals || []).slice(0, 7).map((deal: any, i: number) => (
                        <div
                            key={deal.id || i}
                            className="scard"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                const link = deal.googleFlightsLink || deal.google_flights_link || deal.raw_data?.google_flights_link;
                                if (link) {
                                    window.open(link, '_blank', 'noopener,noreferrer');
                                } else {
                                    // Fallback: construire le lien Google Flights manuellement
                                    const origin = 'YUL';
                                    const dest = deal.destination_code || deal.code || '';
                                    const rawDate = deal.departure_date || deal.departureDate || '';
                                    const rawReturnDate = deal.return_date || deal.returnDate || '';

                                    // Format YYYY-MM-DD
                                    const date = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
                                    const returnDate = rawReturnDate.includes('T') ? rawReturnDate.split('T')[0] : rawReturnDate;

                                    const url = `https://www.google.com/travel/flights?q=Flights+from+${origin}+to+${dest}+on+${date}+return+${returnDate}&curr=CAD&hl=fr`;
                                    window.open(url, '_blank', 'noopener,noreferrer');
                                }
                            }}
                        >
                            <div style={{ position: 'relative', overflow: 'hidden' }}>
                                <img
                                    className="scard-img"
                                    src={CITY_IMAGES[deal.city || deal.destination] || deal.imgSmall || deal.img || DEFAULT_IMAGE}
                                    alt={deal.city}
                                    loading="lazy"
                                    onError={(e) => {
                                        const target = e.currentTarget;
                                        if (!target.dataset.failed) {
                                            target.dataset.failed = 'true';
                                            target.src = 'data:image/svg+xml,' + encodeURIComponent(
                                                '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect fill="%23DCEAF5" width="300" height="200"/><text x="150" y="105" text-anchor="middle" fill="%238FA3B8" font-size="14" font-family="sans-serif">Image non disponible</text></svg>'
                                            );
                                        }
                                    }}
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleWatchlist(deal);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.9)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backdropFilter: 'blur(4px)',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                                    }}
                                >
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill={watchedDeals.includes(deal.city) ? '#EF4444' : 'none'}
                                        stroke={watchedDeals.includes(deal.city) ? '#EF4444' : '#5A7089'}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </button>
                                {(deal.dealLevel === 'lowest_ever' || deal.dealLevel === 'incredible') && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 8,
                                        left: 8,
                                        background: 'rgba(255,255,255,0.9)',
                                        borderRadius: '12px',
                                        padding: '2px 6px',
                                        fontSize: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '2px',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                                        backdropFilter: 'blur(4px)',
                                    }}>
                                        🔥
                                    </div>
                                )}
                            </div>
                            <div className="scard-body">
                                <div className="scard-city">
                                    {deal.city}
                                    {deal.priceLevel === 'low' && (
                                        <span style={{
                                            fontSize: '10px',
                                            color: '#10B981',
                                            background: '#ECFDF5',
                                            padding: '1px 4px',
                                            borderRadius: '4px',
                                            marginLeft: '6px',
                                            fontWeight: '600'
                                        }}>
                                            Prix bas
                                        </span>
                                    )}
                                </div>
                                <div className="scard-route">{deal.route}</div>
                                <div className="scard-row">
                                    <span className="scard-price">{deal.price} $</span>
                                    {deal.disc > 0 && <span className="scard-disc">-{deal.disc}%</span>}
                                </div>
                                {deal.oldPrice > 0 && deal.disc > 0 && (
                                    <div style={{
                                        fontSize: 11,
                                        color: '#8FA3B8',
                                        textDecoration: 'line-through',
                                        marginTop: 2,
                                        paddingLeft: 2,
                                    }}>
                                        {deal.oldPrice} $
                                    </div>
                                )}
                                <div style={{
                                    marginTop: 8,
                                    fontSize: 11,
                                    color: '#2E7DDB',
                                    fontWeight: 600,
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    Voir ce vol →
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
