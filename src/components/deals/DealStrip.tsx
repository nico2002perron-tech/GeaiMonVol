'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { HOTELS } from '@/lib/data/hotels';
import { FLIGHTS } from '@/lib/data/flights';
import { useLivePrices } from '@/lib/hooks/useLivePrices';

interface DealStripProps {
    deals?: any[];
    loading?: boolean;
}

export default function DealStrip({ deals = [], loading = false }: DealStripProps) {
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
            if (data) setWatchedDeals(data.map(w => w.destination));
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



    // Filter deals based on tab
    const allMappedDeals = deals.length > 0
        ? deals.map(p => ({
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
            img: FLIGHTS.find(f => f.city === p.destination)?.img || '',
            imgSmall: FLIGHTS.find(f => f.city === p.destination)?.imgSmall || '',
            country: FLIGHTS.find(f => f.city === p.destination)?.country || '',
            tags: [],
            lat: FLIGHTS.find(f => f.city === p.destination)?.lat || 0,
            lon: FLIGHTS.find(f => f.city === p.destination)?.lon || 0,
            id: p.destination_code
        }))
        : [...FLIGHTS].sort((a, b) => b.disc - a.disc);

    const displayDeals = allMappedDeals.filter(d => {
        const isCanada = d.country === 'Canada';
        if (activeTab === 'canada') return isCanada;
        return !isCanada;
    });


    return (
        <div className="strip">
            <div className="strip-head">
                <div className="strip-head-left">
                    <div className="strip-title">
                        Meilleurs deals <em>du moment</em>
                    </div>
                    <div className="strip-tabs">
                        {/* Onglet International */}
                        <button
                            onClick={() => setActiveTab('international')}
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
                            onClick={() => setActiveTab('canada')}
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
                    {displayDeals.slice(0, 7).map((deal, i) => (
                        <div key={deal.id || i} className="scard">
                            <div style={{ position: 'relative', overflow: 'hidden' }}>
                                <img
                                    className="scard-img"
                                    src={deal.imgSmall || deal.img}
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
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
