'use client';
// GeaiMonVol V2 - Sync
import { useState, useEffect, useMemo, useRef } from 'react';
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
import { CANADA_CODES, DEAL_LEVELS as LEVEL_COLORS, CITY_IMAGES } from '@/lib/constants/deals';
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
function InfiniteCarousel({ deals, isMobile, onDealClick }: {
    deals: any[];
    isMobile: boolean;
    onDealClick: (deal: any) => void;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
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

    useEffect(() => { setExpandedIdx(null); }, [deals]);

    const formatShort = (d: string) => {
        if (!d) return '';
        return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
    };

    if (deals.length === 0) return null;

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

                        let nights = 0;
                        if (depDate && retDate) {
                            nights = Math.round((new Date(retDate).getTime() - new Date(depDate).getTime()) / (1000 * 60 * 60 * 24));
                        }

                        const googleLink = deal.googleFlightsLink
                            || deal.raw_data?.google_flights_link
                            || `https://www.google.com/travel/flights?q=Flights+from+YUL+to+${code}&curr=CAD&hl=fr`;

                        // ─── EXPANDED CARD ───
                        if (isExpanded) {
                            return (
                                <div
                                    key={`inf-${code}-${i}`}
                                    style={{
                                        minWidth: isMobile ? 260 : 300,
                                        maxWidth: isMobile ? 260 : 300,
                                        background: 'rgba(10, 18, 32, 0.92)',
                                        backdropFilter: 'blur(16px)',
                                        WebkitBackdropFilter: 'blur(16px)',
                                        border: '1px solid rgba(0, 229, 255, 0.2)',
                                        borderRadius: 16,
                                        padding: '12px 14px',
                                        flexShrink: 0,
                                        boxShadow: '0 8px 32px rgba(0,229,255,0.12), 0 4px 16px rgba(0,0,0,0.4)',
                                        transition: 'all 0.35s cubic-bezier(.25,.46,.45,.94)',
                                        fontFamily: "'Outfit', sans-serif",
                                    }}
                                >
                                    {/* Header row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <div>
                                            <span style={{ fontSize: 15, fontWeight: 700, color: 'white', fontFamily: "'Fredoka', sans-serif" }}>
                                                {city}
                                            </span>
                                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>
                                                YUL → {code}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setExpandedIdx(null); }}
                                            style={{
                                                background: 'rgba(255,255,255,0.08)', border: 'none',
                                                color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                                                width: 22, height: 22, borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 11,
                                            }}
                                        >✕</button>
                                    </div>

                                    {/* Price row */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                        <span style={{
                                            fontSize: 22, fontWeight: 800, color: '#00E5FF',
                                            fontFamily: "'Fredoka', sans-serif",
                                            textShadow: '0 0 12px rgba(0,229,255,0.4)',
                                        }}>
                                            {deal.price}$
                                        </span>
                                        {avgPrice > deal.price && (
                                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>
                                                {avgPrice}$
                                            </span>
                                        )}
                                        {discount > 0 && (
                                            <span style={{
                                                fontSize: 9, fontWeight: 800, color: 'white',
                                                background: col.bg, padding: '2px 6px', borderRadius: 4,
                                            }}>
                                                -{Math.round(discount)}%
                                            </span>
                                        )}
                                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>aller-retour</span>
                                    </div>

                                    {/* Detail rows */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10, marginBottom: 10 }}>
                                        {airline && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Compagnie</span>
                                                <span style={{ color: 'white', fontWeight: 600 }}>{airline}</span>
                                            </div>
                                        )}
                                        {stops !== null && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Escales</span>
                                                <span style={{ color: stops === 0 ? '#4ADE80' : 'white', fontWeight: 600 }}>
                                                    {stops === 0 ? 'Direct' : `${stops} escale${stops > 1 ? 's' : ''}`}
                                                </span>
                                            </div>
                                        )}
                                        {depDate && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Dates</span>
                                                <span style={{ color: 'white', fontWeight: 600 }}>
                                                    {formatShort(depDate)}{retDate ? ` → ${formatShort(retDate)}` : ''}
                                                    {nights > 0 && <span style={{ color: '#00E5FF' }}> ({nights}n)</span>}
                                                </span>
                                            </div>
                                        )}
                                        {airline && AIRLINE_BAGGAGE[airline] && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Bagages</span>
                                                <span style={{
                                                    color: AIRLINE_BAGGAGE[airline].cabin ? '#4ADE80' : '#F87171',
                                                    fontWeight: 600,
                                                }}>
                                                    {AIRLINE_BAGGAGE[airline].label}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* CTA */}
                                    <a
                                        href={googleLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            display: 'block', textAlign: 'center',
                                            padding: '8px 0', borderRadius: 8,
                                            background: 'linear-gradient(135deg, #00E5FF, #0091EA)',
                                            color: '#0A1220', fontWeight: 800, fontSize: 11,
                                            fontFamily: "'Outfit', sans-serif",
                                            textDecoration: 'none',
                                            boxShadow: '0 3px 12px rgba(0,229,255,0.25)',
                                        }}
                                    >
                                        Réserver – {deal.price}$
                                    </a>
                                </div>
                            );
                        }

                        // ─── PILL (collapsed) ───
                        return (
                            <div
                                key={`inf-${code}-${i}`}
                                className="carousel-pill"
                                onClick={() => {
                                    setExpandedIdx(i);
                                    onDealClick(deal);
                                }}
                                style={{
                                    minWidth: isMobile ? 140 : 160,
                                    maxWidth: isMobile ? 140 : 160,
                                    height: isMobile ? 42 : 46,
                                    borderRadius: 100,
                                    background: 'rgba(10, 18, 32, 0.8)',
                                    backdropFilter: 'blur(14px)',
                                    WebkitBackdropFilter: 'blur(14px)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '0 14px',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    transition: 'all 0.3s cubic-bezier(.25,.46,.45,.94)',
                                    fontFamily: "'Outfit', sans-serif",
                                }}
                            >
                                {/* Colored dot */}
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: col.bg, flexShrink: 0,
                                    boxShadow: `0 0 6px ${col.bg}80`,
                                }} />

                                {/* City */}
                                <span style={{
                                    fontSize: isMobile ? 11 : 12, fontWeight: 700, color: 'white',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    flex: 1,
                                }}>
                                    {city}
                                </span>

                                {/* Price */}
                                <span style={{
                                    fontSize: isMobile ? 12 : 13, fontWeight: 800, color: '#00E5FF',
                                    whiteSpace: 'nowrap', flexShrink: 0,
                                    textShadow: '0 0 8px rgba(0,229,255,0.3)',
                                }}>
                                    {deal.price}$
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
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

    const { prices, loading: pricesLoading, lastUpdated } = useLivePrices();

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

    // Called from carousel cards — triggers holo animation only
    const handleCarouselDealClick = (deal: any) => {
        setFlyToDeal({ ...deal, _ts: Date.now() });
    };

    return (
        <>
            <style>{`
                @keyframes liveBlink{0%,100%{opacity:1}50%{opacity:.3}}
                @keyframes scrollHint{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
                .month-pill{transition:all 0.25s ease;}
                .month-pill:hover{background:rgba(255,255,255,0.08)!important;}
                .carousel-scroll::-webkit-scrollbar{display:none;}
                .carousel-scroll{scrollbar-width:none;}
                .top5-card{transition:all 0.25s cubic-bezier(.25,.46,.45,.94);}
                .top5-card:hover{background:rgba(255,255,255,0.08)!important;transform:translateX(2px);}
                .carousel-pill{transition:all 0.3s cubic-bezier(.25,.46,.45,.94);}
                .carousel-pill:hover{transform:translateY(-3px);border-color:rgba(0,229,255,0.25)!important;box-shadow:0 6px 20px rgba(0,229,255,0.12),0 2px 10px rgba(0,0,0,0.3)!important;}
            `}</style>

            <div id="app" className={appReady ? 'show' : ''} style={{
                minHeight: '100vh',
                background: '#F4F8FB',
            }}>
                {/* ═══════════ SECTION 1 : CARTE INTERACTIVE FULL ═══════════ */}
                <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <MapTopbar prices={prices} />

                    {/* ONGLETS Monde / Canada / Tout-inclus */}
                    <div style={{
                        background: 'linear-gradient(180deg, #0F1A2A 0%, #1B2D4F 100%)',
                        padding: '0 28px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', gap: 6, padding: '14px 0' }}>
                            {tabs.map(tab => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleTabChange(tab.key)}
                                        style={{
                                            padding: '10px 28px',
                                            borderRadius: 12,
                                            border: isActive
                                                ? '1px solid rgba(96,165,250,0.3)'
                                                : '1px solid rgba(255,255,255,0.06)',
                                            background: isActive
                                                ? 'linear-gradient(135deg, rgba(46,125,219,0.15), rgba(96,165,250,0.08))'
                                                : 'rgba(255,255,255,0.02)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            transition: 'all 0.3s cubic-bezier(.25,.46,.45,.94)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            fontFamily: "'Outfit', sans-serif",
                                        }}
                                    >
                                        {isActive && (
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                background: 'radial-gradient(ellipse at center, rgba(96,165,250,0.08) 0%, transparent 70%)',
                                                pointerEvents: 'none',
                                            }} />
                                        )}
                                        <span style={{
                                            fontSize: 18,
                                            filter: isActive ? 'none' : 'grayscale(0.6)',
                                            transition: 'filter 0.3s',
                                        }}>{tab.icon}</span>
                                        <div style={{ textAlign: 'left', position: 'relative', zIndex: 1 }}>
                                            <div style={{
                                                fontSize: 13,
                                                fontWeight: isActive ? 700 : 500,
                                                color: isActive ? 'white' : 'rgba(255,255,255,0.4)',
                                                transition: 'color 0.3s',
                                                lineHeight: 1.2,
                                            }}>{tab.label}</div>
                                            <div style={{
                                                fontSize: 9,
                                                color: isActive ? 'rgba(96,165,250,0.8)' : 'rgba(255,255,255,0.2)',
                                                fontWeight: 500,
                                                transition: 'color 0.3s',
                                            }}>{tab.desc}</div>
                                        </div>
                                        {isActive && (
                                            <div style={{
                                                width: 5, height: 5, borderRadius: '50%',
                                                background: '#60A5FA',
                                                boxShadow: '0 0 8px #60A5FA',
                                                marginLeft: 2,
                                            }} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={handleQuebecClick}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: isMobile ? '8px 14px' : '10px 20px',
                                borderRadius: 14, border: 'none', cursor: 'pointer',
                                fontFamily: "'Fredoka', sans-serif",
                                background: 'linear-gradient(135deg, #2E7DDB, #1A3A6B)',
                                color: 'white',
                                fontSize: isMobile ? 11 : 13,
                                fontWeight: 700,
                                boxShadow: '0 4px 16px rgba(46,125,219,0.25), 0 0 20px rgba(46,125,219,0.1)',
                                transition: 'all 0.3s ease',
                                whiteSpace: 'nowrap' as const,
                                marginLeft: 'auto',
                            }}
                        >
                            <span style={{ fontSize: isMobile ? 14 : 16 }}>⚜️</span>
                            <span>{isMobile ? 'Québec' : 'Planifie ton Québec'}</span>
                            <span style={{
                                fontSize: 9, fontWeight: 600,
                                padding: '2px 6px', borderRadius: 100,
                                background: 'rgba(255,255,255,0.15)',
                            }}>GRATUIT</span>
                        </button>
                    </div>

                    {/* ═══ MAP AREA ═══ */}
                    <div style={{
                        flex: '1 1 auto', minHeight: 0, position: 'relative',
                        background: '#1B2D4F', overflow: 'hidden',
                    }}>
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
                                background: 'rgba(15,26,42,0.75)',
                                backdropFilter: 'blur(12px)',
                                borderRadius: 10,
                                padding: isMobile ? '6px 10px' : '8px 14px',
                                border: '1px solid rgba(255,255,255,0.08)',
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
                                    { color: '#2E7DDB', label: 'Bon prix', icon: '👍' },
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
                                background: 'rgba(15,26,42,0.75)',
                                backdropFilter: 'blur(12px)',
                                borderRadius: 10,
                                padding: isMobile ? '6px 8px' : '8px 10px',
                                border: '1px solid rgba(255,255,255,0.08)',
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
                            deals={filteredPrices}
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
                            onHoloComplete={() => setFlyToDeal(null)}
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
                                            ? 'linear-gradient(135deg, #2E7DDB, #1B5BA0)'
                                            : 'rgba(15,26,42,0.7)',
                                        backdropFilter: 'blur(12px)',
                                        color: selectedMonth === 'all' ? 'white' : 'rgba(255,255,255,0.5)',
                                        boxShadow: selectedMonth === 'all'
                                            ? '0 3px 10px rgba(46,125,219,0.35)'
                                            : '0 2px 6px rgba(0,0,0,0.2)',
                                        border: selectedMonth === 'all'
                                            ? '1px solid rgba(96,165,250,0.3)'
                                            : '1px solid rgba(255,255,255,0.08)',
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
                                                    ? 'linear-gradient(135deg, #2E7DDB, #1B5BA0)'
                                                    : 'rgba(15,26,42,0.7)',
                                                backdropFilter: 'blur(12px)',
                                                color: selectedMonth === m.value ? 'white' : 'rgba(255,255,255,0.5)',
                                                boxShadow: selectedMonth === m.value
                                                    ? '0 3px 10px rgba(46,125,219,0.35)'
                                                    : '0 2px 6px rgba(0,0,0,0.2)',
                                                border: selectedMonth === m.value
                                                    ? '1px solid rgba(96,165,250,0.3)'
                                                    : '1px solid rgba(255,255,255,0.08)',
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

                            {/* Carousel */}
                            <InfiniteCarousel
                                deals={carouselDeals}
                                isMobile={isMobile}
                                onDealClick={handleCarouselDealClick}
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

                {/* ═══════════ SECTION 2+ : Below the fold ═══════════ */}
                <div id="deals">
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
                    background: 'linear-gradient(135deg, #1A2B42, #0F1D2F)',
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
                                background: '#2E7DDB', color: 'white',
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
