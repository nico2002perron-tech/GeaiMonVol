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
// INFINITE CAROUSEL — COMPACT BOARDING PASS STYLE
// ═══════════════════════════════════════════════════════

const LEVEL_ACCENTS: Record<string, { accent: string; glow: string; bg: string; cardFrom: string; cardTo: string; border: string }> = {
    lowest_ever: { accent: '#C084FC', glow: 'rgba(192,132,252,0.35)', bg: 'rgba(192,132,252,0.12)', cardFrom: 'rgba(88,28,135,0.7)', cardTo: 'rgba(30,10,60,0.8)', border: 'rgba(192,132,252,0.3)' },
    incredible: { accent: '#FF6B8A', glow: 'rgba(255,107,138,0.35)', bg: 'rgba(255,107,138,0.12)', cardFrom: 'rgba(136,19,55,0.7)', cardTo: 'rgba(50,10,25,0.8)', border: 'rgba(255,107,138,0.3)' },
    great: { accent: '#34D399', glow: 'rgba(52,211,153,0.3)', bg: 'rgba(52,211,153,0.1)', cardFrom: 'rgba(6,78,59,0.7)', cardTo: 'rgba(5,30,25,0.8)', border: 'rgba(52,211,153,0.25)' },
    good: { accent: '#38BDF8', glow: 'rgba(56,189,248,0.25)', bg: 'rgba(56,189,248,0.1)', cardFrom: 'rgba(7,59,76,0.7)', cardTo: 'rgba(5,25,40,0.8)', border: 'rgba(56,189,248,0.2)' },
};

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
                    let pos = container.scrollLeft + 0.4;
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
                    padding: isMobile ? '12px' : '14px',
                    color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 12 : 13,
                    fontFamily: "'Outfit', sans-serif", gap: 8,
                }}>
                    <span style={{ fontSize: 16 }}>📡</span>
                    Aucun deal trouvé — essayez «Tous»
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
                        const accent = LEVEL_ACCENTS[level] || LEVEL_ACCENTS.good;
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
                        let nights = 0;
                        if (depDate && retDate) {
                            nights = Math.round((new Date(retDate).getTime() - new Date(depDate).getTime()) / (1000 * 60 * 60 * 24));
                        }

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
                                    minWidth: isMobile ? 220 : 260,
                                    maxWidth: isMobile ? 220 : 260,
                                    borderRadius: 16,
                                    background: `linear-gradient(145deg, ${accent.cardFrom}, ${accent.cardTo})`,
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    border: isExpanded
                                        ? `1.5px solid ${accent.accent}90`
                                        : `1px solid ${accent.border}`,
                                    display: 'flex',
                                    alignItems: 'stretch',
                                    padding: 0,
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    transition: 'all 0.3s cubic-bezier(.25,.46,.45,.94)',
                                    fontFamily: "'Outfit', sans-serif",
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: isExpanded
                                        ? `0 0 20px ${accent.glow}, 0 4px 16px rgba(0,0,0,0.4)`
                                        : isHot
                                            ? `0 4px 16px ${accent.glow}, 0 2px 8px rgba(0,0,0,0.3)`
                                            : '0 2px 12px rgba(0,0,0,0.3)',
                                }}
                            >
                                {/* City image — left side */}
                                <div style={{
                                    width: isMobile ? 72 : 82,
                                    flexShrink: 0,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: '16px 0 0 16px',
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
                                    {/* Gradient fade into content */}
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: 'linear-gradient(90deg, transparent 40%, rgba(0,0,0,0.5) 100%)',
                                    }} />
                                    {/* Deal badge overlay */}
                                    <span style={{
                                        position: 'absolute', bottom: 4, left: 4,
                                        fontSize: 7, fontWeight: 800, color: 'white',
                                        background: col.bg, padding: '2px 6px', borderRadius: 4,
                                        letterSpacing: 0.3, whiteSpace: 'nowrap',
                                        boxShadow: `0 2px 6px ${col.bg}60`,
                                    }}>{col.icon} {col.label}</span>
                                </div>

                                {/* Content — right side */}
                                <div style={{
                                    flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
                                    padding: isMobile ? '7px 10px' : '8px 12px',
                                    justifyContent: 'space-between',
                                    gap: 3,
                                }}>
                                    {/* Row 1: city + price */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                                        <span style={{
                                            fontSize: isMobile ? 13 : 14, fontWeight: 700, color: 'white',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                            fontFamily: "'Fredoka', sans-serif", lineHeight: 1.2,
                                        }}>{city}</span>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                                            <span style={{
                                                fontSize: isMobile ? 16 : 18, fontWeight: 800,
                                                color: '#FFFFFF', fontFamily: "'Fredoka', sans-serif",
                                                lineHeight: 1,
                                            }}>{deal.price}$</span>
                                            {avgPrice > deal.price && (
                                                <span style={{
                                                    fontSize: 9, color: 'rgba(255,255,255,0.3)',
                                                    textDecoration: 'line-through',
                                                }}>{avgPrice}$</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Row 2: route + stops + airline */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        fontSize: 9, color: 'rgba(255,255,255,0.4)',
                                    }}>
                                        <span style={{ fontWeight: 600 }}>YUL → {code}</span>
                                        {stops === 0 && <span style={{ color: '#4ADE80', fontWeight: 700 }}>Direct</span>}
                                        {stops != null && stops > 0 && <span>{stops} esc.</span>}
                                        {airline && <span style={{ opacity: 0.7 }}>· {airline}</span>}
                                    </div>

                                    {/* Row 3: dates + nights */}
                                    {depDate && (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 5,
                                            fontSize: 9, color: 'rgba(255,255,255,0.45)',
                                        }}>
                                            <span>{formatShort(depDate)}{retDate ? ` → ${formatShort(retDate)}` : ''}</span>
                                            {nights > 0 && (
                                                <span style={{
                                                    fontSize: 8, fontWeight: 700,
                                                    background: 'rgba(255,255,255,0.08)',
                                                    padding: '1px 5px', borderRadius: 4,
                                                }}>{nights}n</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Row 4: savings */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        {saved > 0 && discount > 0 ? (
                                            <span style={{
                                                fontSize: 9, fontWeight: 800,
                                                color: accent.accent,
                                                background: accent.bg,
                                                padding: '1px 7px', borderRadius: 6,
                                                lineHeight: '15px',
                                            }}>-{Math.round(discount)}% · {saved}$ économisé</span>
                                        ) : (
                                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>aller-retour</span>
                                        )}
                                        {isHot && (
                                            <span style={{
                                                width: 5, height: 5, borderRadius: '50%',
                                                background: '#EF4444', display: 'inline-block',
                                                animation: 'liveBlink 1.5s infinite',
                                                boxShadow: '0 0 6px rgba(239,68,68,0.5)',
                                            }} />
                                        )}
                                    </div>
                                </div>

                                {/* Shimmer sweep on hot deals */}
                                {isHot && (
                                    <div style={{
                                        position: 'absolute', top: 0, left: '-30%',
                                        width: '30%', height: '100%',
                                        background: `linear-gradient(90deg, transparent, ${accent.accent}12, transparent)`,
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
                const accent = LEVEL_ACCENTS[level] || LEVEL_ACCENTS.good;
                const discount = deal.discount || deal.disc || 0;
                const city = deal.destination || deal.city || '';
                const code = deal.destination_code || deal.code || '';
                const airline = deal.airline || '';
                const depDate = deal.departure_date || '';
                const retDate = deal.return_date || '';
                const avgPrice = deal.avgPrice || 0;
                const stops = deal.stops ?? null;
                const saved = avgPrice > deal.price ? avgPrice - deal.price : 0;

                let nights = 0;
                if (depDate && retDate) {
                    nights = Math.round((new Date(retDate).getTime() - new Date(depDate).getTime()) / (1000 * 60 * 60 * 24));
                }

                const googleLink = deal.googleFlightsLink
                    || deal.raw_data?.google_flights_link
                    || `https://www.google.com/travel/flights?q=Flights+from+YUL+to+${code}&curr=CAD&hl=fr`;

                const baggage = AIRLINE_BAGGAGE[airline] || null;
                const popoverWidth = isMobile ? 240 : 280;

                return (
                    <>
                        <div
                            onClick={() => { setExpandedIdx(null); setExpandedRect(null); }}
                            style={{ position: 'fixed', inset: 0, zIndex: 9997 }}
                        />
                        <div style={{
                            position: 'fixed',
                            bottom: `calc(100vh - ${expandedRect.top}px + 8px)`,
                            left: expandedRect.left + expandedRect.width / 2,
                            transform: 'translateX(-50%)',
                            zIndex: 9999,
                            width: popoverWidth,
                            background: `linear-gradient(160deg, ${accent.cardFrom}, ${accent.cardTo})`,
                            backdropFilter: 'blur(28px)',
                            WebkitBackdropFilter: 'blur(28px)',
                            border: `1px solid ${accent.border}`,
                            borderRadius: 16,
                            padding: isMobile ? '14px' : '16px',
                            fontFamily: "'Outfit', sans-serif",
                            boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 30px ${accent.glow}`,
                            animation: 'popoverSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
                        }}>
                            {/* Top accent line */}
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                                borderRadius: '16px 16px 0 0',
                                background: `linear-gradient(90deg, transparent, ${accent.accent}, transparent)`,
                            }} />

                            {/* Arrow */}
                            <div style={{
                                position: 'absolute', bottom: -7,
                                left: '50%', transform: 'translateX(-50%)',
                                width: 0, height: 0,
                                borderLeft: '7px solid transparent',
                                borderRight: '7px solid transparent',
                                borderTop: `7px solid ${accent.cardTo}`,
                                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))',
                            }} />

                            {/* Header: city + badge */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                marginBottom: 10,
                            }}>
                                <span style={{
                                    fontSize: 16, fontWeight: 700, color: 'white',
                                    fontFamily: "'Fredoka', sans-serif",
                                }}>{city}</span>
                                <span style={{
                                    fontSize: 8, fontWeight: 800, color: 'white',
                                    background: col.bg, padding: '2px 8px', borderRadius: 6,
                                }}>{col.icon} {col.label}</span>
                            </div>

                            {/* Route + stops */}
                            <div style={{
                                fontSize: 11, color: 'rgba(255,255,255,0.5)',
                                marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <span>YUL → {code}</span>
                                {stops === 0 && <span style={{ color: '#4ADE80', fontWeight: 700, fontSize: 10 }}>Direct</span>}
                                {stops != null && stops > 0 && <span style={{ fontSize: 10 }}>{stops} escale{stops > 1 ? 's' : ''}</span>}
                            </div>

                            {/* Dates + duration */}
                            {depDate && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                                    padding: '6px 0', marginBottom: 6,
                                    borderTop: '1px solid rgba(255,255,255,0.06)',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    fontSize: 11, color: 'rgba(255,255,255,0.6)',
                                }}>
                                    <span>{formatShort(depDate)}</span>
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
                                    fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 8,
                                }}>
                                    <span>{airline}</span>
                                    {baggage && (
                                        <span style={{
                                            fontSize: 9, fontWeight: 600,
                                            background: 'rgba(255,255,255,0.08)',
                                            padding: '2px 6px', borderRadius: 4,
                                        }}>
                                            {baggage.cabin ? 'Cabine incluse' : 'Cabine en extra'}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Price row */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                marginBottom: 10, padding: '8px 10px', borderRadius: 10,
                                background: accent.bg,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                    <span style={{
                                        fontSize: 22, fontWeight: 800, color: 'white',
                                        fontFamily: "'Fredoka', sans-serif",
                                    }}>{deal.price}$</span>
                                    {avgPrice > deal.price && (
                                        <span style={{
                                            fontSize: 12, color: 'rgba(255,255,255,0.3)',
                                            textDecoration: 'line-through',
                                        }}>{avgPrice}$</span>
                                    )}
                                </div>
                                {saved > 0 && (
                                    <span style={{
                                        fontSize: 12, fontWeight: 800, color: accent.accent,
                                    }}>
                                        -{Math.round(discount)}% ({saved}$)
                                    </span>
                                )}
                            </div>

                            {/* CTA */}
                            <a
                                href={googleLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    width: '100%', padding: '9px 12px', borderRadius: 10,
                                    background: `linear-gradient(135deg, ${accent.accent}, ${accent.accent}CC)`,
                                    color: 'white', fontSize: 12, fontWeight: 700,
                                    textDecoration: 'none', border: 'none', cursor: 'pointer',
                                    boxShadow: `0 3px 12px ${accent.glow}`,
                                    fontFamily: "'Outfit', sans-serif",
                                    position: 'relative', overflow: 'hidden',
                                }}
                            >
                                <div style={{
                                    position: 'absolute', top: 0, left: '-100%',
                                    width: '60%', height: '100%',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                    animation: 'premShimmer 3s ease-in-out infinite',
                                    pointerEvents: 'none',
                                }} />
                                <span style={{ position: 'relative' }}>Voir sur Google Flights →</span>
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
    const [pingExiting, setPingExiting] = useState(false);
    const pingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pingExitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pingIdxRef = useRef(0);
    const userInteractedRef = useRef(false);

    // Dismiss popup with exit animation
    const dismissPing = () => {
        if (pingExiting || !pingDeal) return;
        setPingExiting(true);
        if (pingExitRef.current) clearTimeout(pingExitRef.current);
        pingExitRef.current = setTimeout(() => {
            setPingDeal(null);
            setPingExiting(false);
        }, 600);
    };

    // Reset user interaction flag when holo completes — also dismiss popup
    const handleHoloComplete = () => {
        setFlyToDeal(null);
        dismissPing();
        if (pingTimerRef.current) { clearTimeout(pingTimerRef.current); pingTimerRef.current = null; }
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
                @keyframes heroFadeIn{from{opacity:0;transform:translateX(-50%) translateY(15px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
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
                @keyframes premShimmer{0%,80%,100%{left:-100%}40%{left:120%}}
                @keyframes starTwinkle{0%,100%{opacity:0.15;transform:scale(0.8)}50%{opacity:1;transform:scale(1.3)}}
                @keyframes starDrift{0%{transform:translateY(0) translateX(0)}50%{transform:translateY(-18px) translateX(6px)}100%{transform:translateY(0) translateX(0)}}
                @keyframes nebulaPulse{0%,100%{opacity:0.12;transform:scale(1)}50%{opacity:0.4;transform:scale(1.08)}}
                @keyframes nebulaShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
                @keyframes floatParticle{0%{transform:translateY(0) translateX(0);opacity:0.3}25%{opacity:0.7}50%{transform:translateY(-30px) translateX(15px);opacity:0.5}75%{opacity:0.8}100%{transform:translateY(0) translateX(0);opacity:0.3}}
                @keyframes atmosphereGlow{0%,100%{opacity:0.3;filter:blur(60px)}50%{opacity:0.5;filter:blur(80px)}}
                @keyframes shootingStar{0%{transform:translateX(0) translateY(0);opacity:0;width:0}5%{opacity:1;width:80px}70%{opacity:0.6;width:120px}100%{transform:translateX(calc(-50vw - 200px)) translateY(calc(50vh + 200px));opacity:0;width:40px}}
                @keyframes sparkleRotate{0%{transform:rotate(0deg) scale(0.8);opacity:0.3}50%{transform:rotate(180deg) scale(1.2);opacity:1}100%{transform:rotate(360deg) scale(0.8);opacity:0.3}}
                @keyframes auroraWave{0%{opacity:0.08;transform:translateX(-5%) scaleY(1)}50%{opacity:0.18;transform:translateX(5%) scaleY(1.1)}100%{opacity:0.08;transform:translateX(-5%) scaleY(1)}}
                @keyframes vignetteBreath{0%,100%{opacity:0.9}50%{opacity:0.75}}
                @keyframes nebulaDrift{0%{transform:translate(0,0) scale(1)}33%{transform:translate(15px,-10px) scale(1.05)}66%{transform:translate(-10px,8px) scale(0.97)}100%{transform:translate(0,0) scale(1)}}
                @keyframes dustBandPulse{0%,100%{opacity:0.6}50%{opacity:1}}
                @keyframes sunBreathe{0%,100%{transform:scale(0.9);box-shadow:0 0 4px 2px rgba(255,255,255,0.9),0 0 15px 5px rgba(255,220,150,0.5),0 0 40px 15px rgba(217,149,51,0.3),0 0 80px 30px rgba(217,149,51,0.12)}50%{transform:scale(1.1);box-shadow:0 0 6px 3px rgba(255,255,255,1),0 0 20px 8px rgba(255,220,150,0.6),0 0 50px 20px rgba(217,149,51,0.35),0 0 100px 40px rgba(217,149,51,0.18)}}
                @keyframes dealPanelSlideIn{0%{opacity:0;transform:translateX(60px) translateY(20px) scale(0.9);filter:blur(8px)}40%{opacity:1;filter:blur(0)}70%{transform:translateX(-6px) translateY(-3px) scale(1.02)}85%{transform:translateX(2px) translateY(1px) scale(0.995)}100%{transform:translateX(0) translateY(0) scale(1)}}
                @keyframes dealPanelAccentBreathe{0%,100%{opacity:0.4;transform:scaleX(0.7)}50%{opacity:1;transform:scaleX(1)}}
                @keyframes dealPanelImgKen{0%{transform:scale(1) translateX(0)}100%{transform:scale(1.1) translateX(-4%)}}
                @keyframes dealPanelFadeUp{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}
                @keyframes dealPanelGlow{0%,100%{box-shadow:0 20px 60px rgba(0,0,0,0.5),0 0 30px var(--panel-glow)}50%{box-shadow:0 20px 60px rgba(0,0,0,0.5),0 0 50px var(--panel-glow),0 0 80px var(--panel-glow-wide)}}
                @keyframes dealPanelSlideOut{0%{opacity:1;transform:translateX(0) scale(1);filter:blur(0)}100%{opacity:0;transform:translateX(60px) scale(0.92);filter:blur(6px)}}
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
                .carousel-pill:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 8px 24px rgba(0,0,0,0.4),0 0 16px rgba(56,189,248,0.12)!important;border-color:rgba(255,255,255,0.15)!important;z-index:2;}
            `}</style>

            <div id="app" className={appReady ? 'show' : ''} style={{
                minHeight: '100vh',
                background: 'radial-gradient(ellipse at 50% 40%, #0a1628 0%, #060d1a 35%, #030810 60%, #010204 100%)',
            }}>
                {/* ═══ INTERSTELLAR SPACE — deep vignette ═══ */}
                <div style={{
                    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
                    background: 'radial-gradient(ellipse at 50% 45%, transparent 15%, rgba(2,4,12,0.3) 40%, rgba(1,2,6,0.6) 70%, rgba(0,0,0,0.85) 100%)',
                    animation: 'vignetteBreath 15s ease-in-out infinite',
                }} />

                {/* ═══ INTERSTELLAR NEBULAE — warm Gargantua tones ═══ */}
                <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                    {/* Amber accretion glow — top right */}
                    <div style={{
                        position: 'absolute', top: '8%', right: '12%',
                        width: 500, height: 500, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(0,212,255,0.06), rgba(0,180,200,0.03), transparent 70%)',
                        filter: 'blur(80px)',
                        animation: 'nebulaDrift 30s ease-in-out infinite',
                    }} />
                    {/* Deep violet nebula — left */}
                    <div style={{
                        position: 'absolute', top: '30%', left: '5%',
                        width: 600, height: 600, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(32,199,184,0.05), rgba(0,150,136,0.03), transparent 70%)',
                        filter: 'blur(100px)',
                        animation: 'nebulaDrift 40s ease-in-out infinite reverse',
                    }} />
                    {/* Teal wisp — bottom center */}
                    <div style={{
                        position: 'absolute', bottom: '15%', left: '40%',
                        width: 450, height: 450, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(0,180,220,0.05), rgba(0,140,180,0.03), transparent 70%)',
                        filter: 'blur(90px)',
                        animation: 'nebulaDrift 35s ease-in-out 5s infinite',
                    }} />
                    {/* Warm dust band — like accretion disk */}
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%) rotate(-15deg)',
                        width: '140%', height: 120,
                        background: 'linear-gradient(90deg, transparent 0%, rgba(0,180,220,0.02) 20%, rgba(0,212,255,0.035) 50%, rgba(0,180,220,0.02) 80%, transparent 100%)',
                        filter: 'blur(40px)',
                        animation: 'dustBandPulse 20s ease-in-out infinite',
                    }} />
                    {/* Interstellar distant sun / star */}
                    {/* Core sun */}
                    <div style={{
                        position: 'absolute', top: '15%', right: '22%',
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,240,200,0.9) 40%, rgba(217,149,51,0.4) 100%)',
                        boxShadow: '0 0 4px 2px rgba(255,255,255,0.9), 0 0 15px 5px rgba(255,220,150,0.5), 0 0 40px 15px rgba(217,149,51,0.3), 0 0 80px 30px rgba(217,149,51,0.15)',
                        animation: 'sunBreathe 8s ease-in-out infinite',
                        pointerEvents: 'none',
                        zIndex: 2,
                    }} />
                    {/* Horizontal lens flare */}
                    <div style={{
                        position: 'absolute', top: 'calc(15% + 3.5px)', right: 'calc(22% - 146px)',
                        width: 300, height: 1,
                        background: 'linear-gradient(90deg, transparent, rgba(255,220,150,0.0) 20%, rgba(255,220,150,0.3) 45%, rgba(255,255,255,0.6) 50%, rgba(255,220,150,0.3) 55%, rgba(255,220,150,0.0) 80%, transparent)',
                        opacity: 0.7,
                        pointerEvents: 'none',
                    }} />
                    {/* Vertical lens flare */}
                    <div style={{
                        position: 'absolute', top: 'calc(15% - 46px)', right: 'calc(22% + 3.5px)',
                        width: 1, height: 100,
                        background: 'linear-gradient(180deg, transparent, rgba(255,220,150,0.0) 20%, rgba(255,220,150,0.3) 45%, rgba(255,255,255,0.6) 50%, rgba(255,220,150,0.3) 55%, rgba(255,220,150,0.0) 80%, transparent)',
                        opacity: 0.3,
                        pointerEvents: 'none',
                    }} />
                    {/* Lens flare spot 1 — amber */}
                    <div style={{
                        position: 'absolute', top: 'calc(15% + 40px)', right: 'calc(22% + 35px)',
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(217,149,51,0.3), transparent 70%)',
                        opacity: 0.15,
                        pointerEvents: 'none',
                    }} />
                    {/* Lens flare spot 2 — teal-amber */}
                    <div style={{
                        position: 'absolute', top: 'calc(15% + 90px)', right: 'calc(22% + 75px)',
                        width: 10, height: 10, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(180,200,180,0.25), rgba(0,180,220,0.1) 50%, transparent 70%)',
                        opacity: 0.1,
                        pointerEvents: 'none',
                    }} />
                    {/* Lens flare spot 3 — very faint teal */}
                    <div style={{
                        position: 'absolute', top: 'calc(15% + 150px)', right: 'calc(22% + 120px)',
                        width: 14, height: 14, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(0,180,220,0.15), rgba(0,120,160,0.05) 50%, transparent 70%)',
                        opacity: 0.06,
                        pointerEvents: 'none',
                    }} />
                </div>

                {/* ═══ STARFIELD — dense, multi-layer, Interstellar-style ═══ */}
                <div className="starfield-layer" style={{ height: '200vh' }}>
                    {/* Dense tiny stars — background layer */}
                    {Array.from({ length: 120 }, (_, i) => {
                        const size = 0.5 + Math.random() * 1.2;
                        const warmth = Math.random();
                        const color = warmth > 0.85
                            ? `rgba(255,${200 + Math.floor(Math.random() * 55)},${150 + Math.floor(Math.random() * 60)},${0.3 + Math.random() * 0.5})`
                            : warmth > 0.7
                                ? `rgba(${180 + Math.floor(Math.random() * 75)},${200 + Math.floor(Math.random() * 55)},255,${0.3 + Math.random() * 0.5})`
                                : `rgba(255,255,255,${0.15 + Math.random() * 0.5})`;
                        return (
                            <div key={`s${i}`} className="star-css" style={{
                                width: size, height: size,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                background: color,
                                animationDuration: `${4 + Math.random() * 6}s, ${12 + Math.random() * 8}s`,
                                animationDelay: `${Math.random() * 5}s, ${Math.random() * 5}s`,
                            }} />
                        );
                    })}
                    {/* Brighter accent stars — fewer, larger */}
                    {Array.from({ length: 20 }, (_, i) => {
                        const size = 1.5 + Math.random() * 1.5;
                        return (
                            <div key={`bs${i}`} className="star-css" style={{
                                width: size, height: size,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                background: `rgba(255,255,255,${0.5 + Math.random() * 0.5})`,
                                boxShadow: `0 0 ${2 + Math.random() * 4}px rgba(255,255,255,0.3)`,
                                animationDuration: `${5 + Math.random() * 8}s, ${15 + Math.random() * 10}s`,
                                animationDelay: `${Math.random() * 8}s, ${Math.random() * 5}s`,
                            }} />
                        );
                    })}
                    {/* Sparkle crosses — bright diamond stars */}
                    {Array.from({ length: 6 }, (_, i) => (
                        <div key={`sp${i}`} className="sparkle-star" style={{
                            left: `${10 + Math.random() * 80}%`,
                            top: `${5 + Math.random() * 70}%`,
                            width: 8 + Math.random() * 6,
                            height: 8 + Math.random() * 6,
                            animation: `sparkleRotate ${8 + Math.random() * 6}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 6}s`,
                            opacity: 0.4 + Math.random() * 0.4,
                        }} />
                    ))}
                    {/* Shooting stars — slow, cinematic */}
                    {Array.from({ length: 3 }, (_, i) => (
                        <div key={`sh${i}`} className="shooting-star-el" style={{
                            top: `${5 + Math.random() * 40}%`,
                            right: `${-5 + Math.random() * 20}%`,
                            transform: `rotate(${35 + Math.random() * 15}deg)`,
                            animation: `shootingStar ${6 + Math.random() * 4}s linear ${8 + i * 15 + Math.random() * 10}s infinite`,
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.8), rgba(0,212,255,0.5), transparent)',
                        }} />
                    ))}
                </div>


                <div ref={globeSectionRef} style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <MapTopbar prices={prices} />

                    {/* ═══ MAP AREA ═══ */}
                    <div style={{
                        flex: '1 1 auto', minHeight: 0, position: 'relative',
                        background: '#020408', overflow: 'hidden',
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

                        {/* ── DEAL PANEL — right side, above carousel ── */}
                        {pingDeal && (() => {
                            const pLevel = pingDeal.dealLevel || 'good';
                            const pCol = LEVEL_COLORS[pLevel] || LEVEL_COLORS.good;
                            const pAccent = LEVEL_ACCENTS[pLevel] || LEVEL_ACCENTS.good;
                            const pAvg = pingDeal.avgPrice || 0;
                            const pSaved = pAvg > pingDeal.price ? pAvg - pingDeal.price : 0;
                            const pDiscount = pingDeal.discount || pingDeal.disc || 0;
                            const pCity = pingDeal.destination || pingDeal.city || '';
                            const pCode = pingDeal.destination_code || pingDeal.code || '';
                            const pCityImg = CITY_IMAGES[pCity] || DEFAULT_CITY_IMAGE;
                            const pStops = pingDeal.stops ?? null;
                            const pAirline = pingDeal.airline || '';
                            const pBaggage = AIRLINE_BAGGAGE[pAirline] || null;
                            const pDepDate = pingDeal.departure_date || '';
                            const pRetDate = pingDeal.return_date || '';
                            let pNights = 0;
                            if (pDepDate && pRetDate) {
                                pNights = Math.round((new Date(pRetDate).getTime() - new Date(pDepDate).getTime()) / (1000 * 60 * 60 * 24));
                            }
                            const pFmtShort = (d: string) => {
                                if (!d) return '';
                                return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
                            };
                            const pGoogleLink = pingDeal.googleFlightsLink
                                || pingDeal.raw_data?.google_flights_link
                                || `https://www.google.com/travel/flights?q=Flights+from+YUL+to+${pCode}&curr=CAD&hl=fr`;

                            return (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: isMobile ? 130 : 155,
                                        right: isMobile ? 8 : 20,
                                        zIndex: 9990,
                                        width: isMobile ? 260 : 300,
                                        borderRadius: 20,
                                        background: `linear-gradient(160deg, ${pAccent.cardFrom}, ${pAccent.cardTo})`,
                                        backdropFilter: 'blur(32px)',
                                        WebkitBackdropFilter: 'blur(32px)',
                                        border: `1px solid ${pAccent.border}`,
                                        fontFamily: "'Outfit', sans-serif",
                                        animation: pingExiting
                                            ? 'dealPanelSlideOut 0.6s cubic-bezier(0.55,0,1,0.45) forwards'
                                            : 'dealPanelSlideIn 1s cubic-bezier(0.16,1,0.3,1) both, dealPanelGlow 5s ease-in-out 1.2s infinite',
                                        boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${pAccent.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
                                        overflow: 'hidden',
                                        pointerEvents: 'auto',
                                        '--panel-glow': pAccent.glow,
                                        '--panel-glow-wide': pAccent.glow.replace(/[\d.]+\)$/, '0.12)'),
                                    } as any}
                                >
                                    {/* Top accent line — breathing */}
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                                        background: `linear-gradient(90deg, transparent, ${pAccent.accent}, transparent)`,
                                        animation: 'dealPanelAccentBreathe 4s ease-in-out 0.8s infinite',
                                        transformOrigin: 'center',
                                    }} />

                                    {/* Bottom accent line — mirror */}
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
                                        background: `linear-gradient(90deg, transparent, ${pAccent.accent}40, transparent)`,
                                        animation: 'dealPanelAccentBreathe 4s ease-in-out 1.5s infinite',
                                        transformOrigin: 'center',
                                    }} />

                                    {/* City hero image */}
                                    <div style={{
                                        position: 'relative', width: '100%',
                                        height: isMobile ? 100 : 120,
                                        overflow: 'hidden',
                                    }}>
                                        <img
                                            src={pCityImg}
                                            alt={pCity}
                                            style={{
                                                width: '100%', height: '100%',
                                                objectFit: 'cover', display: 'block',
                                                animation: 'dealPanelImgKen 20s ease-in-out infinite alternate',
                                            }}
                                        />
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: `linear-gradient(180deg, transparent 0%, ${pAccent.cardFrom} 80%, ${pAccent.cardTo} 100%)`,
                                        }} />

                                        {/* Deal badge */}
                                        <span style={{
                                            position: 'absolute', top: 10, left: 12,
                                            fontSize: 8, fontWeight: 800, color: 'white',
                                            background: pCol.bg, padding: '3px 8px', borderRadius: 6,
                                            boxShadow: `0 2px 8px ${pCol.bg}60`,
                                            display: 'flex', alignItems: 'center', gap: 4,
                                        }}>
                                            <span style={{
                                                width: 5, height: 5, borderRadius: '50%',
                                                background: '#4ADE80',
                                                animation: 'liveBlink 1.5s infinite',
                                            }} />
                                            {pCol.icon} {pCol.label}
                                        </span>

                                        {/* Close button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); dismissPing(); }}
                                            style={{
                                                position: 'absolute', top: 8, right: 8,
                                                width: 24, height: 24, borderRadius: '50%',
                                                background: 'rgba(0,0,0,0.5)', border: 'none',
                                                color: 'rgba(255,255,255,0.5)', fontSize: 12,
                                                cursor: 'pointer', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >✕</button>

                                        {/* City name overlaid on image */}
                                        <div style={{
                                            position: 'absolute', bottom: 10, left: 14,
                                        }}>
                                            <div style={{
                                                fontSize: isMobile ? 20 : 24, fontWeight: 800, color: 'white',
                                                fontFamily: "'Fredoka', sans-serif", lineHeight: 1,
                                                textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                                            }}>{pCity}</div>
                                        </div>
                                    </div>

                                    {/* Content body */}
                                    <div style={{ padding: isMobile ? '12px 14px 14px' : '14px 16px 16px' }}>

                                        {/* Route info row */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            fontSize: 11, color: 'rgba(255,255,255,0.5)',
                                            marginBottom: 10,
                                            animation: 'dealPanelFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s both',
                                        }}>
                                            <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>YUL → {pCode}</span>
                                            {pStops === 0 && <span style={{ color: '#4ADE80', fontWeight: 700, fontSize: 10 }}>Direct</span>}
                                            {pStops != null && pStops > 0 && <span>{pStops} escale{pStops > 1 ? 's' : ''}</span>}
                                        </div>

                                        {/* Details grid */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: 6,
                                            marginBottom: 12,
                                            animation: 'dealPanelFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.45s both',
                                        }}>
                                            {/* Dates */}
                                            {pDepDate && (
                                                <div style={{
                                                    padding: '8px 10px', borderRadius: 10,
                                                    background: 'rgba(255,255,255,0.04)',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                }}>
                                                    <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 3 }}>
                                                        Dates
                                                    </div>
                                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                                                        {pFmtShort(pDepDate)}{pRetDate ? ` → ${pFmtShort(pRetDate)}` : ''}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Duration */}
                                            <div style={{
                                                padding: '8px 10px', borderRadius: 10,
                                                background: 'rgba(255,255,255,0.04)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                            }}>
                                                <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 3 }}>
                                                    Durée
                                                </div>
                                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                                                    {pNights > 0 ? `${pNights} nuits` : 'Aller-retour'}
                                                </div>
                                            </div>

                                            {/* Airline */}
                                            {pAirline && (
                                                <div style={{
                                                    padding: '8px 10px', borderRadius: 10,
                                                    background: 'rgba(255,255,255,0.04)',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                }}>
                                                    <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 3 }}>
                                                        Compagnie
                                                    </div>
                                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                                                        {pAirline}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Baggage */}
                                            {pBaggage && (
                                                <div style={{
                                                    padding: '8px 10px', borderRadius: 10,
                                                    background: 'rgba(255,255,255,0.04)',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                }}>
                                                    <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 3 }}>
                                                        Bagages
                                                    </div>
                                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                                                        {pBaggage.cabin ? 'Cabine incluse' : 'Cabine en extra'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Price section */}
                                        <div style={{
                                            padding: '10px 12px', borderRadius: 12,
                                            background: pAccent.bg,
                                            border: `1px solid ${pAccent.accent}20`,
                                            marginBottom: 10,
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            animation: 'dealPanelFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.6s both',
                                        }}>
                                            <div>
                                                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 2 }}>
                                                    Aller-retour
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                                    <span style={{
                                                        fontSize: isMobile ? 26 : 30, fontWeight: 900, color: 'white',
                                                        fontFamily: "'Fredoka', sans-serif", lineHeight: 1,
                                                    }}>{pingDeal.price}$</span>
                                                    {pAvg > pingDeal.price && (
                                                        <span style={{
                                                            fontSize: 13, color: 'rgba(255,255,255,0.25)',
                                                            textDecoration: 'line-through',
                                                        }}>{pAvg}$</span>
                                                    )}
                                                </div>
                                            </div>
                                            {pSaved > 0 && (
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{
                                                        fontSize: 18, fontWeight: 900, color: pAccent.accent,
                                                        fontFamily: "'Fredoka', sans-serif", lineHeight: 1,
                                                    }}>-{Math.round(pDiscount)}%</div>
                                                    <div style={{
                                                        fontSize: 10, color: '#4ADE80', fontWeight: 700, marginTop: 2,
                                                    }}>Tu économises {pSaved}$</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* CTA Button */}
                                        <a
                                            href={pGoogleLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                width: '100%', padding: '11px 16px', borderRadius: 12,
                                                background: `linear-gradient(135deg, ${pAccent.accent}, ${pAccent.accent}CC)`,
                                                color: 'white', fontSize: 13, fontWeight: 700,
                                                textDecoration: 'none', border: 'none', cursor: 'pointer',
                                                boxShadow: `0 4px 16px ${pAccent.glow}`,
                                                fontFamily: "'Fredoka', sans-serif",
                                                position: 'relative', overflow: 'hidden',
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                                animation: 'dealPanelFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.75s both',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                e.currentTarget.style.boxShadow = `0 6px 24px ${pAccent.glow}`;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = `0 4px 16px ${pAccent.glow}`;
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute', top: 0, left: '-100%',
                                                width: '60%', height: '100%',
                                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                                                animation: 'premShimmer 4s ease-in-out infinite',
                                                pointerEvents: 'none',
                                            }} />
                                            <span style={{ position: 'relative' }}>Réserver sur Google Flights</span>
                                            <span style={{ position: 'relative', fontSize: 16 }}>→</span>
                                        </a>
                                    </div>
                                </div>
                            );
                        })()}



                        {/* ── AURORA GRADIENT (bottom of globe for depth) ── */}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            height: 120, pointerEvents: 'none', zIndex: 5,
                            background: 'linear-gradient(180deg, transparent 0%, rgba(217,149,51,0.02) 30%, rgba(88,40,150,0.04) 60%, rgba(0,120,180,0.03) 80%, rgba(0,0,0,0.3) 100%)',
                        }} />

                        {/* ── DEALS FOUND BADGE (top-right) ── */}
                        {filteredPrices.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: isMobile ? 10 : 16,
                                right: isMobile ? 10 : 16,
                                zIndex: 40,
                                display: 'flex', alignItems: 'center', gap: 7,
                                padding: isMobile ? '6px 12px' : '8px 16px',
                                borderRadius: 12,
                                background: 'rgba(0,0,0,0.5)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: '1px solid rgba(0,212,255,0.08)',
                                fontFamily: "'Outfit', sans-serif",
                            }}>
                                <span style={{
                                    width: 7, height: 7, borderRadius: '50%', background: '#4ADE80',
                                    display: 'inline-block',
                                    animation: 'liveBlink 2s ease-in-out infinite',
                                    boxShadow: '0 0 8px rgba(74,222,128,0.5)',
                                }} />
                                <span style={{
                                    fontSize: isMobile ? 10 : 12, fontWeight: 700, color: 'white',
                                }}>
                                    {filteredPrices.length} deals trouvés
                                </span>
                            </div>
                        )}

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

                {/* ═══ ATMOSPHERIC RE-ENTRY — transition to content ═══ */}
                <div style={{
                    height: 220,
                    background: 'linear-gradient(180deg, #020408 0%, #031520 30%, #052535 60%, #083045 100%)',
                    flexShrink: 0,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {/* Atmospheric re-entry light line */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: 0,
                        right: 0,
                        height: 1,
                        background: 'linear-gradient(90deg, transparent 0%, rgba(0,180,220,0.03) 15%, rgba(0,212,255,0.12) 40%, rgba(32,230,255,0.18) 50%, rgba(0,212,255,0.12) 60%, rgba(0,180,220,0.03) 85%, transparent 100%)',
                        pointerEvents: 'none',
                    }} />
                    {/* Re-entry glow bloom */}
                    <div style={{
                        position: 'absolute',
                        top: 'calc(50% - 20px)',
                        left: 0,
                        right: 0,
                        height: 40,
                        background: 'radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.05), transparent 70%)',
                        pointerEvents: 'none',
                    }} />
                    {/* Subtle horizontal lens flare */}
                    <div style={{
                        position: 'absolute',
                        top: 'calc(50% - 1px)',
                        left: '20%',
                        right: '20%',
                        height: 2,
                        background: 'linear-gradient(90deg, transparent 0%, rgba(0,180,220,0.0) 10%, rgba(0,200,240,0.06) 30%, rgba(0,212,255,0.1) 45%, rgba(32,230,255,0.12) 50%, rgba(0,212,255,0.1) 55%, rgba(0,200,240,0.06) 70%, rgba(0,180,220,0.0) 90%, transparent 100%)',
                        pointerEvents: 'none',
                        filter: 'blur(1px)',
                    }} />

                    {/* Scroll CTA */}
                    <div style={{
                        textAlign: 'center', position: 'relative', zIndex: 2,
                    }}>
                        <div style={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontSize: isMobile ? 20 : 26, fontWeight: 700,
                            color: 'rgba(255,255,255,0.85)',
                            marginBottom: 6,
                        }}>Ton prochain voyage commence ici</div>
                        <div style={{
                            fontSize: isMobile ? 12 : 13, fontWeight: 500,
                            color: 'rgba(255,255,255,0.45)',
                            fontFamily: "'Outfit', sans-serif",
                            marginBottom: 20,
                        }}>Découvre comment on trouve les meilleurs deals</div>
                        {/* Animated chevrons */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <span style={{ fontSize: 16, color: 'rgba(0,212,255,0.5)', animation: 'scrollChevron 2s ease-in-out infinite' }}>▾</span>
                            <span style={{ fontSize: 16, color: 'rgba(0,212,255,0.3)', animation: 'scrollChevron 2s ease-in-out infinite 0.3s' }}>▾</span>
                        </div>
                    </div>
                </div>

                {/* ═══════════ SECTION 2+ : Below the fold ═══════════ */}
                <RevealSection id="how-it-works" direction="up">
                    <div id="deals" style={{ background: 'linear-gradient(180deg, #083045 0%, #062A3E 100%)' }}>
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
