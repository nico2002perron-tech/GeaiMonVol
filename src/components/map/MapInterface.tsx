'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import MapCanvas from './MapCanvas';
import Sidebar from './Sidebar';
import BookingPanel from './BookingPanel';
import HowItWorksModal from '@/components/ui/HowItWorksModal';
import MapTopbar from './MapTopbar';
import HoverCard from './HoverCard';
import GeaiAssistant from './GeaiAssistant';
import Confetti from './Confetti';
import Onboarding from './Onboarding';
import { useLivePrices } from '@/lib/hooks/useLivePrices';
import DealSidebar from '@/components/deals/DealSidebar';
import HowItWorks from '../landing/HowItWorks';
import PremiumSection from '../landing/PremiumSection';
import RecitsSection from '../landing/RecitsSection';
import TransparenceSection from '../landing/TransparenceSection';
import Footer from '../landing/Footer';
import QuebecPlanner from './QuebecPlanner';
import { useAuth } from '@/lib/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';

const CANADA_CODES = ['YYZ', 'YOW', 'YVR', 'YYC', 'YEG', 'YWG', 'YHZ', 'YQB'];

const LEVEL_COLORS: Record<string, { bg: string; icon: string; label: string }> = {
    lowest_ever: { bg: '#7C3AED', icon: '⚡', label: 'PRIX RECORD' },
    incredible: { bg: '#DC2626', icon: '🔥', label: 'INCROYABLE' },
    great: { bg: '#EA580C', icon: '✨', label: 'SUPER DEAL' },
    good: { bg: '#2E7DDB', icon: '👍', label: 'BON PRIX' },
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
    'Porto': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400',
    'Marrakech': 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400',
    'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
    'Bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579367?w=400',
    'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400',
    'Cancún': 'https://images.unsplash.com/photo-1520116468414-046603d3d63b?w=400',
    'Miami': 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=400',
    'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
    'Reykjavik': 'https://images.unsplash.com/photo-1504541982954-541e20faee3a?w=400',
    'Toronto': 'https://images.unsplash.com/photo-1517090504332-e94e18675f74?w=400',
    'Vancouver': 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=400',
    'Punta Cana': 'https://images.unsplash.com/photo-1535916707207-35f97e715e1c?w=400',
    'La Havane': 'https://images.unsplash.com/photo-1500759285222-a95626b934cb?w=400',
    'Bogota': 'https://images.unsplash.com/photo-1568385247005-0d371d214862?w=400',
    'Lima': 'https://images.unsplash.com/photo-1531968455001-5c5272a67c71?w=400',
    'Fort Lauderdale': 'https://images.unsplash.com/photo-1589083130544-0d6a2926e519?w=400',
    'Cuba (Varadero)': 'https://images.unsplash.com/photo-1570345070170-51d6e8f38953?w=400',
    'Los Angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=400',
    'Montego Bay': 'https://images.unsplash.com/photo-1580237541049-2d715a09486e?w=400',
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
// INFINITE AUTO-SCROLL CAROUSEL — ENHANCED
// ═══════════════════════════════════════════════════════
function InfiniteCarousel({ deals, isMobile, onDealClick }: {
    deals: any[];
    isMobile: boolean;
    onDealClick: (deal: any) => void;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    // Duplicate deals for seamless infinite loop
    const loopedDeals = useMemo(() => {
        if (deals.length === 0) return [];
        return [...deals, ...deals];
    }, [deals]);

    // Auto-scroll effect
    useEffect(() => {
        const container = scrollRef.current;
        if (!container || deals.length === 0) return;

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
        }, 400);

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
    }, [deals.length]);

    // Stats
    const stats = useMemo(() => {
        if (deals.length === 0) return null;
        const sorted = [...deals].sort((a: any, b: any) => a.price - b.price);
        const cheapest = sorted[0];
        const biggestDiscount = [...deals].sort((a: any, b: any) => (b.discount || 0) - (a.discount || 0))[0];
        const directCount = deals.filter((d: any) => d.stops === 0).length;
        return { cheapest, biggestDiscount, directCount };
    }, [deals]);

    if (deals.length === 0) {
        return (
            <div style={{
                padding: '40px 24px', textAlign: 'center',
                background: 'white', color: '#8FA3B8', fontSize: 14,
                fontFamily: "'Outfit', sans-serif",
            }}>
                Aucun deal pour cette période
            </div>
        );
    }

    return (
        <div style={{ background: 'white', paddingBottom: 0 }}>
            {/* Fade edges */}
            <div style={{ position: 'relative' }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: 60, height: '100%',
                    background: 'linear-gradient(to right, white, transparent)',
                    zIndex: 3, pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', top: 0, right: 0, width: 60, height: '100%',
                    background: 'linear-gradient(to left, white, transparent)',
                    zIndex: 3, pointerEvents: 'none',
                }} />

                <div
                    ref={scrollRef}
                    className="carousel-scroll"
                    style={{
                        display: 'flex', gap: 18,
                        overflowX: 'auto', padding: '20px 24px 16px',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    {loopedDeals.map((deal: any, i: number) => {
                        const level = deal.dealLevel || 'good';
                        const col = LEVEL_COLORS[level] || LEVEL_COLORS.good;
                        const discount = deal.discount || deal.disc || 0;
                        const city = deal.destination || deal.city || '';
                        const code = deal.destination_code || deal.code || '';
                        const img = CITY_IMAGES[city];
                        const avgPrice = deal.avgPrice || 0;
                        const savings = avgPrice > deal.price ? avgPrice - deal.price : 0;
                        const airline = deal.airline || '';
                        const country = deal.country || '';
                        const depDate = deal.departure_date || '';
                        const retDate = deal.return_date || '';
                        let nights = 0;
                        if (depDate && retDate) {
                            nights = Math.round((new Date(retDate).getTime() - new Date(depDate).getTime()) / (1000 * 60 * 60 * 24));
                        }
                        const formatShort = (d: string) => {
                            if (!d) return '';
                            const dt = new Date(d);
                            return dt.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
                        };
                        const datesLabel = depDate ? `${formatShort(depDate)}${retDate ? ' – ' + formatShort(retDate) : ''}` : '';
                        const isHovered = hoveredIdx === i;

                        return (
                            <div
                                key={`inf-${code}-${i}`}
                                className="carousel-card"
                                onClick={() => onDealClick(deal)}
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                style={{
                                    minWidth: isMobile ? 240 : 270,
                                    maxWidth: isMobile ? 240 : 270,
                                    borderRadius: 20, overflow: 'hidden',
                                    background: 'white',
                                    border: isHovered ? `2px solid ${col.bg}` : '1px solid rgba(26,43,66,0.07)',
                                    boxShadow: isHovered
                                        ? `0 12px 35px ${col.bg}20, 0 4px 15px rgba(0,0,0,0.06)`
                                        : '0 4px 15px rgba(26,43,66,0.05)',
                                    cursor: 'pointer', flexShrink: 0,
                                    position: 'relative',
                                    transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                                    transition: 'all 0.35s cubic-bezier(.25,.46,.45,.94)',
                                }}
                            >
                                {/* Badge */}
                                <div style={{
                                    position: 'absolute', top: 12, left: 12, zIndex: 5,
                                    background: col.bg, color: 'white',
                                    padding: '4px 12px', borderRadius: 100,
                                    fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    boxShadow: `0 2px 10px ${col.bg}40`,
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    {col.icon} {col.label}
                                </div>

                                {/* Watchlist heart */}
                                <div
                                    onClick={(e) => { e.stopPropagation(); }}
                                    style={{
                                        position: 'absolute', top: 12, right: 12, zIndex: 5,
                                        background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
                                        borderRadius: '50%', width: 32, height: 32,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24"
                                        fill="none" stroke="white" strokeWidth="2.5">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </div>

                                {/* Image with hover zoom */}
                                <div style={{ height: 150, position: 'relative', overflow: 'hidden' }}>
                                    <img
                                        src={img || 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=500&h=300&fit=crop'}
                                        alt={city}
                                        style={{
                                            width: '100%', height: '100%', objectFit: 'cover',
                                            transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                                            transition: 'transform 0.6s cubic-bezier(.25,.46,.45,.94)',
                                        }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src =
                                                'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=500&h=300&fit=crop';
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55))',
                                    }} />
                                    {/* Dates overlay */}
                                    {datesLabel && (
                                        <div style={{
                                            position: 'absolute', bottom: 10, left: 12,
                                        }}>
                                            <span style={{
                                                fontSize: 11, color: 'white', fontWeight: 600,
                                                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
                                                padding: '4px 12px', borderRadius: 100,
                                                fontFamily: "'Outfit', sans-serif",
                                            }}>
                                                📅 {datesLabel}{nights > 0 ? ` · ${nights} nuits` : ''}
                                            </span>
                                        </div>
                                    )}
                                    {/* Direct badge on image */}
                                    {deal.stops === 0 && (
                                        <div style={{
                                            position: 'absolute', bottom: 10, right: 12,
                                        }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 800, color: 'white',
                                                background: 'rgba(22,163,74,0.85)', backdropFilter: 'blur(6px)',
                                                padding: '3px 10px', borderRadius: 100,
                                                fontFamily: "'Outfit', sans-serif",
                                            }}>
                                                ✈️ Direct
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div style={{ padding: '16px 18px 18px' }}>
                                    {/* City + Country */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{
                                            fontSize: 18, fontWeight: 700, color: '#1A2B42',
                                            fontFamily: "'Fredoka', sans-serif",
                                        }}>
                                            {city}
                                        </span>
                                        {country && (
                                            <span style={{ fontSize: 12, color: '#8FA3B8', fontWeight: 500 }}>
                                                {country}
                                            </span>
                                        )}
                                    </div>
                                    {/* Route + airline */}
                                    <div style={{
                                        fontSize: 12, color: '#8FA3B8', marginBottom: 14,
                                        fontFamily: "'Outfit', sans-serif",
                                    }}>
                                        YUL → {code}{airline ? ` · ${airline}` : ''}
                                    </div>

                                    {/* Price row */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{
                                                fontSize: 26, fontWeight: 800, color: '#2E7DDB',
                                                fontFamily: "'Fredoka', sans-serif",
                                            }}>
                                                {deal.price}$
                                            </span>
                                            {avgPrice > deal.price && (
                                                <span style={{
                                                    fontSize: 13, color: '#B0B8C4', textDecoration: 'line-through',
                                                }}>
                                                    {avgPrice}$
                                                </span>
                                            )}
                                        </div>
                                        {discount > 0 && (
                                            <span style={{
                                                fontSize: 12, fontWeight: 800, color: col.bg,
                                                background: `${col.bg}12`, padding: '4px 10px', borderRadius: 8,
                                            }}>
                                                -{Math.round(discount)}%
                                            </span>
                                        )}
                                    </div>

                                    {/* Savings bar */}
                                    {savings > 0 && (
                                        <div style={{
                                            marginTop: 12, padding: '8px 12px', borderRadius: 10,
                                            background: 'linear-gradient(135deg, #F0F7FF, #E8F5E9)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        }}>
                                            <span style={{ fontSize: 11, color: '#5A7089', fontWeight: 600 }}>
                                                💰 Tu économises
                                            </span>
                                            <span style={{
                                                fontSize: 14, fontWeight: 800, color: '#16A34A',
                                                fontFamily: "'Fredoka', sans-serif",
                                            }}>
                                                {savings}$
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ═══ STATS BAR ═══ */}
            {stats && (
                <div style={{
                    display: 'flex', gap: 12, padding: '4px 24px 20px',
                    overflowX: 'auto', scrollbarWidth: 'none',
                }}>
                    {[
                        {
                            icon: '⚡',
                            label: 'Meilleur deal',
                            value: `${stats.cheapest?.destination || stats.cheapest?.city || '—'} à ${stats.cheapest?.price || 0}$`,
                            color: '#7C3AED',
                        },
                        {
                            icon: '📉',
                            label: 'Plus gros rabais',
                            value: `-${Math.round(stats.biggestDiscount?.discount || 0)}% (${stats.biggestDiscount?.destination || stats.biggestDiscount?.city || '—'})`,
                            color: '#DC2626',
                        },
                        {
                            icon: '✈️',
                            label: 'Vols directs',
                            value: `${stats.directCount} destination${stats.directCount > 1 ? 's' : ''}`,
                            color: '#2E7DDB',
                        },
                        {
                            icon: '🔄',
                            label: 'Dernière mise à jour',
                            value: new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }),
                            color: '#16A34A',
                        },
                    ].map((stat, idx) => (
                        <div key={idx} style={{
                            flex: '1 1 200px', minWidth: 180,
                            padding: '14px 18px',
                            background: '#FAFBFD',
                            borderRadius: 14,
                            border: '1px solid rgba(26,43,66,0.05)',
                            display: 'flex', alignItems: 'center', gap: 12,
                            flexShrink: 0,
                        }}>
                            <span style={{ fontSize: 18 }}>{stat.icon}</span>
                            <div>
                                <div style={{
                                    fontSize: 10, color: '#8FA3B8', fontWeight: 600,
                                    textTransform: 'uppercase' as const, letterSpacing: 0.5,
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    {stat.label}
                                </div>
                                <div style={{
                                    fontSize: 14, fontWeight: 700, color: '#1A2B42',
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    {stat.value}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
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
    const [selectedDeal, setSelectedDeal] = useState<any>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [activeTab, setActiveTab] = useState<'international' | 'canada' | 'tout-inclus'>('international');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const { user, loading: authLoading } = useAuth();
    const [showQuebecPlanner, setShowQuebecPlanner] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [quizCount, setQuizCount] = useState(0);
    const [quizLimitReached, setQuizLimitReached] = useState(false);
    const carouselRef = useRef<HTMLDivElement>(null);

    const months = useMemo(() => getMonths(), []);

    useEffect(() => {
        setIsMobile(window.innerWidth <= 768);
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!user) return;
        const supabase = createClient();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        supabase
            .from('quebec_quiz_usage')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .gte('created_at', startOfMonth)
            .then(({ count }) => {
                const c = count || 0;
                setQuizCount(c);
                setQuizLimitReached(c >= 2);
            });
    }, [user, showQuebecPlanner]);

    const handleQuebecClick = () => {
        if (!user) {
            setShowLoginPrompt(true);
            setTimeout(() => setShowLoginPrompt(false), 4000);
            return;
        }
        if (quizLimitReached) {
            setShowLoginPrompt(true);
            setTimeout(() => setShowLoginPrompt(false), 4000);
            return;
        }
        setShowQuebecPlanner(true);
        const supabase = createClient();
        supabase.from('quebec_quiz_usage').insert({ user_id: user.id });
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

    const handleDealClick = (deal: any) => {
        const code = deal.destination_code || deal.code || '';
        const city = deal.destination || deal.city || '';
        const discount = deal.discount || deal.disc || 0;
        const level = deal.dealLevel || 'good';
        setSelectedDeal({
            city, code, price: deal.price, airline: deal.airline,
            stops: deal.stops, route: `YUL – ${code}`,
            disc: discount, dealLevel: level,
            destination_code: code,
            departure_date: deal.departure_date,
            return_date: deal.return_date,
            googleFlightsLink: deal.googleFlightsLink,
            raw_data: deal.raw_data,
            avgPrice: deal.avgPrice, discount,
            img: CITY_IMAGES[city] || '',
            country: deal.country,
        });
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
                .carousel-card{transition:all 0.3s cubic-bezier(.25,.46,.45,.94);}
                .carousel-card:hover{transform:translateY(-4px);box-shadow:0 8px 25px rgba(0,0,0,0.12)!important;}
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
                                            onClick={() => handleDealClick(deal)}
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

                        {/* ── MAP CANVAS ── */}
                        <MapCanvas
                            deals={filteredPrices}
                            mapView={mapView}
                            isMobile={isMobile}
                            onRegionSelect={(region) => {
                                setSelectedRegion(region);
                                setSidebarOpen(true);
                            }}
                            onHoverDeal={(deal, e) => {
                                setHoveredDeal(deal);
                                setHoverPos({ x: e.clientX, y: e.clientY });
                                setHoverVisible(true);
                            }}
                            onLeaveDeal={() => setHoverVisible(false)}
                            onSelectDeal={(deal: any, e: any) => {
                                handleDealClick(deal);
                                setConfettiPos({ x: e.clientX, y: e.clientY });
                                setConfettiTrigger(prev => prev + 1);
                            }}
                        />

                        {/* ═══ BAS GAUCHE DE LA CARTE : MOIS ═══ */}
                        <div style={{
                            position: 'absolute', bottom: isMobile ? 12 : 20, left: isMobile ? 12 : 20, zIndex: 20,
                            display: 'flex', gap: 6,
                            overflowX: 'auto', maxWidth: isMobile ? 'calc(100% - 24px)' : '70%',
                            paddingBottom: 2,
                            scrollbarWidth: 'none',
                        }}>
                            <button
                                className="month-pill"
                                onClick={() => setSelectedMonth('all')}
                                style={{
                                    padding: isMobile ? '9px 18px' : '10px 24px',
                                    borderRadius: 14, cursor: 'pointer',
                                    fontSize: isMobile ? 13 : 14, fontWeight: 700,
                                    fontFamily: "'Outfit', sans-serif",
                                    whiteSpace: 'nowrap',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: selectedMonth === 'all'
                                        ? 'linear-gradient(135deg, #2E7DDB, #1B5BA0)'
                                        : 'rgba(15,26,42,0.7)',
                                    backdropFilter: 'blur(12px)',
                                    color: selectedMonth === 'all' ? 'white' : 'rgba(255,255,255,0.5)',
                                    boxShadow: selectedMonth === 'all'
                                        ? '0 4px 14px rgba(46,125,219,0.35)'
                                        : '0 2px 8px rgba(0,0,0,0.2)',
                                    border: selectedMonth === 'all'
                                        ? '1px solid rgba(96,165,250,0.3)'
                                        : '1px solid rgba(255,255,255,0.08)',
                                }}
                            >
                                Tous
                                <span style={{
                                    fontSize: 10, fontWeight: 800,
                                    background: selectedMonth === 'all' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                                    padding: '2px 8px', borderRadius: 100,
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
                                            padding: isMobile ? '9px 18px' : '10px 24px',
                                            borderRadius: 14, cursor: 'pointer',
                                            fontSize: isMobile ? 13 : 14, fontWeight: 700,
                                            fontFamily: "'Outfit', sans-serif",
                                            whiteSpace: 'nowrap',
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            background: selectedMonth === m.value
                                                ? 'linear-gradient(135deg, #2E7DDB, #1B5BA0)'
                                                : 'rgba(15,26,42,0.7)',
                                            backdropFilter: 'blur(12px)',
                                            color: selectedMonth === m.value ? 'white' : 'rgba(255,255,255,0.5)',
                                            boxShadow: selectedMonth === m.value
                                                ? '0 4px 14px rgba(46,125,219,0.35)'
                                                : '0 2px 8px rgba(0,0,0,0.2)',
                                            border: selectedMonth === m.value
                                                ? '1px solid rgba(96,165,250,0.3)'
                                                : '1px solid rgba(255,255,255,0.08)',
                                        }}
                                    >
                                        {m.label}
                                        <span style={{
                                            fontSize: 10, fontWeight: 800,
                                            background: selectedMonth === m.value ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                                            padding: '2px 8px', borderRadius: 100,
                                        }}>
                                            {monthCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ═══════════ CARROUSEL INFINI SOUS LA CARTE ═══════════ */}
                <InfiniteCarousel
                    deals={carouselDeals}
                    isMobile={isMobile}
                    onDealClick={handleDealClick}
                />

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

                <DealSidebar deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
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
