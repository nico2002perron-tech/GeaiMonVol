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
    'Porto': 'https://images.unsplash.com/photo-155881400-74d7acaacd8b?w=400&h=250&fit=crop',
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
    onDealClick?: (deal: any) => void;
}

export default function DealStrip({ deals = [], loading = false, onViewChange, onDealClick }: DealStripProps) {
    const [activeTab, setActiveTab] = useState<'international' | 'canada'>('international');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(window.innerWidth <= 768);
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const scrollRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const router = useRouter();
    const supabase = createClient();
    const [watchedDeals, setWatchedDeals] = useState<string[]>([]);

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
    }, [user, supabase]);

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

    const months = (() => {
        const ms = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('fr-CA', { month: 'short' }).replace('.', '');
            ms.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
        }
        return ms;
    })();

    const CANADA_CODES = ['YYZ', 'YOW', 'YVR', 'YYC', 'YEG', 'YWG', 'YHZ', 'YQB'];

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
            googleFlightsLink: p.googleFlightsLink || p.raw_data?.google_flights_link || '',
            departure_date: p.departure_date || p.raw_data?.departure_date || '',
            return_date: p.return_date || p.raw_data?.return_date || '',
        }))
        : [...FLIGHTS].sort((a, b) => (b.disc || 0) - (a.disc || 0)).map(f => ({
            ...f,
            code: f.route.split(' – ')[1] || '',
            source: 'static',
            departure_date: '',
        }));

    const displayDeals = (allMappedDeals || []).filter(deal => {
        const code = deal.code || '';
        const isCanadian = CANADA_CODES.includes(code) || deal.source === 'google_flights_canada';
        if (activeTab === 'canada' && !isCanadian) return false;
        if (activeTab === 'international' && isCanadian) return false;
        if (selectedMonth !== 'all') {
            const departDate = (deal as any).departure_date || (deal as any).dates?.split(' → ')[0] || '';
            if (!departDate || !departDate.startsWith(selectedMonth)) return false;
        }
        return true;
    });

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        let scrollAmount = 0;
        let speed = 0.5; // pixels par frame — lent et smooth

        const scroll = () => {
            if (!container) return;
            scrollAmount += speed;

            // Quand on atteint la moitié (les deals sont dupliqués), reset
            if (scrollAmount >= container.scrollWidth / 2) {
                scrollAmount = 0;
            }

            container.scrollLeft = scrollAmount;
            animationId = requestAnimationFrame(scroll);
        };

        let animationId = requestAnimationFrame(scroll);

        // Pause au hover (desktop) ou touch (mobile)
        const pause = () => { speed = 0; };
        const resume = () => { speed = 0.5; };

        container.addEventListener('mouseenter', pause);
        container.addEventListener('mouseleave', resume);
        container.addEventListener('touchstart', pause);
        container.addEventListener('touchend', () => setTimeout(resume, 2000));

        return () => {
            cancelAnimationFrame(animationId);
            container.removeEventListener('mouseenter', pause);
            container.removeEventListener('mouseleave', resume);
            container.removeEventListener('touchstart', pause);
            container.removeEventListener('touchend', resume);
        };
    }, [displayDeals]); // Re-run when deals change

    const loopedDeals = [...(displayDeals || []), ...(displayDeals || [])];

    return (
        <div className="strip">
            {/* Titre + Onglets */}
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                padding: isMobile ? '0 12px 4px' : '10px 20px',
                gap: isMobile ? 6 : 8,
                marginTop: 0,
                paddingTop: 0,
            }}>
                {/* Titre */}
                <span style={{
                    fontSize: isMobile ? 15 : 16,
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                }}>
                    <span style={{ color: '#1A2B42' }}>
                        {activeTab === 'international' ? 'Meilleurs deals' : 'Vols à travers le'}
                    </span>
                    {' '}
                    <span style={{ color: '#2E7DDB' }}>
                        {activeTab === 'international' ? 'internationaux' : 'Canada'}
                    </span>
                </span>

                {/* Onglets - largeur égale */}
                <div style={{
                    display: 'flex',
                    gap: 3,
                    background: '#F0F4F8',
                    borderRadius: 100,
                    padding: 3,
                    width: isMobile ? '100%' : 'auto',
                    minWidth: isMobile ? 'unset' : 320,
                }}>
                    <button
                        onClick={() => { setActiveTab('international'); onViewChange?.('world'); }}
                        style={{
                            flex: 1,
                            padding: '6px 0',
                            borderRadius: 100,
                            border: 'none',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                            textAlign: 'center',
                            transition: 'all 0.2s',
                            background: activeTab === 'international' ? 'white' : 'none',
                            color: activeTab === 'international' ? '#1A2B42' : '#8FA3B8',
                            boxShadow: activeTab === 'international' ? '0 1px 4px rgba(26,43,66,0.08)' : 'none',
                        }}
                    >
                        ✈️ Intl
                    </button>
                    <button
                        onClick={() => { setActiveTab('canada'); onViewChange?.('canada'); }}
                        style={{
                            flex: 1,
                            padding: '6px 0',
                            borderRadius: 100,
                            border: 'none',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                            textAlign: 'center',
                            transition: 'all 0.2s',
                            background: activeTab === 'canada' ? 'white' : 'none',
                            color: activeTab === 'canada' ? '#1A2B42' : '#8FA3B8',
                            boxShadow: activeTab === 'canada' ? '0 1px 4px rgba(26,43,66,0.08)' : 'none',
                        }}
                    >
                        🍁 Canada
                    </button>

                    <button disabled style={{
                        flex: 1,
                        padding: '6px 0',
                        borderRadius: 100,
                        border: 'none',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'default',
                        fontFamily: "'Outfit', sans-serif",
                        textAlign: 'center',
                        background: 'rgba(26,43,66,0.04)',
                        color: '#8FA3B8',
                        position: 'relative',
                        opacity: 0.7,
                    }}>
                        <span style={{ textDecoration: 'line-through' }}>🏨 Hôtels</span>
                        <span style={{
                            position: 'absolute',
                            top: -6,
                            right: 2,
                            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                            color: 'white',
                            fontSize: 7,
                            fontWeight: 800,
                            padding: '1px 4px',
                            borderRadius: 100
                        }}>PRO</span>
                    </button>

                    <button disabled style={{
                        flex: 1,
                        padding: '6px 0',
                        borderRadius: 100,
                        border: 'none',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'default',
                        fontFamily: "'Outfit', sans-serif",
                        textAlign: 'center',
                        background: 'rgba(26,43,66,0.04)',
                        color: '#8FA3B8',
                        position: 'relative',
                        opacity: 0.7,
                    }}>
                        <span style={{ textDecoration: 'line-through' }}>📍 Plans</span>
                        <span style={{
                            position: 'absolute',
                            top: -6,
                            right: 2,
                            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                            color: 'white',
                            fontSize: 7,
                            fontWeight: 800,
                            padding: '1px 4px',
                            borderRadius: 100
                        }}>PRO</span>
                    </button>
                </div>
            </div>

            {/* Ligne 2 — Sélecteur de mois */}
            <div
                className="month-selector"
                style={{
                    display: 'flex',
                    gap: isMobile ? 5 : 6,
                    overflowX: 'auto',
                    padding: isMobile ? '4px 12px' : '8px 10px 10px',
                    WebkitOverflowScrolling: 'touch',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                }}
            >
                <button
                    onClick={() => setSelectedMonth('all')}
                    style={{
                        padding: isMobile ? '3px 10px' : '6px 12px',
                        borderRadius: 100,
                        border: 'none',
                        fontSize: isMobile ? 10 : 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: "'Outfit', sans-serif",
                        whiteSpace: 'nowrap',
                        background: selectedMonth === 'all' ? '#2E7DDB' : (isMobile ? '#F0F4F8' : 'rgba(26,43,66,0.04)'),
                        color: selectedMonth === 'all' ? 'white' : '#8FA3B8',
                    }}
                >
                    {isMobile ? 'Tous' : 'Tous les mois'}
                </button>
                {months.map(m => (
                    <button
                        key={m.value}
                        onClick={() => setSelectedMonth(m.value)}
                        style={{
                            padding: isMobile ? '3px 10px' : '6px 12px',
                            borderRadius: 100,
                            border: 'none',
                            fontSize: isMobile ? 10 : 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                            whiteSpace: 'nowrap',
                            background: selectedMonth === m.value ? '#2E7DDB' : (isMobile ? '#F0F4F8' : 'rgba(26,43,66,0.04)'),
                            color: selectedMonth === m.value ? 'white' : '#8FA3B8',
                        }}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Ligne 3 — Carrousel de cards */}
            <div className="strip-panel show">
                <div
                    className="strip-row"
                    id="stripRow"
                    ref={scrollRef}
                    style={{
                        display: 'flex',
                        gap: isMobile ? 10 : 14,
                        overflowX: 'auto',
                        padding: isMobile ? '8px 12px' : '10px 20px',
                        scrollbarWidth: 'none',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    {loopedDeals.map((deal: any, i: number) => (
                        <div
                            key={`${deal.id || i}-${i}`}
                            className="scard"
                            style={{
                                minWidth: isMobile ? 150 : 180,
                                maxWidth: isMobile ? 150 : 180,
                                borderRadius: 12,
                                overflow: 'hidden',
                                background: 'white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                flexShrink: 0,
                                cursor: 'pointer',
                            }}
                            onClick={() => onDealClick?.(deal)}
                        >
                            <div style={{ position: 'relative', overflow: 'hidden' }}>
                                <img
                                    className="scard-img"
                                    src={CITY_IMAGES[deal.city || deal.destination] || deal.imgSmall || deal.img || DEFAULT_IMAGE}
                                    alt={deal.city}
                                    style={{
                                        width: '100%',
                                        height: isMobile ? 110 : 150,
                                        objectFit: 'cover',
                                        borderRadius: '10px 10px 0 0',
                                        display: 'block',
                                    }}
                                />
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleWatchlist(deal); }}
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
                            </div>
                            <div className="scard-body" style={{ padding: '8px 12px 12px' }}>
                                <div className="scard-city" style={{ fontWeight: 700, fontSize: 13, color: '#1A2B42', marginBottom: 2 }}>{deal.city}</div>
                                <div className="scard-route" style={{ fontSize: 11, color: '#64748B', marginBottom: 6 }}>{deal.route}</div>
                                <div className="scard-row" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span className="scard-price" style={{ fontWeight: 800, fontSize: 15, color: '#2E7DDB' }}>{deal.price} $</span>
                                    {deal.disc > 0 && <span className="scard-disc" style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', background: '#FEF2F2', padding: '2px 6px', borderRadius: 4 }}>-{deal.disc}%</span>}
                                </div>
                                <div style={{ marginTop: 8, fontSize: 11, color: '#2E7DDB', fontWeight: 600 }}>
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
