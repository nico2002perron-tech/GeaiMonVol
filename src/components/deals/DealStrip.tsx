'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { HOTELS } from '@/lib/data/hotels';
import { FLIGHTS } from '@/lib/data/flights';
import { useLivePrices } from '@/lib/hooks/useLivePrices';

const DEAL_BADGES: Record<string, { label: string; bg: string; icon: string }> = {
    lowest_ever: { label: 'PRIX RECORD', bg: '#7C3AED', icon: '⚡' },
    incredible: { label: 'INCROYABLE', bg: '#DC2626', icon: '🔥' },
    great: { label: 'SUPER DEAL', bg: '#EA580C', icon: '✨' },
    good: { label: 'BON PRIX', bg: '#2563EB', icon: '👍' },
    slight: { label: '', bg: '', icon: '' },
    normal: { label: '', bg: '', icon: '' },
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

interface DealStripProps {
    deals?: any[];
    loading?: boolean;
    activeTab?: 'international' | 'canada';
    onViewChange?: (view: 'world' | 'canada') => void;
    onDealClick?: (deal: any) => void;
}

export default function DealStrip({ deals = [], loading = false, activeTab = 'international', onViewChange, onDealClick }: DealStripProps) {
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [showPremiumStrip, setShowPremiumStrip] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowPremiumStrip(true), 8000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        setIsMobile(window.innerWidth <= 768);
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const scrollRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const router = useRouter();
    const supabaseRef = useRef(createClient());
    const [watchedDeals, setWatchedDeals] = useState<string[]>([]);

    useEffect(() => {
        if (!user) return;
        const loadWatchlist = async () => {
            const { data } = await supabaseRef.current
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

    // Ajouter après la définition de displayDeals
    const availableMonths = months.filter(m => {
        return (allMappedDeals || []).some(d => {
            const dep = d.departure_date || (d.dates || '').split(' → ')[0] || '';
            return dep.startsWith(m.value) && (
                activeTab === 'canada' ? (CANADA_CODES.includes(d.code) || d.source === 'google_flights_canada') :
                    !(CANADA_CODES.includes(d.code) || d.source === 'google_flights_canada')
            );
        });
    });

    const dealsCount = (displayDeals || []).length;

    useEffect(() => {
        const container = scrollRef.current;
        if (!container || dealsCount === 0) return;

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
        }, 300);

        const pause = () => { isPaused = true; };
        const resume = () => { isPaused = false; };
        const delayedResume = () => { setTimeout(resume, 2500); };

        container.addEventListener('mouseenter', pause);
        container.addEventListener('mouseleave', resume);
        container.addEventListener('touchstart', pause, { passive: true });
        container.addEventListener('touchend', delayedResume);

        return () => {
            clearTimeout(startDelay);
            cancelAnimationFrame(animationId);
            container.removeEventListener('mouseenter', pause);
            container.removeEventListener('mouseleave', resume);
            container.removeEventListener('touchstart', pause);
            container.removeEventListener('touchend', delayedResume);
        };
    }, [dealsCount]);

    const loopedDeals = [...(displayDeals || []), ...(displayDeals || [])];

    return (
        <div className="strip">
            {/* Titre "Meilleurs deals" avec mois dynamiques */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 24px 0',
            }}>
                {/* Titre */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#1A2B42',
                    }}>
                        Meilleurs deals
                    </span>
                    <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: '#16A34A',
                        animation: 'liveBlink 2s ease-in-out infinite',
                    }} />
                    <span style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#2E7DDB',
                    }}>
                        {activeTab === 'international' ? 'dans le monde' : 'au Canada'}
                    </span>
                </div>

                {/* Mois dynamiques — seulement ceux qui ont des deals */}
                <div style={{ display: 'flex', gap: 4 }}>
                    <button
                        onClick={() => setSelectedMonth('all')}
                        style={{
                            padding: '3px 10px',
                            borderRadius: 100,
                            border: 'none',
                            fontSize: 10.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                            background: selectedMonth === 'all' ? '#2E7DDB' : '#F0F4F8',
                            color: selectedMonth === 'all' ? 'white' : '#8FA3B8',
                        }}
                    >
                        Tous
                    </button>
                    {availableMonths.map(m => {
                        const count = displayDeals.filter(d => {
                            const dep = d.departure_date || d.dates?.split(' → ')[0] || '';
                            return dep.startsWith(m.value);
                        }).length;
                        // Ne pas afficher le mois s'il n'y a pas de deals
                        if (count === 0) return null;
                        return (
                            <button
                                key={m.value}
                                onClick={() => setSelectedMonth(m.value)}
                                className="month-btn"
                                style={{
                                    padding: '3px 10px',
                                    borderRadius: 100,
                                    border: 'none',
                                    fontSize: 10.5,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: "'Outfit', sans-serif",
                                    whiteSpace: 'nowrap',
                                    background: selectedMonth === m.value ? '#2E7DDB' : '#F0F4F8',
                                    color: selectedMonth === m.value ? 'white' : '#8FA3B8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                {m.label}
                                <span style={{
                                    fontSize: 8.5,
                                    fontWeight: 800,
                                    color: selectedMonth === m.value
                                        ? 'rgba(255,255,255,0.7)'
                                        : '#B0BEC5',
                                }}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Ligne 3 — Carrousel de cards */}
            <div style={{ position: 'relative' }}>
                {/* Fade gauche */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: 35, height: '100%',
                    background: 'linear-gradient(to right, white, transparent)',
                    zIndex: 3, pointerEvents: 'none',
                }} />
                {/* Fade droite */}
                <div style={{
                    position: 'absolute', top: 0, right: 0, width: 35, height: '100%',
                    background: 'linear-gradient(to left, white, transparent)',
                    zIndex: 3, pointerEvents: 'none',
                }} />
                <div
                    className="strip-row"
                    id="stripRow"
                    ref={scrollRef}
                    style={{
                        display: 'flex',
                        gap: isMobile ? 10 : 16,
                        overflowX: 'auto',
                        padding: isMobile ? '8px 12px 16px' : '12px 24px 20px',
                        scrollbarWidth: 'none',
                        WebkitOverflowScrolling: 'touch',
                        scrollBehavior: 'auto',
                    }}
                >
                    {loopedDeals.map((deal: any, i: number) => (
                        <div
                            key={`${deal.id || i}-${i}`}
                            className="scard deal-card"
                            style={{
                                minWidth: isMobile ? 155 : 170,
                                maxWidth: isMobile ? 155 : 170,
                                borderRadius: 12,
                                overflow: 'hidden',
                                background: 'white',
                                border: '1px solid rgba(26,43,66,0.06)',
                                boxShadow: '0 2px 12px rgba(26,43,66,0.06)',
                                flexShrink: 0,
                                cursor: 'pointer',
                                position: 'relative',
                            }}
                            onClick={() => onDealClick?.(deal)}
                        >
                            {/* Badge deal level */}
                            {(() => {
                                const badge = DEAL_BADGES[deal.dealLevel] || {};
                                return badge.label ? (
                                    <div style={{
                                        position: 'absolute', top: 6, left: 6, zIndex: 5,
                                        background: badge.bg, color: 'white',
                                        padding: '2px 7px', borderRadius: 100,
                                        fontSize: 7.5, fontWeight: 800, letterSpacing: 0.3,
                                        display: 'flex', alignItems: 'center', gap: 2,
                                        boxShadow: `0 1px 4px ${badge.bg}30`,
                                    }}>
                                        {badge.icon} {badge.label}
                                    </div>
                                ) : null;
                            })()}

                            {/* Coeur watchlist */}
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleWatchlist(deal); }}
                                style={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    zIndex: 5,
                                    width: 26,
                                    height: 26,
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.9)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backdropFilter: 'blur(4px)',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                    transition: 'transform 0.2s ease',
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24"
                                    fill={watchedDeals.includes(deal.city) ? '#EF4444' : 'none'}
                                    stroke={watchedDeals.includes(deal.city) ? '#EF4444' : '#94A3B8'}
                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                >
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                            </button>

                            {/* Image */}
                            <div style={{ overflow: 'hidden', height: isMobile ? 90 : 95, background: '#E8F0FE', width: '100%' }}>
                                <img
                                    className="scard-img card-img"
                                    src={CITY_IMAGES[deal.city || deal.destination] || deal.imgSmall || deal.img || DEFAULT_IMAGE}
                                    alt={deal.city || deal.destination || ''}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (target.src !== DEFAULT_IMAGE) target.src = DEFAULT_IMAGE;
                                    }}
                                    style={{
                                        width: '100%', height: '100%', objectFit: 'cover',
                                        display: 'block', background: '#EAF2FB',
                                    }}
                                />
                            </div>

                            {/* Body */}
                            <div style={{ padding: isMobile ? '8px 10px 10px' : '10px 14px 14px', position: 'relative', zIndex: 2 }}>
                                <div style={{ fontWeight: 700, fontSize: isMobile ? 12 : 14, color: '#1A2B42', marginBottom: 2 }}>
                                    {deal.city}
                                </div>
                                <div style={{ fontSize: 10, color: '#8FA3B8', marginBottom: 4 }}>
                                    {deal.route} · {deal.airline || ''}{deal.stops === 0 ? ' · Direct' : deal.stops ? ` · ${deal.stops} escale${deal.stops > 1 ? 's' : ''}` : ''}
                                </div>

                                {/* Prix + rabais */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                    <span style={{
                                        background: 'linear-gradient(135deg, #2E7DDB, #1B5BA0)',
                                        color: 'white',
                                        padding: '4px 10px',
                                        borderRadius: 8,
                                        fontSize: isMobile ? 13 : 15,
                                        fontWeight: 800,
                                        fontFamily: "'Fredoka', sans-serif",
                                        boxShadow: '0 2px 8px rgba(46,125,219,0.2)',
                                    }}>
                                        {deal.price} $
                                    </span>
                                    {deal.disc > 0 && (
                                        <span style={{
                                            background: 'linear-gradient(135deg, #DC2626, #EF4444)',
                                            color: 'white',
                                            padding: '2px 6px',
                                            borderRadius: 5,
                                            fontSize: 10,
                                            fontWeight: 800,
                                            boxShadow: '0 2px 6px rgba(220,38,38,0.2)',
                                        }}>
                                            -{Math.round(deal.disc)}%
                                        </span>
                                    )}
                                </div>

                                {/* CTA */}
                                <div className="see-flight" style={{
                                    marginTop: 6, fontSize: 10.5, color: '#2E7DDB', fontWeight: 700,
                                    padding: '4px 0', borderRadius: 6, textAlign: 'center',
                                    background: 'rgba(46,125,219,0.04)', transition: 'all 0.2s',
                                }}>
                                    Voir ce vol →
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Premium upsell intégré */}
            {showPremiumStrip && (
                <div style={{
                    margin: isMobile ? '0 12px 12px' : '0 24px 16px',
                    padding: isMobile ? '12px 16px' : '14px 20px',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #1A2B42 0%, #2E4A6E 100%)',
                    display: 'flex',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? 12 : 0,
                    position: 'relative',
                    overflow: 'hidden',
                    animation: 'premiumSlide 0.5s ease both',
                }}>
                    {/* Orbe décoratif */}
                    <div style={{
                        position: 'absolute', right: -20, top: -20,
                        width: 100, height: 100, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(46,125,219,0.3) 0%, transparent 70%)',
                    }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, zIndex: 1 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, #2E7DDB, #06B6D4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, flexShrink: 0,
                        }}>
                            ⚡
                        </div>
                        <div>
                            <div style={{ color: 'white', fontWeight: 700, fontSize: 14, fontFamily: "'Outfit', sans-serif" }}>
                                Premium — 5$/mois
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                                Alertes perso · Prix record · Guides IA
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, zIndex: 1 }}>
                        <button
                            onClick={() => setShowPremiumStrip(false)}
                            style={{
                                padding: '7px 16px', borderRadius: 100,
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'none', color: 'rgba(255,255,255,0.7)',
                                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                fontFamily: "'Outfit', sans-serif",
                            }}
                        >
                            Plus tard
                        </button>
                        <button
                            onClick={() => { /* router.push('/pricing') */ }}
                            style={{
                                padding: '7px 18px', borderRadius: 100, border: 'none',
                                background: 'white', color: '#1A2B42',
                                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                fontFamily: "'Outfit', sans-serif",
                            }}
                        >
                            Essayer →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
