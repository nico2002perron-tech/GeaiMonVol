'use client';
// GeaiMonVol V2 - Globe Explorer (simplified)
import { useState, useLayoutEffect, useMemo, useRef } from 'react';
import CartoonGlobe from './CartoonGlobe';
import BookingPanel from './BookingPanel';
import HoverCard from './HoverCard';
import GeaiAssistant from './GeaiAssistant';
import { useLivePrices } from '@/lib/hooks/useLivePrices';
import { CANADA_CODES } from '@/lib/constants/deals';
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

export default function MapInterface() {
    const [bookingOpen, setBookingOpen] = useState(false);
    const [selectedFlight, setSelectedFlight] = useState<any>(null);
    const [mapView, setMapView] = useState<'world' | 'canada'>('world');
    const [flyToDeal, setFlyToDeal] = useState<any>(null);
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = useState<'international' | 'canada' | 'tout-inclus'>('international');

    const globeSectionRef = useRef<HTMLDivElement>(null);

    const [hoveredDeal, setHoveredDeal] = useState<any>(null);
    const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
    const [hoverVisible, setHoverVisible] = useState(false);

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
    };

    // ─── FILTER DEALS BY TAB ───
    const filteredPrices = useMemo(() => {
        return (prices || []).filter((d: any) => {
            const code = d.destination_code || d.code || '';
            const isCanadian = CANADA_CODES.includes(code);
            if (activeTab === 'canada' && !isCanadian) return false;
            if (activeTab !== 'canada' && isCanadian) return false;
            return true;
        });
    }, [prices, activeTab]);

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

    const handleHoloComplete = () => {
        setFlyToDeal(null);
    };

    return (
        <>
            <style>{`
                @keyframes liveBlink{0%,100%{opacity:1}50%{opacity:.3}}
                @keyframes tabGlow{0%,100%{box-shadow:0 0 12px rgba(14,165,233,0.12)}50%{box-shadow:0 0 20px rgba(14,165,233,0.2)}}
                @keyframes fadeInUp{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
            `}</style>

            <div style={{
                height: '100vh',
                overflow: 'hidden',
                background: 'transparent',
                position: 'relative',
            }}>
                <div ref={globeSectionRef} style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    paddingTop: 76,
                    position: 'relative',
                }}>
                    {/* ═══ MAP AREA ═══ */}
                    <div style={{
                        flex: '1 1 auto', minHeight: 0, position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* ── FLOATING PILL TABS ── */}
                        <div style={{
                            position: 'absolute',
                            top: isMobile ? 10 : 16,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 40,
                            background: 'rgba(255,255,255,0.75)',
                            backdropFilter: 'blur(20px) saturate(1.6)',
                            WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
                            borderRadius: isMobile ? 22 : 26,
                            border: '1px solid rgba(255,255,255,0.5)',
                            padding: isMobile ? 4 : 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: isMobile ? 2 : 4,
                            boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(14,165,233,0.04)',
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
                                background: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(6,182,212,0.08))',
                                border: '1px solid rgba(14,165,233,0.15)',
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
                                            color: isActive ? '#0F172A' : '#94A3B8',
                                            transition: 'color 0.3s, font-weight 0.3s',
                                            lineHeight: 1.2,
                                        }}>{tab.label}</span>
                                        {count > 0 && (
                                            <span style={{
                                                fontSize: isMobile ? 9 : 10,
                                                fontWeight: 600,
                                                padding: '1px 6px',
                                                borderRadius: 100,
                                                background: isActive ? 'rgba(14,165,233,0.12)' : 'rgba(15,23,42,0.04)',
                                                color: isActive ? '#0284C7' : '#94A3B8',
                                                transition: 'all 0.3s ease',
                                                fontFamily: "'Outfit', sans-serif",
                                                lineHeight: '16px',
                                            }}>{count}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

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
                                background: 'rgba(255,255,255,0.85)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255,255,255,0.5)',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                                fontFamily: "'Outfit', sans-serif",
                            }}>
                                <span style={{
                                    width: 7, height: 7, borderRadius: '50%', background: '#10B981',
                                    display: 'inline-block',
                                    animation: 'liveBlink 2s ease-in-out infinite',
                                    boxShadow: '0 0 8px rgba(16,185,129,0.4)',
                                }} />
                                <span style={{
                                    fontSize: isMobile ? 10 : 12, fontWeight: 700, color: '#0F172A',
                                }}>
                                    {filteredPrices.length} deals trouvés
                                </span>
                            </div>
                        )}

                        {/* ── CARTOON GLOBE ── */}
                        <CartoonGlobe
                            deals={flyToDeal ? [flyToDeal] : filteredPrices}
                            mapView={mapView}
                            isMobile={isMobile}
                            onRegionSelect={() => {}}
                            onHoverDeal={(deal: any, e: MouseEvent | React.MouseEvent) => {
                                setHoveredDeal(deal);
                                setHoverPos({ x: e.clientX, y: e.clientY });
                                setHoverVisible(true);
                            }}
                            onLeaveDeal={() => setHoverVisible(false)}
                            onSelectDeal={(deal: any) => {
                                setFlyToDeal({ ...deal, _ts: Date.now() });
                            }}
                            flyToDeal={flyToDeal}
                            onHoloComplete={handleHoloComplete}
                        />
                    </div>
                </div>

                <HoverCard
                    deal={hoveredDeal}
                    x={hoverPos.x}
                    y={hoverPos.y}
                    visible={hoverVisible}
                />

                {/* Overlays & modals */}
                <BookingPanel
                    isOpen={bookingOpen}
                    onClose={() => setBookingOpen(false)}
                    selectedFlight={selectedFlight}
                />
                <GeaiAssistant onOpen={() => setBookingOpen(true)} />
            </div>
        </>
    );
}
