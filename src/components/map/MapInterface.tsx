'use client';
import { useState, useEffect, useMemo } from 'react';
import MapCanvas from './MapCanvas';
import DealStrip from '@/components/deals/DealStrip';
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

const LEVEL_COLORS: Record<string, { bg: string; icon: string }> = {
    lowest_ever: { bg: '#7C3AED', icon: '⚡' },
    incredible: { bg: '#DC2626', icon: '🔥' },
    great: { bg: '#EA580C', icon: '✨' },
    good: { bg: '#2E7DDB', icon: '👍' },
};

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
    const { user, loading: authLoading } = useAuth();
    const [showQuebecPlanner, setShowQuebecPlanner] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [quizCount, setQuizCount] = useState(0);
    const [quizLimitReached, setQuizLimitReached] = useState(false);

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
    };

    // Top deals for mini carousel (sorted by discount, top 8)
    const topDeals = useMemo(() => {
        const allDeals = (prices || []).length > 0 ? prices : [];
        return [...allDeals]
            .filter((d: any) => {
                const code = d.destination_code || d.code || '';
                const isCanadian = CANADA_CODES.includes(code);
                return activeTab === 'canada' ? isCanadian : !isCanadian;
            })
            .sort((a: any, b: any) => (b.discount || 0) - (a.discount || 0))
            .slice(0, 8);
    }, [prices, activeTab]);

    const tabs = [
        { key: 'international', label: 'Monde', icon: '✈️', desc: 'Tous les deals' },
        { key: 'canada', label: 'Canada', icon: '🍁', desc: 'Vols intérieurs' },
        { key: 'tout-inclus', label: 'Tout inclus', icon: '🏖️', desc: 'Vol + hôtel' },
    ];

    return (
        <>
            <div id="app" className={appReady ? 'show' : ''} style={{
                minHeight: '100vh',
                background: '#F4F8FB',
            }}>
                {/* ========== Section 1 : 100vh ========== */}
                <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <MapTopbar prices={prices} />

                    {/* ONGLETS DARK — intégrés au thème */}
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

                    {/* Map Area — prend l'espace restant */}
                    <div style={{
                        flex: '1 1 auto', minHeight: 0, position: 'relative',
                        background: '#1B2D4F', overflow: 'hidden',
                    }}>
                        {/* Légende des couleurs — haut droite */}
                        <div style={{
                            position: 'absolute',
                            top: isMobile ? 8 : 12,
                            right: isMobile ? 8 : 16,
                            zIndex: 30,
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

                        <MapCanvas
                            deals={prices}
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
                                setSelectedFlight(deal);
                                setBookingOpen(true);
                                setConfettiPos({ x: e.clientX, y: e.clientY });
                                setConfettiTrigger(prev => prev + 1);
                            }}
                        />

                        {/* Mini carousel + scroll hint — en bas de la carte */}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
                            background: 'linear-gradient(to top, rgba(27,45,79,0.97) 0%, rgba(27,45,79,0.8) 60%, transparent 100%)',
                            padding: isMobile ? '20px 12px 6px' : '24px 16px 6px',
                        }}>
                            {/* Title */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <span style={{
                                    fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    🔥 Top deals {activeTab === 'canada' ? 'Canada' : 'du moment'}
                                </span>
                                <span style={{
                                    width: 5, height: 5, borderRadius: '50%',
                                    background: '#16A34A', animation: 'liveBlink 2s ease-in-out infinite',
                                }} />
                            </div>

                            {/* Mini cards — 1er et 3e meilleurs deals ont badge premium */}
                            <div style={{
                                display: 'flex', gap: isMobile ? 8 : 10,
                                overflowX: 'auto', paddingBottom: 6,
                                scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
                            }}>
                                {topDeals.map((deal: any, i: number) => {
                                    const level = deal.dealLevel || 'good';
                                    const col = LEVEL_COLORS[level] || LEVEL_COLORS.good;
                                    const discount = deal.discount || deal.disc || 0;
                                    const city = deal.destination || deal.city || '';
                                    const code = deal.destination_code || deal.code || '';
                                    const isPremiumHighlight = i === 0 || i === 2;

                                    return (
                                        <div
                                            key={`mini-${code}-${i}`}
                                            className="mini-deal-card"
                                            onClick={() => setSelectedDeal({
                                                city, code, price: deal.price, airline: deal.airline,
                                                stops: deal.stops, route: `YUL – ${code}`,
                                                disc: discount, dealLevel: level,
                                                destination_code: code,
                                                departure_date: deal.departure_date,
                                                return_date: deal.return_date,
                                                googleFlightsLink: deal.googleFlightsLink,
                                                raw_data: deal.raw_data,
                                                avgPrice: deal.avgPrice, discount,
                                            })}
                                            style={{
                                                minWidth: isMobile ? 125 : 140,
                                                padding: isMobile ? '7px 10px' : '8px 12px',
                                                borderRadius: 10,
                                                background: 'rgba(255,255,255,0.88)',
                                                border: '1px solid rgba(26,43,66,0.08)',
                                                backdropFilter: 'blur(8px)',
                                                cursor: 'pointer', flexShrink: 0,
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 2px 8px rgba(26,43,66,0.06)',
                                                position: 'relative', overflow: 'hidden',
                                            }}
                                        >
                                            {isPremiumHighlight && (
                                                <div style={{
                                                    position: 'absolute', top: -6, right: -4,
                                                    background: col.bg, color: 'white',
                                                    borderRadius: 100, padding: '2px 7px',
                                                    display: 'flex', alignItems: 'center', gap: 3,
                                                    zIndex: 3, boxShadow: `0 2px 8px ${col.bg}40`,
                                                    fontSize: 7.5, fontWeight: 800,
                                                    fontFamily: "'Outfit', sans-serif",
                                                }}>
                                                    ⚡ Alerte perso
                                                </div>
                                            )}
                                            <div style={{
                                                display: 'flex', alignItems: 'center',
                                                justifyContent: 'space-between', marginBottom: 3,
                                                position: 'relative', zIndex: 1,
                                            }}>
                                                <span style={{
                                                    fontSize: isMobile ? 11 : 12, fontWeight: 700,
                                                    color: '#1A2B42', fontFamily: "'Outfit', sans-serif",
                                                }}>{city}</span>
                                                <span style={{
                                                    fontSize: 7, fontWeight: 800,
                                                    background: col.bg, color: 'white',
                                                    padding: '1px 5px', borderRadius: 100,
                                                }}>{col.icon}</span>
                                            </div>
                                            <div style={{
                                                fontSize: 9, color: '#8FA3B8', marginBottom: 5,
                                                fontFamily: "'Outfit', sans-serif",
                                                position: 'relative', zIndex: 1,
                                            }}>
                                                YUL → {code}{deal.stops === 0 ? ' · Direct' : ''}
                                            </div>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 5,
                                                position: 'relative', zIndex: 1,
                                            }}>
                                                <span style={{
                                                    fontSize: isMobile ? 13 : 15, fontWeight: 800,
                                                    color: '#2E7DDB',
                                                    fontFamily: "'Fredoka', sans-serif",
                                                }}>
                                                    {deal.price}$
                                                </span>
                                                {discount > 0 && (
                                                    <span style={{ fontSize: 9, fontWeight: 700, color: col.bg }}>
                                                        -{Math.round(discount)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Scroll hint — sous les mini cards */}
                            <a href="#deals" style={{
                                textDecoration: 'none', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                gap: 4, padding: '6px 0 2px',
                            }}>
                                <span style={{
                                    fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600,
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    Voir tous les deals
                                </span>
                                <div style={{ animation: 'scrollHint 2s ease-in-out infinite' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24"
                                        fill="none" stroke="#60A5FA" strokeWidth="2.5"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </div>
                            </a>
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

                {/* ========== Section 2 : Deals (scrollable) ========== */}
                <div id="deals">
                    <DealStrip
                        deals={prices}
                        loading={pricesLoading}
                        activeTab={activeTab === 'tout-inclus' ? 'international' : activeTab}
                        onViewChange={setMapView}
                        onDealClick={setSelectedDeal}
                    />
                </div>

                {/* Section 3 */}
                <HowItWorks />

                {/* Section 4 */}
                <PremiumSection />

                {/* Section 5 — Récits de voyageurs */}
                <div id="recits-section">
                    <RecitsSection />
                </div>

                {/* Section 6 — Transparence IA & données */}
                <TransparenceSection />

                {/* Footer */}
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
