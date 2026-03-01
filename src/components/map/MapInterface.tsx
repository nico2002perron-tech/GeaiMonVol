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
import { FlightTracker, MiniGlobeNav, RevealSection, useParallax } from '@/components/ui/ScrollJourney';
import { CANADA_CODES, DEAL_LEVELS as LEVEL_COLORS, CITY_IMAGES, DEFAULT_CITY_IMAGE } from '@/lib/constants/deals';
import { AIRLINE_BAGGAGE } from '@/lib/constants/airlines';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

// Map deal city names → topojson country names for filter matching
const CITY_TO_COUNTRY: Record<string, string> = {
    'Toronto': 'Canada', 'Ottawa': 'Canada', 'Vancouver': 'Canada',
    'Calgary': 'Canada', 'Edmonton': 'Canada', 'Winnipeg': 'Canada',
    'Halifax': 'Canada', 'Québec': 'Canada',
    'Paris': 'France', 'Barcelone': 'Spain', 'Madrid': 'Spain',
    'Lisbonne': 'Portugal', 'Porto': 'Portugal',
    'Rome': 'Italy', 'Athènes': 'Greece',
    'Cancún': 'Mexico', 'Punta Cana': 'Dominican Republic',
    'Cuba (Varadero)': 'Cuba', 'La Havane': 'Cuba',
    'Fort Lauderdale': 'United States of America', 'Miami': 'United States of America',
    'New York': 'United States of America', 'Los Angeles': 'United States of America',
    'Londres': 'United Kingdom', 'Dublin': 'Ireland',
    'Amsterdam': 'Netherlands', 'Marrakech': 'Morocco',
    'Bangkok': 'Thailand', 'Tokyo': 'Japan',
    'Bogota': 'Colombia', 'Cartagena': 'Colombia',
    'Lima': 'Peru', 'São Paulo': 'Brazil', 'Buenos Aires': 'Argentina',
    'Bali': 'Indonesia', 'Ho Chi Minh': 'Vietnam',
    'Reykjavik': 'Iceland', 'Montego Bay': 'Jamaica',
    'San José': 'Costa Rica',
};

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
                            incredible: { from: '#4D1F1F', to: '#2A0A0A', border: 'rgba(220,38,38,0.45)', glow: 'rgba(220,38,38,0.25)' },
                            great: { from: '#4D3020', to: '#2A1508', border: 'rgba(234,88,12,0.4)', glow: 'rgba(234,88,12,0.2)' },
                            good: { from: '#143058', to: '#0A1830', border: 'rgba(46,125,219,0.35)', glow: 'rgba(46,125,219,0.15)' },
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
                    incredible: { from: '#3D1515', to: '#2A0A0A', border: 'rgba(220,38,38,0.45)' },
                    great: { from: '#3D2515', to: '#2A1508', border: 'rgba(234,88,12,0.4)' },
                    good: { from: '#0F2444', to: '#0A1830', border: 'rgba(46,125,219,0.35)' },
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
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
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
    const globeSectionRef = useRef<HTMLDivElement>(null);

    // Parallax depth on starfield
    useParallax();

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

    // ─── CAROUSEL DEALS (sorted by discount, filtered by selectedCountry) ───
    const carouselDeals = useMemo(() => {
        let deals = [...filteredPrices];

        // Apply country filter if one is selected
        if (selectedCountry) {
            deals = deals.filter((d: any) => {
                const code = d.destination_code || d.code || '';
                const city = d.destination || d.city || '';

                // For Canada tab, selectedCountry is 'Canada'.
                // If the user clicks Canada on the globe, we only show Canadian deals.
                // For other countries, we map the city to the country name using CITY_TO_COUNTRY.

                if (code && CANADA_CODES.includes(code)) {
                    return selectedCountry === 'Canada';
                } else if (city && CITY_TO_COUNTRY[city]) {
                    return CITY_TO_COUNTRY[city] === selectedCountry;
                }

                return false;
            });
        }

        return deals.sort((a: any, b: any) => (b.discount || 0) - (a.discount || 0));
    }, [filteredPrices, selectedCountry]);

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

    // Auto-zoom through top 5 deals — slow, leisurely pace
    const flyToDealRef = useRef(flyToDeal);
    flyToDealRef.current = flyToDeal;

    useEffect(() => {
        if (top5Deals.length === 0) return;

        const triggerPing = () => {
            // Skip if globe section is not visible
            if (globeSectionRef.current) {
                const rect = globeSectionRef.current.getBoundingClientRect();
                if (rect.bottom < 0 || rect.top > window.innerHeight) return;
            }
            const idx = pingIdxRef.current % top5Deals.length;
            pingIdxRef.current = idx + 1;
            const deal = top5Deals[idx];
            setPingDeal(deal);
            setFlyToDeal({ ...deal, _ts: Date.now(), _autoPing: true });

            // Auto-dismiss card after 12s
            if (pingTimerRef.current) clearTimeout(pingTimerRef.current);
            pingTimerRef.current = setTimeout(() => {
                setPingDeal(null);
            }, 12000);
        };

        // Initial delay — 15s before first ping
        const startDelay = setTimeout(triggerPing, 15000);

        // Recurring — slow rotation (~40s between pings)
        const interval = setInterval(triggerPing, 40000);

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
                @keyframes toastSlideUp{0%{opacity:0;transform:translateX(-50%) translateY(30px) scale(0.95)}60%{opacity:1;transform:translateX(-50%) translateY(-4px) scale(1.01)}100%{transform:translateX(-50%) translateY(0) scale(1)}}
                @keyframes toastGlow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.15)}}
                @keyframes scrollChevron{0%,100%{opacity:0.3;transform:translateY(0)}50%{opacity:0.8;transform:translateY(6px)}}
                @keyframes cardShimmer{0%{left:-30%}100%{left:130%}}
                @keyframes starTwinkle{0%,100%{opacity:0.15;transform:scale(0.8)}50%{opacity:1;transform:scale(1.3)}}
                @keyframes starDrift{0%{transform:translateY(0) translateX(0)}50%{transform:translateY(-18px) translateX(6px)}100%{transform:translateY(0) translateX(0)}}
                @keyframes nebulaPulse{0%,100%{opacity:0.12;transform:scale(1)}50%{opacity:0.4;transform:scale(1.08)}}
                @keyframes nebulaShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
                @keyframes floatParticle{0%{transform:translateY(0) translateX(0);opacity:0.3}25%{opacity:0.7}50%{transform:translateY(-30px) translateX(15px);opacity:0.5}75%{opacity:0.8}100%{transform:translateY(0) translateX(0);opacity:0.3}}
                @keyframes atmosphereGlow{0%,100%{opacity:0.3;filter:blur(60px)}50%{opacity:0.5;filter:blur(80px)}}
                @keyframes shootingStar{0%{transform:translateX(0) translateY(0);opacity:0;width:0}5%{opacity:1;width:80px}70%{opacity:0.6;width:120px}100%{transform:translateX(calc(-50vw - 200px)) translateY(calc(50vh + 200px));opacity:0;width:40px}}
                @keyframes sparkleRotate{0%{transform:rotate(0deg) scale(0.8);opacity:0.3}50%{transform:rotate(180deg) scale(1.2);opacity:1}100%{transform:rotate(360deg) scale(0.8);opacity:0.3}}
                @keyframes auroraWave{0%{opacity:0.08;transform:translateX(-5%) scaleY(1)}50%{opacity:0.18;transform:translateX(5%) scaleY(1.1)}100%{opacity:0.08;transform:translateX(-5%) scaleY(1)}}
                @keyframes vignetteBreath{0%,100%{opacity:0.85}50%{opacity:0.7}}
                .starfield-layer{position:fixed;top:0;left:0;width:100%;height:100vh;pointer-events:none;z-index:0;overflow:hidden;}
                .starfield-layer .star-css{position:absolute;border-radius:50%;background:white;animation:starTwinkle 3s ease-in-out infinite, starDrift 8s ease-in-out infinite;}
                .starfield-layer .nebula-orb{position:absolute;border-radius:50%;filter:blur(60px);animation:nebulaPulse 6s ease-in-out infinite;pointer-events:none;}
                .starfield-layer .shooting-star-el{position:absolute;height:2px;border-radius:2px;background:linear-gradient(90deg,rgba(255,255,255,0.9),rgba(125,249,255,0.6),transparent);pointer-events:none;}
                .starfield-layer .sparkle-star{position:absolute;pointer-events:none;}
                .starfield-layer .sparkle-star::before,.starfield-layer .sparkle-star::after{content:'';position:absolute;background:white;border-radius:1px;}
                .starfield-layer .sparkle-star::before{width:1px;height:100%;left:50%;top:0;transform:translateX(-50%);}
                .starfield-layer .sparkle-star::after{width:100%;height:1px;top:50%;left:0;transform:translateY(-50%);}
                .space-particles .particle{position:absolute;border-radius:50%;animation:floatParticle 6s ease-in-out infinite;}
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
                background: 'radial-gradient(ellipse at 50% 40%, #0c1a3a 0%, #070e22 35%, #040810 60%, #020305 100%)',
            }}>
                {/* ═══ RADIAL VIGNETTE — dark edges, brighter center ═══ */}
                <div style={{
                    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
                    background: 'radial-gradient(ellipse at 50% 45%, transparent 25%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.7) 85%, rgba(0,0,0,0.9) 100%)',
                    animation: 'vignetteBreath 12s ease-in-out infinite',
                }} />


                <div ref={globeSectionRef} style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <MapTopbar prices={prices} />

                    {/* ═══ MAP AREA ═══ */}
                    <div style={{
                        flex: '1 1 auto', minHeight: 0, position: 'relative',
                        background: '#050a1a', overflow: 'hidden',
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

                        {/* ── DEAL TOAST NOTIFICATION (bottom bar) ── */}
                        {pingDeal && (() => {
                            const pLevel = pingDeal.dealLevel || 'good';
                            const pCol = LEVEL_COLORS[pLevel] || LEVEL_COLORS.good;
                            const pAvg = pingDeal.avgPrice || 0;
                            const pSaved = pAvg > pingDeal.price ? pAvg - pingDeal.price : 0;
                            const pDiscount = pingDeal.discount || pingDeal.disc || 0;
                            const pCity = pingDeal.destination || pingDeal.city || '';
                            const pCode = pingDeal.destination_code || pingDeal.code || '';
                            return (
                                <div
                                    onClick={() => {
                                        setPingDeal(null);
                                        setFlyToDeal({ ...pingDeal, _ts: Date.now() });
                                    }}
                                    style={{
                                        position: 'absolute',
                                        bottom: isMobile ? 180 : 220,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        zIndex: 9990,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: isMobile ? 12 : 18,
                                        padding: isMobile ? '14px 18px' : '16px 28px',
                                        borderRadius: 20,
                                        background: `linear-gradient(135deg, rgba(8,12,28,0.92), rgba(20,25,50,0.92))`,
                                        backdropFilter: 'blur(28px)',
                                        WebkitBackdropFilter: 'blur(28px)',
                                        border: `2px solid ${pCol.bg}60`,
                                        cursor: 'pointer',
                                        fontFamily: "'Outfit', sans-serif",
                                        animation: 'toastSlideUp 0.7s cubic-bezier(0.34,1.56,0.64,1) both, toastGlow 3s ease-in-out infinite',
                                        boxShadow: `0 12px 48px rgba(0,0,0,0.6), 0 0 40px ${pCol.bg}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
                                        maxWidth: isMobile ? '94vw' : 580,
                                        whiteSpace: 'nowrap' as const,
                                    }}
                                >
                                    {/* Animated shimmer */}
                                    <div style={{
                                        position: 'absolute', top: 0, left: '-30%',
                                        width: '30%', height: '100%',
                                        background: `linear-gradient(90deg, transparent, ${pCol.bg}15, transparent)`,
                                        animation: 'pingScanLine 3s linear infinite',
                                        pointerEvents: 'none', borderRadius: 20,
                                    }} />

                                    {/* Deal level badge — bigger */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                        <span style={{
                                            fontSize: 20, lineHeight: 1,
                                        }}>{pCol.icon}</span>
                                        <span style={{
                                            fontSize: 7, fontWeight: 800, color: pCol.bg,
                                            textTransform: 'uppercase' as const, letterSpacing: 1,
                                        }}>{pCol.label}</span>
                                        <span style={{
                                            width: 7, height: 7, borderRadius: '50%',
                                            background: '#16A34A',
                                            animation: 'liveBlink 2s ease-in-out infinite',
                                            boxShadow: '0 0 8px rgba(22,163,74,0.6)',
                                        }} />
                                    </div>

                                    {/* Separator */}
                                    <div style={{ width: 1, height: 40, background: `${pCol.bg}40`, flexShrink: 0 }} />

                                    {/* Destination — bigger and bolder */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                                        <span style={{
                                            fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'white',
                                            fontFamily: "'Fredoka', sans-serif",
                                            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                        }}>
                                            ✈️ {pCity}
                                        </span>
                                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>YUL → {pCode}</span>
                                    </div>

                                    {/* Separator */}
                                    <div style={{ width: 1, height: 40, background: `${pCol.bg}40`, flexShrink: 0 }} />

                                    {/* Price — huge and glowing */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                                        <span style={{
                                            fontSize: isMobile ? 28 : 34, fontWeight: 900, color: '#FFF',
                                            fontFamily: "'Fredoka', sans-serif", lineHeight: 1,
                                            textShadow: `0 0 24px ${pCol.bg}60, 0 2px 4px rgba(0,0,0,0.4)`,
                                        }}>{pingDeal.price}$</span>
                                        {pAvg > pingDeal.price && (
                                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>
                                                {pAvg}$
                                            </span>
                                        )}
                                    </div>

                                    {/* Savings badge — prominent */}
                                    {pSaved > 0 && (
                                        <div style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                            background: 'rgba(57,255,20,0.12)',
                                            border: '1px solid rgba(57,255,20,0.3)',
                                            borderRadius: 12,
                                            padding: '6px 14px',
                                            flexShrink: 0,
                                        }}>
                                            <span style={{ fontSize: 14, fontWeight: 900, color: '#39FF14', fontFamily: "'Fredoka', sans-serif" }}>
                                                −{pSaved}$
                                            </span>
                                            {pDiscount > 0 && (
                                                <span style={{
                                                    fontSize: 10, fontWeight: 700, color: 'white',
                                                    background: pCol.bg, padding: '2px 6px', borderRadius: 6,
                                                }}>-{Math.round(pDiscount)}%</span>
                                            )}
                                        </div>
                                    )}

                                    {/* CTA arrow */}
                                    <span style={{
                                        fontSize: 18, color: pCol.bg, flexShrink: 0, marginLeft: 4,
                                        animation: 'scrollHint 2s ease-in-out infinite',
                                    }}>→</span>
                                </div>
                            );
                        })()}



                        {/* ── CARTOON GLOBE ── */}
                        <CartoonGlobe
                            deals={flyToDeal ? [flyToDeal] : (prices || [])}
                            mapView={mapView}
                            isMobile={isMobile}
                            onRegionSelect={(countryName: string) => {
                                // Cartoon globe clicked a country. Filter the carousel by that country.
                                setSelectedCountry(countryName);
                                // Scroll carousel to start
                                if (carouselRef.current) carouselRef.current.scrollLeft = 0;
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

                            {/* Active Country Filter Badge */}
                            {selectedCountry && (
                                <div style={{
                                    display: 'flex', justifyContent: 'center',
                                    marginBottom: isMobile ? 8 : 12,
                                    pointerEvents: 'auto',
                                }}>
                                    <button
                                        onClick={() => setSelectedCountry(null)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: isMobile ? '6px 14px' : '8px 18px',
                                            borderRadius: 100,
                                            background: 'rgba(57,255,20,0.15)',
                                            border: '1px solid rgba(57,255,20,0.3)',
                                            backdropFilter: 'blur(12px)',
                                            WebkitBackdropFilter: 'blur(12px)',
                                            cursor: 'pointer',
                                            color: '#39FF14',
                                            fontFamily: "'Fredoka', sans-serif",
                                            fontSize: isMobile ? 12 : 14,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                            transition: 'all 0.3s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(57,255,20,0.25)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(57,255,20,0.15)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <span>📍 Filtre actif : <strong>{selectedCountry}</strong></span>
                                        <span style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            width: 20, height: 20, borderRadius: '50%',
                                            background: 'rgba(57,255,20,0.2)',
                                            fontSize: 10, fontWeight: 700,
                                        }}>✕</span>
                                    </button>
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

                {/* ═══ ATMOSPHERIC DESCENT — compact with CTA ═══ */}
                <div style={{
                    height: 180,
                    background: 'linear-gradient(180deg, #050a1a 0%, #0a1535 30%, #101e45 60%, #142858 85%, #183268 100%)',
                    flexShrink: 0,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {/* Atmospheric glow */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'radial-gradient(ellipse at 50% 20%, rgba(0,212,255,0.04), transparent 60%)',
                        pointerEvents: 'none',
                    }} />

                    {/* Scroll CTA */}
                    <div style={{
                        textAlign: 'center', position: 'relative', zIndex: 2,
                    }}>
                        <div style={{
                            fontSize: isMobile ? 13 : 15, fontWeight: 600,
                            color: 'rgba(255,255,255,0.4)',
                            fontFamily: "'Outfit', sans-serif",
                            letterSpacing: 2,
                            textTransform: 'uppercase' as const,
                            marginBottom: 12,
                        }}>Comment ça marche</div>
                        <div style={{
                            fontSize: isMobile ? 10 : 11,
                            color: 'rgba(255,255,255,0.2)',
                            fontFamily: "'Outfit', sans-serif",
                            marginBottom: 16,
                        }}>Découvre comment on trouve les meilleurs deals ✈️</div>
                        {/* Animated chevrons */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <span style={{ fontSize: 14, color: 'rgba(0,212,255,0.4)', animation: 'scrollChevron 2s ease-in-out infinite' }}>▾</span>
                            <span style={{ fontSize: 14, color: 'rgba(0,212,255,0.25)', animation: 'scrollChevron 2s ease-in-out infinite 0.3s' }}>▾</span>
                        </div>
                    </div>
                </div>

                {/* ═══════════ SECTION 2+ : Below the fold ═══════════ */}
                <RevealSection id="how-it-works" direction="up">
                    <div id="deals" style={{ background: 'linear-gradient(180deg, #183268 0%, #142858 100%)' }}>
                        <HowItWorks />
                    </div>
                </RevealSection>

                <RevealSection id="premium" direction="up" delay={0.1}>
                    <PremiumSection />
                </RevealSection>

                <RevealSection direction="up" delay={0.1}>
                    <div id="recits-section">
                        <RecitsSection />
                    </div>
                </RevealSection>

                <RevealSection direction="up" delay={0.1}>
                    <TransparenceSection />
                </RevealSection>

                <RevealSection id="footer" direction="scale" delay={0.15}>
                    <Footer />
                </RevealSection>

                {/* Sidebar removed — filtering carousel directly via selectedCountry */}
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
            </div >
            {/* Flight Tracker + Mini Globe */}
            < FlightTracker />
            <MiniGlobeNav />
            {
                showQuebecPlanner && <QuebecPlanner onClose={() => setShowQuebecPlanner(false)} />
            }
            {
                showLoginPrompt && (
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
                )
            }
        </>
    );
}
