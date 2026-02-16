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
    const [activeTab, setActiveTab] = useState<'flights' | 'hotels'>('flights');
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

    const sortedHotels = [...HOTELS].sort((a, b) => b.disc - a.disc);

    // Use passed deals if available, otherwise use internal hook (which is duplicate but safe)
    // Actually, we receive deals from parent now, so we can ignore internal hook or merge?
    // The user instruction said: "Merge live prices with static data" in DealStrip.
    // But we are also passing them from MapInterface.
    // Let's use the props if provided.

    const displayDeals = deals.length > 0
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

    // If loading, maybe show skeleton? For now just show static as fallback is handled above


    return (
        <div className="strip">
            <div className="strip-head">
                <div className="strip-head-left">
                    <div className="strip-title">
                        Meilleurs deals <em>du moment</em>
                    </div>
                    <div className="strip-tabs">
                        <button
                            className={`strip-tab ${activeTab === 'flights' ? 'on' : ''}`}
                            onClick={() => setActiveTab('flights')}
                        >
                            <svg viewBox="0 0 24 24">
                                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                            </svg>
                            Vols
                        </button>
                        <button
                            className={`strip-tab ${activeTab === 'hotels' ? 'on' : ''}`}
                            onClick={() => setActiveTab('hotels')}
                        >
                            <svg viewBox="0 0 24 24">
                                <path d="M3 21h18M3 7v14M21 7v14M6 11h4v4H6zM14 11h4v4h-4zM9 3h6l3 4H6l3-4z" />
                            </svg>
                            Hôtels
                        </button>
                    </div>
                </div>
                <button className="strip-more">Voir tout</button>
            </div>

            {/* Panel Vols */}
            <div className={`strip-panel ${activeTab === 'flights' ? 'show' : ''}`}>
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

            {/* Panel Hôtels */}
            <div className={`strip-panel ${activeTab === 'hotels' ? 'show' : ''}`}>
                <div className="strip-row" id="stripRowHotels">
                    {sortedHotels.slice(0, 7).map((h, i) => {
                        const stars = Array.from({ length: h.stars });
                        return (
                            <div
                                key={i}
                                className="scard"
                                style={{ animationDelay: `${0.7 + i * 0.1}s` }}
                            >
                                <img
                                    className="scard-img"
                                    src={h.photo}
                                    alt={h.name}
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
                                <div className="scard-body">
                                    <div className="scard-stars">
                                        {stars.map((_, si) => (
                                            <svg key={si} className="scard-star" viewBox="0 0 12 12">
                                                <path d="M6 1l1.5 3.1L11 4.6 8.5 7l.6 3.4L6 8.8 2.9 10.4l.6-3.4L1 4.6l3.5-.5L6 1z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <div className="scard-city" style={{ fontSize: '13px' }}>
                                        {h.name}
                                    </div>
                                    <div className="scard-rating">
                                        <span className="scard-rating-num">{h.rating}</span>
                                        {h.city} · {h.reviews.toLocaleString()} avis
                                    </div>
                                    <div className="scard-row">
                                        <span className="scard-price">
                                            {h.price} ${' '}
                                            <span className="scard-pernight">/ nuit</span>
                                        </span>
                                        <span className="scard-disc">-{h.disc}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
