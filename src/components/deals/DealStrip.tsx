'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { FLIGHTS } from '@/lib/data/flights';
import { DEAL_LEVELS as DEAL_BADGES, CITY_IMAGES, DEFAULT_CITY_IMAGE as DEFAULT_IMAGE, CANADA_CODES } from '@/lib/constants/deals';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

interface DealStripProps {
    deals?: any[];
    loading?: boolean;
    activeTab?: 'international' | 'canada';
    onViewChange?: (view: 'world' | 'canada') => void;
    onDealClick?: (deal: any) => void;
}

export default function DealStrip({ deals = [], loading = false, activeTab = 'international', onViewChange, onDealClick }: DealStripProps) {
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const isMobile = useIsMobile();
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
