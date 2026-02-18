'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { FLIGHTS } from '@/lib/data/flights';

const DEAL_BADGES: Record<string, { label: string; bg: string; icon: string }> = {
    lowest_ever: { label: 'PRIX RECORD', bg: '#7C3AED', icon: '⚡' },
    incredible: { label: 'INCROYABLE', bg: '#DC2626', icon: '🔥' },
    great: { label: 'SUPER DEAL', bg: '#EA580C', icon: '✨' },
    good: { label: 'BON PRIX', bg: '#2E7DDB', icon: '👍' },
};

const CITY_IMAGES: Record<string, string> = {
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

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=250&fit=crop';
const CANADA_CODES = ['YYZ', 'YOW', 'YVR', 'YYC', 'YEG', 'YWG', 'YHZ', 'YQB'];

interface DealStripProps {
    deals?: any[];
    loading?: boolean;
    activeTab?: 'international' | 'canada';
    onViewChange?: (view: 'world' | 'canada') => void;
    onDealClick?: (deal: any) => void;
}

export default function DealStrip({
    deals = [],
    loading = false,
    activeTab = 'international',
    onDealClick
}: DealStripProps) {
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [isMobile, setIsMobile] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const router = useRouter();
    const supabaseRef = useRef(createClient());
    const [watchedDeals, setWatchedDeals] = useState<string[]>([]);

    useEffect(() => {
        setIsMobile(window.innerWidth <= 768);
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!user) return;
        const loadWatchlist = async () => {
            const { data } = await supabaseRef.current
                .from('watchlist')
                .select('destination')
                .eq('user_id', user.id);
            if (data) setWatchedDeals(data.map((w: any) => w.destination));
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
            await supabaseRef.current
                .from('watchlist')
                .delete()
                .eq('user_id', user.id)
                .eq('destination', deal.city);
            setWatchedDeals(prev => prev.filter(d => d !== deal.city));
        } else {
            await supabaseRef.current
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

    const months = useMemo(() => {
        const ms = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('fr-CA', { month: 'short' }).replace('.', '');
            ms.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
        }
        return ms;
    }, []);

    const displayDeals = useMemo(() => {
        const mapped = (deals || []).map(p => ({
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
            id: p.destination_code,
            googleFlightsLink: p.googleFlightsLink || p.raw_data?.google_flights_link || '',
            departure_date: p.departure_date || p.raw_data?.departure_date || '',
            return_date: p.return_date || p.raw_data?.return_date || '',
        }));

        return mapped.filter(deal => {
            const isCanadian = CANADA_CODES.includes(deal.code);
            if (activeTab === 'canada' && !isCanadian) return false;
            if (activeTab === 'international' && isCanadian) return false;
            if (selectedMonth !== 'all' && !deal.departure_date.startsWith(selectedMonth)) return false;
            return true;
        });
    }, [deals, activeTab, selectedMonth]);

    const availableMonths = useMemo(() => {
        return months.filter(m => {
            return (deals || []).some(d => {
                const dep = d.departure_date || '';
                const isCanadian = CANADA_CODES.includes(d.destination_code);
                const isCorrectTab = activeTab === 'canada' ? isCanadian : !isCanadian;
                return isCorrectTab && dep.startsWith(m.value);
            });
        });
    }, [deals, activeTab, months]);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container || displayDeals.length === 0) return;

        let animationId: number;
        let isPaused = false;

        const startDelay = setTimeout(() => {
            const halfWidth = container.scrollWidth / 2;
            if (halfWidth <= 0) return;

            const tick = () => {
                if (!isPaused) {
                    let pos = container.scrollLeft + 0.5;
                    if (pos >= halfWidth) pos -= halfWidth;
                    container.scrollLeft = pos;
                }
                animationId = requestAnimationFrame(tick);
            };
            animationId = requestAnimationFrame(tick);
        }, 1000);

        const pause = () => { isPaused = true; };
        const resume = () => { isPaused = false; };

        container.addEventListener('mouseenter', pause);
        container.addEventListener('mouseleave', resume);
        container.addEventListener('touchstart', pause, { passive: true });
        container.addEventListener('touchend', resume);

        return () => {
            clearTimeout(startDelay);
            cancelAnimationFrame(animationId);
            container.removeEventListener('mouseenter', pause);
            container.removeEventListener('mouseleave', resume);
            container.removeEventListener('touchstart', pause);
            container.removeEventListener('touchend', resume);
        };
    }, [displayDeals.length]);

    const loopedDeals = useMemo(() => [...displayDeals, ...displayDeals], [displayDeals]);

    if (loading && deals.length === 0) {
        return (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: '#8FA3B8' }}>
                <div className="loader" style={{ margin: '0 auto 12px' }} />
                Chargement des meilleurs deals...
            </div>
        );
    }

    return (
        <div className="strip" style={{ background: 'white', paddingBottom: 20 }}>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '24px 24px 12px', flexWrap: 'wrap', gap: 12
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{
                        fontFamily: "'Fredoka', sans-serif", fontSize: 20,
                        fontWeight: 700, color: '#1A2B42', margin: 0
                    }}>
                        Les pépites {activeTab === 'international' ? 'du monde' : 'du Canada'}
                    </h2>
                    <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#16A34A', animation: 'liveBlink 2s infinite'
                    }} />
                </div>

                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                    <button
                        onClick={() => setSelectedMonth('all')}
                        style={{
                            padding: '5px 14px', borderRadius: 100, border: 'none',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                            background: selectedMonth === 'all' ? '#2E7DDB' : '#F4F8FB',
                            color: selectedMonth === 'all' ? 'white' : '#5A7089',
                        }}
                    >
                        Tous
                    </button>
                    {availableMonths.map(m => (
                        <button
                            key={m.value}
                            onClick={() => setSelectedMonth(m.value)}
                            style={{
                                padding: '5px 14px', borderRadius: 100, border: 'none',
                                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap',
                                background: selectedMonth === m.value ? '#2E7DDB' : '#F4F8FB',
                                color: selectedMonth === m.value ? 'white' : '#5A7089',
                            }}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ position: 'relative' }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: 60, height: '100%',
                    background: 'linear-gradient(to right, white, transparent)', zIndex: 3, pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute', top: 0, right: 0, width: 60, height: '100%',
                    background: 'linear-gradient(to left, white, transparent)', zIndex: 3, pointerEvents: 'none'
                }} />

                <div
                    ref={scrollRef}
                    style={{
                        display: 'flex', gap: 16, overflowX: 'auto',
                        padding: '12px 24px 20px', scrollbarWidth: 'none',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    {loopedDeals.map((deal: any, i: number) => (
                        <div
                            key={`${deal.id}-${i}`}
                            className="deal-card-v2"
                            style={{
                                minWidth: isMobile ? 180 : 210,
                                borderRadius: 16, overflow: 'hidden',
                                background: 'white', border: '1px solid rgba(26,43,66,0.08)',
                                boxShadow: '0 4px 15px rgba(26,43,66,0.05)',
                                flexShrink: 0, cursor: 'pointer', position: 'relative',
                                transform: 'translateZ(0)', transition: 'transform 0.3s ease'
                            }}
                            onClick={() => onDealClick?.(deal)}
                        >
                            {DEAL_BADGES[deal.dealLevel]?.label && (
                                <div style={{
                                    position: 'absolute', top: 10, left: 10, zIndex: 5,
                                    background: DEAL_BADGES[deal.dealLevel].bg, color: 'white',
                                    padding: '3px 10px', borderRadius: 100,
                                    fontSize: 9, fontWeight: 800, letterSpacing: 0.5,
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                }}>
                                    {DEAL_BADGES[deal.dealLevel].icon} {DEAL_BADGES[deal.dealLevel].label}
                                </div>
                            )}

                            <div style={{ height: isMobile ? 110 : 130, position: 'relative' }}>
                                <img
                                    src={CITY_IMAGES[deal.city] || deal.imgSmall || deal.img || DEFAULT_IMAGE}
                                    alt={deal.city}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                                />
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4))'
                                }} />
                            </div>

                            <div style={{ padding: 14 }}>
                                <div style={{ fontWeight: 700, fontSize: 16, color: '#1A2B42', marginBottom: 2 }}>
                                    {deal.city}
                                </div>
                                <div style={{ fontSize: 11, color: '#8FA3B8', marginBottom: 10 }}>
                                    {deal.route} · {deal.stops === 0 ? 'Direct' : `${deal.stops} escale${deal.stops > 1 ? 's' : ''}`}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{
                                            fontSize: 18, fontWeight: 800, color: '#2E7DDB',
                                            fontFamily: "'Fredoka', sans-serif"
                                        }}>
                                            {deal.price}$
                                        </span>
                                        {deal.disc > 0 && (
                                            <span style={{
                                                fontSize: 10, fontWeight: 800, color: '#DC2626',
                                                background: '#FEE2E2', padding: '2px 6px', borderRadius: 6
                                            }}>
                                                -{Math.round(deal.disc)}%
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleWatchlist(deal); }}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer', padding: 5
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24"
                                            fill={watchedDeals.includes(deal.city) ? '#EF4444' : 'none'}
                                            stroke={watchedDeals.includes(deal.city) ? '#EF4444' : '#94A3B8'}
                                            strokeWidth="2.5"
                                        >
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
