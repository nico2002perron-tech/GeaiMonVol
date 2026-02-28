'use client';
// GeaiMonVol V2 - Sync
import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import CartoonGlobe from './CartoonGlobe';
import Sidebar from './Sidebar';
import BookingPanel from './BookingPanel';
import HowItWorksModal from '@/components/ui/HowItWorksModal';
import MapTopbar from './MapTopbar';
import HoverCard from './HoverCard';
import GeaiAssistant from './GeaiAssistant';
import Confetti from './Confetti';
import Onboarding from './Onboarding';
import { useLivePrices } from '@/lib/hooks/useLivePrices';
// DealSidebar removed — deal info now shown on card flip back face
import HowItWorks from '../landing/HowItWorks';
import PremiumSection from '../landing/PremiumSection';
import RecitsSection from '../landing/RecitsSection';
import TransparenceSection from '../landing/TransparenceSection';
import Footer from '../landing/Footer';
import QuebecPlanner from './QuebecPlanner';
import { useAuth } from '@/lib/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import QuebecQuiz from './QuebecQuiz';
import { CANADA_CODES, DEAL_LEVELS as LEVEL_COLORS, CITY_IMAGES, DEFAULT_CITY_IMAGE } from '@/lib/constants/deals';
import { AIRLINE_BAGGAGE } from '@/lib/constants/airlines';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

// Generate next 12 months for filter pills
function getMonths() {
    const ms: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('fr-CA', { month: 'short' }).replace('.', '');
        ms.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return ms;
}

// ═══════════════════════════════════════════════════════
// INFINITE CAROUSEL — PILL STYLE + EXPAND ON CLICK
// ═══════════════════════════════════════════════════════
function InfiniteCarousel({ deals, isMobile, onDealClick, isLive }: {
    deals: any[];
    isMobile: boolean;
    onDealClick: (deal: any) => void;
    isLive?: boolean;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const [expandedRect, setExpandedRect] = useState<{ top: number; left: number; width: number } | null>(null);
    const isPausedRef = useRef(false);

    const loopedDeals = useMemo(() => {
        if (deals.length === 0) return [];
        return [...deals, ...deals];
    }, [deals]);

    // Auto-scroll — pauses when expanded or hovered
    useEffect(() => {
        const container = scrollRef.current;
        if (!container || deals.length === 0) return;
        let animationId: number;
        const startDelay = setTimeout(() => {
            const halfWidth = container.scrollWidth / 2;
            if (halfWidth <= 0) return;
            const tick = () => {
                if (!isPausedRef.current) {
                    let pos = container.scrollLeft + 0.5;
                    if (pos >= halfWidth) pos -= halfWidth;
                    container.scrollLeft = pos;
                }
                animationId = requestAnimationFrame(tick);
            };
            animationId = requestAnimationFrame(tick);
        }, 400);
        const pause = () => { isPausedRef.current = true; };
        const resume = () => { if (expandedIdx === null) isPausedRef.current = false; };
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
    }, [deals.length, expandedIdx]);

    useEffect(() => {
        isPausedRef.current = expandedIdx !== null;
    }, [expandedIdx]);

    useEffect(() => { setExpandedIdx(null); setExpandedRect(null); }, [deals]);

    const formatShort = (d: string) => {
        if (!d) return '';
        return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
    };

    if (deals.length === 0) {
        return (
            <div className="carousel-wrap" style={{ paddingBottom: 0, pointerEvents: 'auto' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: isMobile ? '16px 12px' : '20px',
                    color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 13 : 14,
                    fontFamily: "'Outfit', sans-serif", gap: 8,
                }}>
                    <span style={{ fontSize: 18 }}>📡</span>
                    Aucun deal trouvé pour ce filtre — essayez «Tous»
                </div>
            </div>
        );
    }

    return (
        <div className="carousel-wrap" style={{ paddingBottom: 0, pointerEvents: 'auto' }}>
            <div style={{ position: 'relative' }}>
                <div className="carousel-fade-left" />
                <div className="carousel-fade-right" />

                <div ref={scrollRef} className="carousel-scroll">
                    {loopedDeals.map((deal: any, i: number) => {
                        const level = deal.dealLevel || 'good';
                        const col = LEVEL_COLORS[level] || LEVEL_COLORS.good;
                        const discount = deal.discount || deal.disc || 0;
                        const city = deal.destination || deal.city || '';
                        const code = deal.destination_code || deal.code || '';
                        const airline = deal.airline || '';
                        const depDate = deal.departure_date || '';
                        const retDate = deal.return_date || '';
                        const avgPrice = deal.avgPrice || 0;
                        const stops = deal.stops ?? null;
                        const isExpanded = expandedIdx === i;
                        const saved = avgPrice > deal.price ? avgPrice - deal.price : 0;
                        const isHot = level === 'lowest_ever' || level === 'incredible';
                        const cityImg = CITY_IMAGES[city] || DEFAULT_CITY_IMAGE;
                        const LEVEL_GRADIENTS: Record<string, { from: string; to: string; border: string; glow: string }> = {
                            lowest_ever: { from: '#3D2680', to: '#1A0F3D', border: 'rgba(124,58,237,0.5)', glow: 'rgba(124,58,237,0.3)' },
                            incredible:  { from: '#4D1F1F', to: '#2A0A0A', border: 'rgba(220,38,38,0.45)', glow: 'rgba(220,38,38,0.25)' },
                            great:       { from: '#4D3020', to: '#2A1508', border: 'rgba(234,88,12,0.4)', glow: 'rgba(234,88,12,0.2)' },
                            good:        { from: '#143058', to: '#0A1830', border: 'rgba(46,125,219,0.35)', glow: 'rgba(46,125,219,0.15)' },
                        };
                        const grad = LEVEL_GRADIENTS[level] || LEVEL_GRADIENTS.good;

                        let nights = 0;
                        if (depDate && retDate) {
                            nights = Math.round((new Date(retDate).getTime() - new Date(depDate).getTime()) / (1000 * 60 * 60 * 24));
                        }

                        const googleLink = deal.googleFlightsLink
                            || deal.raw_data?.google_flights_link
                            || `https://www.google.com/travel/flights?q=Flights+from+YUL+to+${code}&curr=CAD&hl=fr`;

                        // ─── CARD ───
                        return (
                            <div
                                key={`inf-${code}-${i}`}
                                className="carousel-pill"
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    if (expandedIdx === i) {
                                        setExpandedIdx(null);
                                        setExpandedRect(null);
                                    } else {
                                        setExpandedRect({ top: rect.top, left: rect.left, width: rect.width });
                                        setExpandedIdx(i);
                                        onDealClick(deal);
                                    }
                                }}
                                style={{
                                    minWidth: isMobile ? 190 : 215,
                                    maxWidth: isMobile ? 190 : 215,
                                    borderRadius: 16,
                                    background: `linear-gradient(160deg, ${grad.from}, ${grad.to})`,
                                    border: isExpanded
                                        ? `2px solid ${col.bg}`
                                        : `1.5px solid ${grad.border}`,
                                    display: 'flex',
                                    flexDirection: 'column' as const,
                                    padding: 0,
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    transition: 'all 0.3s cubic-bezier(.25,.46,.45,.94)',
                                    fontFamily: "'Outfit', sans-serif",
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transform: isExpanded ? 'scale(1.05)' : 'none',
                                    boxShadow: isExpanded
                                        ? `0 0 24px ${col.bg}50, 0 4px 20px ${grad.glow}`
                                        : `0 4px 20px ${grad.glow}, 0 2px 8px rgba(0,0,0,0.3)`,
                                }}
                            >
                                {/* City image thumbnail */}
                                <div style={{
                                    position: 'relative',
                                    width: '100%',
                                    height: isMobile ? 56 : 64,
                                    overflow: 'hidden',
                                    borderRadius: '16px 16px 0 0',
                                    flexShrink: 0,
                                }}>
                                    <img
                                        src={cityImg}
                                        alt={city}
                                        loading="lazy"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block',
                                        }}
                                    />
                                    {/* Gradient overlay fading into card */}
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: `linear-gradient(180deg, transparent 20%, ${grad.from}80 70%, ${grad.from} 100%)`,
                                    }} />
                                    {/* Badge overlay top-right */}
                                    <span style={{
                                        position: 'absolute', top: 6, right: 6,
                                        fontSize: 7, fontWeight: 800, color: 'white',
                                        background: col.bg, padding: '2px 6px', borderRadius: 4,
                                        letterSpacing: 0.3, whiteSpace: 'nowrap',
                                        boxShadow: `0 2px 8px ${col.bg}60`,
                                    }}>{col.icon} {col.label}</span>
                                </div>

                                {/* Content area */}
                                <div style={{ padding: isMobile ? '8px 12px 10px' : '10px 14px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    {/* City name */}
                                    <span style={{
                                        fontSize: isMobile ? 13 : 14, fontWeight: 700, color: 'white',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        fontFamily: "'Fredoka', sans-serif",
                                        marginBottom: 4,
                                    }}>{city}</span>

                                    {/* Price prominent */}
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                                        <span style={{
                                            fontSize: isMobile ? 20 : 22, fontWeight: 800,
                                            color: '#FFFFFF',
                                            fontFamily: "'Fredoka', sans-serif",
                                            lineHeight: 1,
                                            textShadow: `0 0 16px ${col.bg}60`,
                                        }}>{deal.price}$</span>
                                        {avgPrice > deal.price && (
                                            <span style={{
                                                fontSize: 11, color: 'rgba(255,255,255,0.25)',
                                                textDecoration: 'line-through',
                                            }}>{avgPrice}$</span>
                                        )}
                                    </div>

                                    {/* Savings pill badge */}
                                    {saved > 0 ? (
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            background: 'rgba(57,255,20,0.08)',
                                            border: '1px solid rgba(57,255,20,0.15)',
                                            borderRadius: 6,
                                            padding: '3px 8px',
                                            marginBottom: 4,
                                            alignSelf: 'flex-start',
                                        }}>
                                            <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 700, color: '#39FF14' }}>
                                                💰 −{saved}$
                                            </span>
                                            {discount > 0 && (
                                                <span style={{
                                                    fontSize: 8, fontWeight: 800, color: 'white',
                                                    background: col.bg, padding: '1px 4px', borderRadius: 3,
                                                }}>-{Math.round(discount)}%</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
                                            aller-retour
                                        </div>
                                    )}

                                    {/* Route + info — boarding pass separator */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 'auto',
                                        paddingTop: 4, borderTop: '1px dashed rgba(255,255,255,0.08)',
                                    }}>
                                        <span>YUL → {code}</span>
                                        {stops === 0 && <span style={{ color: '#4ADE80', fontWeight: 600 }}>Direct</span>}
                                        {depDate && <span>{formatShort(depDate)}</span>}
                                    </div>
                                </div>

                                {/* Shimmer sweep on hot deals */}
                                {isHot && (
                                    <div style={{
                                        position: 'absolute', top: 0, left: '-30%',
                                        width: '30%', height: '100%',
                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
                                        animation: 'cardShimmer 4s ease-in-out infinite',
                                        pointerEvents: 'none',
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── EXPANDED DEAL POPOVER (opens upward from card) ── */}
            {expandedIdx !== null && expandedRect && (() => {
                const deal = loopedDeals[expandedIdx];
                if (!deal) return null;
                const level = deal.dealLevel || 'good';
                const col = LEVEL_COLORS[level] || LEVEL_COLORS.good;
                const discount = deal.discount || deal.disc || 0;
                const city = deal.destination || deal.city || '';
                const code = deal.destination_code || deal.code || '';
                const airline = deal.airline || '';
                const depDate = deal.departure_date || '';
                const retDate = deal.return_date || '';
                const avgPrice = deal.avgPrice || 0;
                const stops = deal.stops ?? null;
                const saved = avgPrice > deal.price ? avgPrice - deal.price : 0;
                const EXP_GRAD: Record<string, { from: string; to: string; border: string }> = {
                    lowest_ever: { from: '#2D1B69', to: '#1A0F3D', border: 'rgba(124,58,237,0.5)' },
                    incredible:  { from: '#3D1515', to: '#2A0A0A', border: 'rgba(220,38,38,0.45)' },
                    great:       { from: '#3D2515', to: '#2A1508', border: 'rgba(234,88,12,0.4)' },
                    good:        { from: '#0F2444', to: '#0A1830', border: 'rgba(46,125,219,0.35)' },
                };
                const eGrad = EXP_GRAD[level] || EXP_GRAD.good;

                let nights = 0;
                if (depDate && retDate) {
                    nights = Math.round((new Date(retDate).getTime() - new Date(depDate).getTime()) / (1000 * 60 * 60 * 24));
                }

                const googleLink = deal.googleFlightsLink
                    || deal.raw_data?.google_flights_link
                    || `https://www.google.com/travel/flights?q=Flights+from+YUL+to+${code}&curr=CAD&hl=fr`;

                const baggage = AIRLINE_BAGGAGE[airline] || null;
                const popoverWidth = isMobile ? 230 : 260;

                return (
                    <>
                        {/* Invisible backdrop to close on outside click */}
                        <div
                            onClick={() => { setExpandedIdx(null); setExpandedRect(null); }}
                            style={{ position: 'fixed', inset: 0, zIndex: 9997 }}
                        />
                        {/* Popover anchored above the card */}
                        <div style={{
                            position: 'fixed',
                            bottom: `calc(100vh - ${expandedRect.top}px + 8px)`,
                            left: expandedRect.left + expandedRect.width / 2,
                            transform: 'translateX(-50%)',
                            zIndex: 9999,
                            width: popoverWidth,
                            background: `linear-gradient(160deg, ${eGrad.from}, ${eGrad.to})`,
                            border: `1.5px solid ${eGrad.border}`,
                            borderRadius: 14,
                            padding: isMobile ? '12px 12px' : '14px 14px',
                            fontFamily: "'Outfit', sans-serif",
                            boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 24px ${col.bg}20`,
                            animation: 'popoverSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
                        }}>
                            {/* Top accent */}
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                                borderRadius: '14px 14px 0 0',
                                background: `linear-gradient(90deg, transparent, ${col.bg}, transparent)`,
                            }} />

                            {/* Arrow pointing down to card */}
                            <div style={{
                                position: 'absolute', bottom: -7,
                                left: '50%', transform: 'translateX(-50%)',
                                width: 0, height: 0,
                                borderLeft: '7px solid transparent',
                                borderRight: '7px solid transparent',
                                borderTop: `7px solid ${eGrad.from}`,
                                filter: `drop-shadow(0 2px 3px rgba(0,0,0,0.3))`,
                            }} />

                            {/* Route + stops */}
                            <div style={{
                                fontSize: 11, color: 'rgba(255,255,255,0.5)',
                                marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <span>YUL → {code}</span>
                                {stops === 0 && <span style={{ color: '#4ADE80', fontWeight: 700, fontSize: 10 }}>✓ Direct</span>}
                                {stops != null && stops > 0 && <span style={{ fontSize: 10 }}>{stops} escale{stops > 1 ? 's' : ''}</span>}
                            </div>

                            {/* Dates + duration */}
                            {depDate && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                                    padding: '8px 0', marginBottom: 8,
                                    borderTop: '1px solid rgba(255,255,255,0.06)',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    fontSize: 11, color: 'rgba(255,255,255,0.6)',
                                }}>
                                    <span>📅 {formatShort(depDate)}</span>
                                    {retDate && <span>→ {formatShort(retDate)}</span>}
                                    {nights > 0 && (
                                        <span style={{
                                            fontSize: 9, fontWeight: 700,
                                            background: 'rgba(255,255,255,0.08)',
                                            padding: '2px 7px', borderRadius: 100,
                                        }}>{nights} nuits</span>
                                    )}
                                </div>
                            )}

                            {/* Airline + baggage */}
                            {airline && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                                    fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 10,
                                }}>
                                    <span>✈️ {airline}</span>
                                    {baggage && (
                                        <span style={{
                                            fontSize: 9, fontWeight: 600,
                                            background: 'rgba(255,255,255,0.08)',
                                            padding: '2px 6px', borderRadius: 4,
                                        }}>
                                            🧳 {baggage.cabin ? 'Cabine incluse' : 'Cabine en extra'}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* CTA Button */}
                            <a
                                href={googleLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    width: '100%', padding: '9px 12px', borderRadius: 10,
                                    background: `linear-gradient(135deg, ${col.bg}, ${col.bg}CC)`,
                                    color: 'white', fontSize: 12, fontWeight: 700,
                                    textDecoration: 'none', border: 'none', cursor: 'pointer',
                                    boxShadow: `0 3px 12px ${col.bg}40`,
                                    fontFamily: "'Outfit', sans-serif",
                                }}
                            >
                                Voir sur Google Flights →
                            </a>
                        </div>
                    </>
                );
            })()}
        </div>
    );
}

export default function MapInterface() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [appReady, setAppReady] = useState(true);
    const [selectedRegion, setSelectedRegion] = useState<string | undefined>();
    const [selectedFlight, setSelectedFlight] = useState<any>(null);
    const [mapView, setMapView] = useState<'world' | 'canada'>('world');
    // DealSidebar removed — selectedDeal state no longer needed
    const [flyToDeal, setFlyToDeal] = useState<any>(null);
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = useState<'international' | 'canada' | 'tout-inclus'>('international');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const { user, loading: authLoading } = useAuth();
    const [showQuebecPlanner, setShowQuebecPlanner] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [quizOpen, setQuizOpen] = useState(false);

    const carouselRef = useRef<HTMLDivElement>(null);

    const months = useMemo(() => getMonths(), []);



    const handleQuebecClick = () => {
        if (!user) {
            setShowLoginPrompt(true);
            setTimeout(() => setShowLoginPrompt(false), 4000);
            return;
        }
        setQuizOpen(true);
    };

    const [hoveredDeal, setHoveredDeal] = useState<any>(null);
    const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
    const [hoverVisible, setHoverVisible] = useState(false);
    const [confettiTrigger, setConfettiTrigger] = useState(0);
    const [confettiPos, setConfettiPos] = useState({ x: 0, y: 0 });

    const { prices, loading: pricesLoading, lastUpdated, isLive } = useLivePrices();

    // Handle tab switching — sync with mapView
    const handleTabChange = (tab: string) => {
        if (tab === 'international') {
            setActiveTab('international');
            setMapView('world');
        } else if (tab === 'canada') {
            setActiveTab('canada');
            setMapView('canada');
        } else if (tab === 'tout-inclus') {
            setActiveTab('tout-inclus');
            setMapView('world');
        }
        setSelectedMonth('all'); // Reset month on tab switch
    };

    // ─── FILTER DEALS BY TAB + MONTH ───
    const filteredPrices = useMemo(() => {
        return (prices || []).filter((d: any) => {
            const code = d.destination_code || d.code || '';
            const isCanadian = CANADA_CODES.includes(code);
            if (activeTab === 'canada' && !isCanadian) return false;
            if (activeTab !== 'canada' && isCanadian) return false;
            if (selectedMonth !== 'all') {
                const dep = d.departure_date || '';
                if (!dep.startsWith(selectedMonth)) return false;
            }
            return true;
        });
    }, [prices, activeTab, selectedMonth]);

    // ─── TOP 5 GROS DEALS ───
    const top5Deals = useMemo(() => {
        return [...filteredPrices]
            .sort((a: any, b: any) => (b.discount || 0) - (a.discount || 0))
            .slice(0, 5);
    }, [filteredPrices]);

    // ─── CAROUSEL DEALS (sorted by discount) ───
    const carouselDeals = useMemo(() => {
        return [...filteredPrices]
            .sort((a: any, b: any) => (b.discount || 0) - (a.discount || 0));
    }, [filteredPrices]);

    // ─── AVAILABLE MONTHS (only months with deals) ───
    const availableMonths = useMemo(() => {
        return months.filter(m => {
            return (prices || []).some((d: any) => {
                const dep = d.departure_date || '';
                const code = d.destination_code || d.code || '';
                const isCanadian = CANADA_CODES.includes(code);
                const isCorrectTab = activeTab === 'canada' ? isCanadian : !isCanadian;
                return isCorrectTab && dep.startsWith(m.value);
            });
        });
    }, [prices, activeTab, months]);

    // Scroll carousel to start on filter change
    useEffect(() => {
        if (carouselRef.current) carouselRef.current.scrollLeft = 0;
    }, [selectedMonth, activeTab]);

    const tabs = [
        { key: 'international', label: 'Monde', icon: '✈️', desc: 'Tous les deals' },
        { key: 'canada', label: 'Canada', icon: '🍁', desc: 'Vols intérieurs' },
        { key: 'tout-inclus', label: 'Tout inclus', icon: '🏖️', desc: 'Vol + hôtel' },
    ];

    // ─── FLOATING PILL TABS — refs & sliding indicator ───
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

    const tabCounts = useMemo(() => {
        const all = prices || [];
        const intl = all.filter((d: any) => {
            const code = d.destination_code || d.code || '';
            return !CANADA_CODES.includes(code);
        }).length;
        const ca = all.filter((d: any) => {
            const code = d.destination_code || d.code || '';
            return CANADA_CODES.includes(code);
        }).length;
        return { international: intl, canada: ca, 'tout-inclus': intl };
    }, [prices]);

    useLayoutEffect(() => {
        const idx = tabs.findIndex(t => t.key === activeTab);
        const el = tabRefs.current[idx];
        if (el) {
            setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
        }
    }, [activeTab, tabCounts]);

    // Called from carousel cards — triggers holo animation only
    const handleCarouselDealClick = (deal: any) => {
        setPingDeal(null);
        userInteractedRef.current = true;
        if (pingTimerRef.current) clearTimeout(pingTimerRef.current);
        setFlyToDeal({ ...deal, _ts: Date.now() });
    };

    // ─── AUTO-PING TOP DEALS (idle state) ───
    const [pingDeal, setPingDeal] = useState<any>(null);
    const pingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pingIdxRef = useRef(0);
    const userInteractedRef = useRef(false);

    // Reset user interaction flag when holo completes
    const handleHoloComplete = () => {
        setFlyToDeal(null);
        // If it was a user click, keep paused for a bit then resume
        if (userInteractedRef.current) {
            userInteractedRef.current = false;
        }
    };

    useEffect(() => {
        if (top5Deals.length === 0) return;

        const triggerPing = () => {
            // Skip if a holo is currently playing
            if (flyToDeal) return;
            const idx = pingIdxRef.current % top5Deals.length;
            pingIdxRef.current = idx + 1;
            const deal = top5Deals[idx];
            setPingDeal(deal);
            // Trigger holo fly for the ping
            setFlyToDeal({ ...deal, _ts: Date.now(), _autoPing: true });

            // Auto-dismiss card after 7s
            if (pingTimerRef.current) clearTimeout(pingTimerRef.current);
            pingTimerRef.current = setTimeout(() => {
                setPingDeal(null);
            }, 7000);
        };

        // Initial delay before first ping
        const startDelay = setTimeout(triggerPing, 6000);

        // Recurring — slower rotation (~18s between pings)
        const interval = setInterval(triggerPing, 18000);

        return () => {
            clearTimeout(startDelay);
            clearInterval(interval);
            if (pingTimerRef.current) clearTimeout(pingTimerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [top5Deals.length]);

    return (
        <>
            <style>{`
                @keyframes liveBlink{0%,100%{opacity:1}50%{opacity:.3}}
                @keyframes tabGlow{0%,100%{box-shadow:0 0 20px rgba(0,212,255,0.15)}50%{box-shadow:0 0 28px rgba(0,212,255,0.25)}}
                @keyframes fadeInUp{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
                @keyframes scrollHint{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
                @keyframes pingSlideIn{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}
                @keyframes pingSlideOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(0.7)}}
                @keyframes pingPulseRing{0%{transform:scale(0.8);opacity:0.8}100%{transform:scale(2.5);opacity:0}}
                @keyframes popoverSlideUp{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
                @keyframes pingEntrance{0%{opacity:0;transform:scale(0.5) translateX(30px);filter:blur(8px)}50%{opacity:1;filter:blur(0)}70%{transform:scale(1.05) translateX(0)}100%{transform:scale(1) translateX(0)}}
                @keyframes pingGlowBreath{0%,100%{box-shadow:0 8px 32px var(--ping-glow),0 4px 16px rgba(0,0,0,0.4)}50%{box-shadow:0 12px 48px var(--ping-glow),0 4px 16px rgba(0,0,0,0.4),0 0 40px 4px var(--ping-glow)}}
                @keyframes pingScanLine{0%{left:-20%}100%{left:120%}}
                @keyframes savingsPulse{0%,100%{box-shadow:0 0 4px rgba(57,255,20,0.3)}50%{box-shadow:0 0 12px rgba(57,255,20,0.6),0 0 24px rgba(57,255,20,0.2)}}
                @keyframes cardShimmer{0%{left:-30%}100%{left:130%}}
                .month-pill{transition:all 0.25s ease;}
                .month-pill:hover{background:rgba(255,255,255,0.08)!important;}
                .carousel-scroll::-webkit-scrollbar{display:none;}
                .carousel-scroll{scrollbar-width:none;}
                .top5-card{transition:all 0.25s cubic-bezier(.25,.46,.45,.94);}
                .top5-card:hover{background:rgba(255,255,255,0.08)!important;transform:translateX(2px);}
                .carousel-pill{transition:all 0.3s cubic-bezier(.25,.46,.45,.94);}
                .carousel-pill:hover{transform:translateY(-6px) scale(1.03);box-shadow:0 12px 36px rgba(0,212,255,0.2),0 6px 16px rgba(0,0,0,0.5)!important;border-color:rgba(0,212,255,0.3)!important;z-index:2;}
            `}</style>

            <div id="app" className={appReady ? 'show' : ''} style={{
                minHeight: '100vh',
                background: '#050508',
            }}>
                {/* ═══════════ SECTION 1 : CARTE INTERACTIVE FULL ═══════════ */}
                <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <MapTopbar prices={prices} />

                    {/* ═══ MAP AREA ═══ */}
                    <div style={{
                        flex: '1 1 auto', minHeight: 0, position: 'relative',
                        background: '#000000', overflow: 'hidden',
                    }}>
                        {/* ── FLOATING ORBIT SELECTOR (Pill Tabs) ── */}
                        <div style={{
                            position: 'absolute',
                            top: isMobile ? 10 : 16,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 40,
                            background: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            borderRadius: isMobile ? 22 : 26,
                            border: '1px solid rgba(0,212,255,0.08)',
                            padding: isMobile ? 4 : 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: isMobile ? 2 : 4,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
                            animation: 'fadeInUp 0.5s ease-out both',
                        }}>
                            {/* Sliding indicator */}
                            <div style={{
                                position: 'absolute',
                                top: isMobile ? 4 : 6,
                                left: indicatorStyle.left,
                                width: indicatorStyle.width,
                                height: isMobile ? 'calc(100% - 8px)' : 'calc(100% - 12px)',
                                borderRadius: isMobile ? 18 : 20,
                                background: 'linear-gradient(135deg, rgba(0,212,255,0.25), rgba(0,180,220,0.15))',
                                border: '1px solid rgba(0,212,255,0.2)',
                                transition: 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                animation: 'tabGlow 3s ease-in-out infinite',
                                pointerEvents: 'none',
                                zIndex: 0,
                            }} />
                            {tabs.map((tab, i) => {
                                const isActive = activeTab === tab.key;
                                const count = tabCounts[tab.key as keyof typeof tabCounts] || 0;
                                return (
                                    <button
                                        key={tab.key}
                                        ref={el => { tabRefs.current[i] = el; }}
                                        onClick={() => handleTabChange(tab.key)}
                                        style={{
                                            position: 'relative',
                                            zIndex: 1,
                                            padding: isMobile ? '10px 16px' : '12px 28px',
                                            borderRadius: isMobile ? 18 : 20,
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: isMobile ? 6 : 10,
                                            transition: 'all 0.3s ease',
                                            fontFamily: "'Outfit', sans-serif",
                                            whiteSpace: 'nowrap' as const,
                                        }}
                                    >
                                        <span style={{
                                            fontSize: isMobile ? 17 : 20,
                                            transition: 'transform 0.3s ease',
                                            transform: isActive ? 'scale(1.15)' : 'scale(1)',
                                            filter: isActive ? 'none' : 'grayscale(0.6)',
                                        }}>{tab.icon}</span>
                                        <span style={{
                                            fontSize: isMobile ? 13 : 14,
                                            fontWeight: isActive ? 700 : 500,
                                            color: isActive ? '#FFF' : 'rgba(255,255,255,0.45)',
                                            transition: 'color 0.3s, font-weight 0.3s',
                                            lineHeight: 1.2,
                                        }}>{tab.label}</span>
                                        {count > 0 && (
                                            <span style={{
                                                fontSize: isMobile ? 9 : 10,
                                                fontWeight: 600,
                                                padding: '1px 6px',
                                                borderRadius: 100,
                                                background: isActive ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)',
                                                color: isActive ? '#7DF9FF' : 'rgba(255,255,255,0.3)',
                                                transition: 'all 0.3s ease',
                                                fontFamily: "'Outfit', sans-serif",
                                                lineHeight: '16px',
                                            }}>{count}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* ── BOUTON QUÉBEC (FAB top-left) ── */}
                        <button
                            onClick={handleQuebecClick}
                            style={{
                                position: 'absolute',
                                top: isMobile ? 10 : 16,
                                left: isMobile ? 10 : 16,
                                zIndex: 40,
                                display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 8,
                                padding: isMobile ? '8px 12px' : '10px 18px',
                                borderRadius: 16,
                                border: '1px solid rgba(0,212,255,0.08)',
                                cursor: 'pointer',
                                fontFamily: "'Fredoka', sans-serif",
                                background: 'rgba(0,0,0,0.5)',
                                backdropFilter: 'blur(24px)',
                                WebkitBackdropFilter: 'blur(24px)',
                                color: 'white',
                                fontSize: isMobile ? 11 : 13,
                                fontWeight: 700,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
                                transition: 'all 0.3s ease',
                                whiteSpace: 'nowrap' as const,
                            }}
                        >
                            <span style={{ fontSize: isMobile ? 14 : 16 }}>⚜️</span>
                            <span>{isMobile ? 'Québec' : 'Planifie ton Québec'}</span>
                            <span style={{
                                fontSize: 9, fontWeight: 600,
                                padding: '2px 6px', borderRadius: 100,
                                background: 'rgba(0,212,255,0.15)',
                                color: '#7DF9FF',
                            }}>GRATUIT</span>
                        </button>

                        {/* ── PING DEAL NOTIFICATION ── */}
                        {pingDeal && (() => {
                            const pLevel = pingDeal.dealLevel || 'good';
                            const pCol = LEVEL_COLORS[pLevel] || LEVEL_COLORS.good;
                            const pAvg = pingDeal.avgPrice || 0;
                            const pSaved = pAvg > pingDeal.price ? pAvg - pingDeal.price : 0;
                            const pDiscount = pingDeal.discount || pingDeal.disc || 0;
                            const pCity = pingDeal.destination || pingDeal.city || '';
                            const pCode = pingDeal.destination_code || pingDeal.code || '';
                            const pGrad: Record<string, { from: string; to: string }> = {
                                lowest_ever: { from: '#3D2680', to: '#1A0F3D' },
                                incredible:  { from: '#4D1F1F', to: '#2A0A0A' },
                                great:       { from: '#4D3020', to: '#2A1508' },
                                good:        { from: '#143058', to: '#0A1830' },
                            };
                            const pg = pGrad[pLevel] || pGrad.good;
                            const pingGlowColor = pCol.bg + '30';
                            return (
                                <div style={{
                                    position: 'fixed',
                                    top: '45%',
                                    left: isMobile ? '50%' : 'calc(50% + 40px)',
                                    transform: isMobile ? 'translate(-50%, -120%)' : 'translateY(-50%)',
                                    zIndex: 9990,
                                }}>
                                <div
                                    onClick={() => {
                                        setPingDeal(null);
                                        setFlyToDeal({ ...pingDeal, _ts: Date.now() });
                                    }}
                                    style={{
                                        width: isMobile ? 240 : 280,
                                        background: `linear-gradient(160deg, ${pg.from}, ${pg.to})`,
                                        border: `1.5px solid ${pCol.bg}50`,
                                        borderRadius: 18,
                                        padding: isMobile ? '14px 16px' : '16px 18px',
                                        cursor: 'pointer',
                                        animation: 'pingEntrance 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
                                        fontFamily: "'Outfit', sans-serif",
                                        overflow: 'hidden',
                                        position: 'relative',
                                        // @ts-ignore -- CSS custom property for glow animation
                                        '--ping-glow': pingGlowColor,
                                    } as React.CSSProperties & { '--ping-glow': string }}
                                    className="ping-deal-card"
                                >
                                    {/* Animated glow breath */}
                                    <style>{`.ping-deal-card{animation:pingEntrance 0.5s cubic-bezier(0.34,1.56,0.64,1) both,pingGlowBreath 3s ease-in-out infinite 0.5s!important;}`}</style>

                                    {/* Scan line */}
                                    <div style={{
                                        position: 'absolute', top: 0, left: '-20%',
                                        width: '20%', height: '100%',
                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
                                        animation: 'pingScanLine 3s linear infinite',
                                        pointerEvents: 'none',
                                    }} />

                                    {/* Arrow pointing toward globe center (left side) */}
                                    {!isMobile && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: -8,
                                            transform: 'translateY(-50%)',
                                            width: 0, height: 0,
                                            borderTop: '8px solid transparent',
                                            borderBottom: '8px solid transparent',
                                            borderRight: `8px solid ${pg.from}`,
                                            filter: `drop-shadow(-2px 0 4px ${pCol.bg}40)`,
                                        }} />
                                    )}

                                    {/* Top accent */}
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                                        background: `linear-gradient(90deg, transparent, ${pCol.bg}, transparent)`,
                                    }} />

                                    {/* Double pulse ring */}
                                    <div style={{
                                        position: 'absolute', top: -4, right: -4,
                                        width: 14, height: 14, borderRadius: '50%',
                                        background: pCol.bg,
                                        boxShadow: `0 0 8px ${pCol.bg}`,
                                    }}>
                                        <div style={{
                                            position: 'absolute', inset: -6,
                                            borderRadius: '50%',
                                            border: `2px solid ${pCol.bg}`,
                                            animation: 'pingPulseRing 1.5s ease-out infinite',
                                        }} />
                                        <div style={{
                                            position: 'absolute', inset: -6,
                                            borderRadius: '50%',
                                            border: `2px solid ${pCol.bg}`,
                                            animation: 'pingPulseRing 1.5s ease-out infinite 0.5s',
                                        }} />
                                    </div>

                                    {/* Header with live dot */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                        <span style={{
                                            width: 6, height: 6, borderRadius: '50%',
                                            background: '#16A34A',
                                            animation: 'liveBlink 2s ease-in-out infinite',
                                            flexShrink: 0,
                                        }} />
                                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' as const }}>
                                            deal détecté
                                        </span>
                                        <span style={{
                                            fontSize: 7, fontWeight: 800, color: 'white',
                                            background: `linear-gradient(135deg, ${pCol.bg}, ${pCol.bg}CC)`,
                                            padding: '2px 7px', borderRadius: 4,
                                            boxShadow: `0 2px 8px ${pCol.bg}40`,
                                        }}>{pCol.icon} {pCol.label}</span>
                                    </div>

                                    {/* City + route */}
                                    <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: 'white', fontFamily: "'Fredoka', sans-serif", marginBottom: 4 }}>
                                        {pCity}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>
                                        YUL → {pCode}
                                    </div>

                                    {/* Price hero panel */}
                                    <div style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: 10,
                                        padding: isMobile ? '10px 12px' : '12px 14px',
                                        marginBottom: 8,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: pSaved > 0 ? 6 : 0 }}>
                                            <span style={{
                                                fontSize: isMobile ? 28 : 32, fontWeight: 800, color: '#FFF',
                                                fontFamily: "'Fredoka', sans-serif", lineHeight: 1,
                                                textShadow: `0 0 20px ${pCol.bg}60`,
                                            }}>{pingDeal.price}$</span>
                                            {pAvg > pingDeal.price && (
                                                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', textDecoration: 'line-through' }}>
                                                    {pAvg}$
                                                </span>
                                            )}
                                        </div>
                                        {pSaved > 0 && (
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                                background: 'rgba(57,255,20,0.08)',
                                                border: '1px solid rgba(57,255,20,0.15)',
                                                borderRadius: 6,
                                                padding: '3px 10px',
                                                animation: 'savingsPulse 2s ease-in-out infinite',
                                            }}>
                                                <span style={{ fontSize: 11, fontWeight: 800, color: '#39FF14' }}>
                                                    💰 −{pSaved}$/billet
                                                </span>
                                                {pDiscount > 0 && (
                                                    <span style={{
                                                        fontSize: 9, fontWeight: 700, color: 'white',
                                                        background: pCol.bg, padding: '2px 6px', borderRadius: 4,
                                                    }}>-{Math.round(pDiscount)}%</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Tap hint */}
                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
                                        Touche pour voir le trajet →
                                    </div>
                                </div>
                                </div>
                            );
                        })()}

                        {/* ── LÉGENDE + TOP 5 GROS DEALS (haut droit) ── */}
                        <div style={{
                            position: 'absolute',
                            top: isMobile ? 8 : 12,
                            right: isMobile ? 8 : 16,
                            zIndex: 30,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            maxWidth: isMobile ? 160 : 200,
                        }}>
                            {/* Légende des couleurs */}
                            <div style={{
                                background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(12px)',
                                borderRadius: 10,
                                padding: isMobile ? '6px 10px' : '8px 14px',
                                border: '1px solid rgba(0,212,255,0.08)',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                            }}>
                                <span style={{
                                    fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.45)',
                                    letterSpacing: 0.5, textTransform: 'uppercase' as const,
                                    fontFamily: "'Outfit', sans-serif", marginBottom: 1,
                                }}>
                                    Niveaux de deal
                                </span>
                                {[
                                    { color: '#7C3AED', label: 'Prix record', icon: '⚡' },
                                    { color: '#DC2626', label: 'Incroyable', icon: '🔥' },
                                    { color: '#EA580C', label: 'Super deal', icon: '✨' },
                                    { color: '#00D4FF', label: 'Bon prix', icon: '👍' },
                                ].map(item => (
                                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            background: item.color, flexShrink: 0,
                                            boxShadow: `0 0 6px ${item.color}60`,
                                        }} />
                                        <span style={{
                                            fontSize: isMobile ? 9 : 10, fontWeight: 600,
                                            color: 'rgba(255,255,255,0.85)', fontFamily: "'Outfit', sans-serif",
                                        }}>
                                            {item.icon} {item.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* ── TOP 5 GROS DEALS ── */}
                            <div style={{
                                background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(12px)',
                                borderRadius: 10,
                                padding: isMobile ? '6px 8px' : '8px 10px',
                                border: '1px solid rgba(0,212,255,0.08)',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                            }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    marginBottom: 2,
                                }}>
                                    <span style={{ fontSize: 10 }}>🏆</span>
                                    <span style={{
                                        fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.55)',
                                        letterSpacing: 0.8, textTransform: 'uppercase' as const,
                                        fontFamily: "'Outfit', sans-serif",
                                    }}>
                                        TOP 5 GROS DEALS
                                    </span>
                                    <span style={{
                                        width: 5, height: 5, borderRadius: '50%',
                                        background: '#16A34A', animation: 'liveBlink 2s ease-in-out infinite',
                                    }} />
                                </div>
                                {top5Deals.map((deal: any, i: number) => {
                                    const level = deal.dealLevel || 'good';
                                    const col = LEVEL_COLORS[level] || LEVEL_COLORS.good;
                                    const discount = deal.discount || deal.disc || 0;
                                    const city = deal.destination || deal.city || '';
                                    const code = deal.destination_code || deal.code || '';

                                    return (
                                        <div
                                            key={`top5-${code}-${i}`}
                                            className="top5-card"
                                            onClick={() => handleCarouselDealClick(deal)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                padding: '5px 8px', borderRadius: 8,
                                                background: 'rgba(255,255,255,0.04)',
                                                border: '1px solid rgba(255,255,255,0.04)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {/* Rank */}
                                            <span style={{
                                                fontSize: 10, fontWeight: 800, color: col.bg,
                                                fontFamily: "'Fredoka', sans-serif",
                                                minWidth: 14, textAlign: 'center',
                                            }}>
                                                {i + 1}
                                            </span>
                                            {/* City + route */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: isMobile ? 10 : 11, fontWeight: 700, color: 'white',
                                                    fontFamily: "'Outfit', sans-serif",
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                }}>
                                                    {city}
                                                </div>
                                                <div style={{
                                                    fontSize: 8, color: 'rgba(255,255,255,0.3)',
                                                    fontFamily: "'Outfit', sans-serif",
                                                }}>
                                                    YUL → {code}{deal.stops === 0 ? ' · Direct' : ''}
                                                </div>
                                            </div>
                                            {/* Price + discount */}
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{
                                                    fontSize: isMobile ? 11 : 12, fontWeight: 800,
                                                    color: '#4ADE80',
                                                    fontFamily: "'Fredoka', sans-serif",
                                                }}>
                                                    {deal.price}$
                                                </div>
                                                {discount > 0 && (
                                                    <span style={{
                                                        fontSize: 8, fontWeight: 800, color: col.bg,
                                                    }}>
                                                        -{Math.round(discount)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {top5Deals.length === 0 && (
                                    <div style={{
                                        fontSize: 9, color: 'rgba(255,255,255,0.3)',
                                        textAlign: 'center', padding: '8px 0',
                                    }}>
                                        Aucun deal pour cette période
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── CARTOON GLOBE ── */}
                        <CartoonGlobe
                            deals={flyToDeal ? [flyToDeal] : (prices || [])}
                            mapView={mapView}
                            isMobile={isMobile}
                            onRegionSelect={(region: string) => {
                                setSelectedRegion(region);
                                setSidebarOpen(true);
                            }}
                            onHoverDeal={(deal: any, e: MouseEvent | React.MouseEvent) => {
                                setHoveredDeal(deal);
                                setHoverPos({ x: e.clientX, y: e.clientY });
                                setHoverVisible(true);
                            }}
                            onLeaveDeal={() => setHoverVisible(false)}
                            onSelectDeal={(deal: any, e: any) => {
                                setConfettiPos({ x: e.clientX, y: e.clientY });
                                setConfettiTrigger(prev => prev + 1);
                            }}
                            flyToDeal={flyToDeal}
                            onHoloComplete={handleHoloComplete}
                        />

                        {/* ═══ CAROUSEL + MOIS — collé au bas du globe ═══ */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0, right: 0,
                            zIndex: 15,
                            pointerEvents: 'none',
                        }}>
                            {/* Month pills — au-dessus du carousel */}
                            <div style={{
                                display: 'flex', gap: 5,
                                overflowX: 'auto', maxWidth: '100%',
                                padding: isMobile ? '0 12px 6px' : '0 20px 6px',
                                scrollbarWidth: 'none',
                                pointerEvents: 'auto',
                            }}>
                                <button
                                    className="month-pill"
                                    onClick={() => setSelectedMonth('all')}
                                    style={{
                                        padding: isMobile ? '6px 14px' : '7px 18px',
                                        borderRadius: 10, cursor: 'pointer',
                                        fontSize: isMobile ? 11 : 12, fontWeight: 700,
                                        fontFamily: "'Outfit', sans-serif",
                                        whiteSpace: 'nowrap',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        background: selectedMonth === 'all'
                                            ? 'linear-gradient(135deg, rgba(0,212,255,0.25), rgba(0,160,200,0.15))'
                                            : 'rgba(0,0,0,0.5)',
                                        backdropFilter: 'blur(12px)',
                                        color: selectedMonth === 'all' ? 'white' : 'rgba(255,255,255,0.5)',
                                        boxShadow: selectedMonth === 'all'
                                            ? '0 3px 10px rgba(0,212,255,0.2)'
                                            : '0 2px 6px rgba(0,0,0,0.2)',
                                        border: selectedMonth === 'all'
                                            ? '1px solid rgba(0,212,255,0.25)'
                                            : '1px solid rgba(255,255,255,0.06)',
                                    }}
                                >
                                    Tous
                                    <span style={{
                                        fontSize: 9, fontWeight: 800,
                                        background: selectedMonth === 'all' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                                        padding: '1px 6px', borderRadius: 100,
                                    }}>
                                        {filteredPrices.length || (prices || []).filter((d: any) => {
                                            const code = d.destination_code || '';
                                            const isCanadian = CANADA_CODES.includes(code);
                                            return activeTab === 'canada' ? isCanadian : !isCanadian;
                                        }).length}
                                    </span>
                                </button>
                                {availableMonths.map(m => {
                                    const monthCount = (prices || []).filter((d: any) => {
                                        const dep = d.departure_date || '';
                                        const code = d.destination_code || '';
                                        const isCanadian = CANADA_CODES.includes(code);
                                        const isCorrectTab = activeTab === 'canada' ? isCanadian : !isCanadian;
                                        return isCorrectTab && dep.startsWith(m.value);
                                    }).length;

                                    return (
                                        <button
                                            key={m.value}
                                            className="month-pill"
                                            onClick={() => setSelectedMonth(m.value)}
                                            style={{
                                                padding: isMobile ? '6px 14px' : '7px 18px',
                                                borderRadius: 10, cursor: 'pointer',
                                                fontSize: isMobile ? 11 : 12, fontWeight: 700,
                                                fontFamily: "'Outfit', sans-serif",
                                                whiteSpace: 'nowrap',
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                background: selectedMonth === m.value
                                                    ? 'linear-gradient(135deg, rgba(0,212,255,0.25), rgba(0,160,200,0.15))'
                                                    : 'rgba(0,0,0,0.5)',
                                                backdropFilter: 'blur(12px)',
                                                color: selectedMonth === m.value ? 'white' : 'rgba(255,255,255,0.5)',
                                                boxShadow: selectedMonth === m.value
                                                    ? '0 3px 10px rgba(0,212,255,0.2)'
                                                    : '0 2px 6px rgba(0,0,0,0.2)',
                                                border: selectedMonth === m.value
                                                    ? '1px solid rgba(0,212,255,0.25)'
                                                    : '1px solid rgba(255,255,255,0.06)',
                                            }}
                                        >
                                            {m.label}
                                            <span style={{
                                                fontSize: 9, fontWeight: 800,
                                                background: selectedMonth === m.value ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                                                padding: '1px 6px', borderRadius: 100,
                                            }}>
                                                {monthCount}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Live/indicative data badge */}
                            {!pricesLoading && !isLive && prices.length > 0 && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: isMobile ? '4px 12px' : '4px 20px',
                                    pointerEvents: 'auto',
                                }}>
                                    <span style={{
                                        fontSize: isMobile ? 10 : 11,
                                        color: 'rgba(255,255,255,0.4)',
                                        fontFamily: "'Outfit', sans-serif",
                                        fontWeight: 500,
                                    }}>
                                        📊 Données indicatives — mise à jour bientôt
                                    </span>
                                </div>
                            )}

                            {/* Carousel */}
                            <InfiniteCarousel
                                deals={carouselDeals}
                                isMobile={isMobile}
                                onDealClick={handleCarouselDealClick}
                                isLive={isLive}
                            />
                        </div>
                    </div>
                </div>

                <Onboarding />

                <HoverCard
                    deal={hoveredDeal}
                    x={hoverPos.x}
                    y={hoverPos.y}
                    visible={hoverVisible}
                />

                {/* ═══ GRADIENT TRANSITION: dark → light ═══ */}
                <div style={{
                    height: 200,
                    background: 'linear-gradient(180deg, #050508 0%, #F4F8FB 100%)',
                    flexShrink: 0,
                }} />

                {/* ═══════════ SECTION 2+ : Below the fold ═══════════ */}
                <div id="deals" style={{ background: '#F4F8FB' }}>
                    <HowItWorks />
                </div>

                <PremiumSection />

                <div id="recits-section">
                    <RecitsSection />
                </div>

                <TransparenceSection />

                <Footer />

                {/* DealSidebar removed — info is now on card flip back */}
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    selectedRegion={selectedRegion}
                    onSelectFlight={(flight: any) => {
                        setSelectedFlight(flight);
                        setSidebarOpen(false);
                        setBookingOpen(true);
                    }}
                />
                <BookingPanel
                    isOpen={bookingOpen}
                    onClose={() => setBookingOpen(false)}
                    selectedFlight={selectedFlight}
                />
                <HowItWorksModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
                <GeaiAssistant onOpen={() => setBookingOpen(true)} />
                <Confetti trigger={confettiTrigger} x={confettiPos.x} y={confettiPos.y} />
                <QuebecQuiz
                    isOpen={quizOpen}
                    onClose={() => setQuizOpen(false)}
                    onGenerate={(region, quizData) => {
                        // Guide generation is now handled inside QuebecQuiz
                        // This callback is kept for compatibility but quiz handles it internally
                    }}
                />
            </div>
            {showQuebecPlanner && <QuebecPlanner onClose={() => setShowQuebecPlanner(false)} />}
            {showLoginPrompt && (
                <div style={{
                    position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 2000, padding: '12px 24px', borderRadius: 14,
                    background: 'linear-gradient(135deg, #0A0A14, #050510)',
                    color: 'white', fontFamily: "'Fredoka', sans-serif",
                    fontSize: 14, fontWeight: 600,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    {!user ? (
                        <>
                            <span>🔒</span>
                            <span>Connecte-toi pour planifier ton voyage</span>
                            <a href="/auth" style={{
                                padding: '4px 12px', borderRadius: 100,
                                background: '#00A5CC', color: 'white',
                                fontSize: 12, fontWeight: 700, textDecoration: 'none',
                            }}>Se connecter</a>
                        </>
                    ) : (
                        <>
                            <span>⚜️</span>
                            <span>Tu as utilisé tes 2 quiz gratuits ce mois-ci</span>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
