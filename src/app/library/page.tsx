'use client';
/** Vercel Trigger: Immersive Library V2.0.1 **/
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import TravelBook from '@/components/map/TravelBook';

/* ═══ BOOK COLORS ═══ */
const BOOK_COLORS = [
    { bg: "#8B2500", spine: "#5C1A00", accent: "#D4A574", pattern: "lines" },
    { bg: "#1A3A5C", spine: "#0F2440", accent: "#7EB8D8", pattern: "dots" },
    { bg: "#2D5016", spine: "#1A3008", accent: "#8FBF6A", pattern: "zigzag" },
    { bg: "#4A1942", spine: "#2E0F2A", accent: "#C490BF", pattern: "lines" },
    { bg: "#5C3A1E", spine: "#3A2410", accent: "#C9A87C", pattern: "cross" },
    { bg: "#1A4A4A", spine: "#0E2E2E", accent: "#6BC4C4", pattern: "dots" },
    { bg: "#4A2C2A", spine: "#2E1A18", accent: "#C49A98", pattern: "zigzag" },
    { bg: "#2A3A5C", spine: "#1A2640", accent: "#8A9FBF", pattern: "cross" },
    { bg: "#6B1D1D", spine: "#451212", accent: "#D4847A", pattern: "lines" },
    { bg: "#2D4A1E", spine: "#1A3010", accent: "#9FC48A", pattern: "dots" },
];

const SHELF_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Fredoka:wght@400;600;700;800&display=swap');

@keyframes shelfFadeIn { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
@keyframes bookIdle { 0%, 100% { transform: rotateY(0deg) } }
@keyframes bookPull {
    0% { transform: translateZ(0) rotateY(0deg); }
    30% { transform: translateZ(40px) rotateY(-5deg); }
    60% { transform: translateZ(80px) rotateY(-8deg) scale(1.05); }
    100% { transform: translateZ(200px) rotateY(-15deg) scale(1.1); opacity: 0; }
}
@keyframes bookAppear {
    0% { opacity: 0; transform: scale(0.3) rotateY(-30deg); }
    50% { opacity: 1; transform: scale(1.05) rotateY(5deg); }
    100% { opacity: 1; transform: scale(1) rotateY(0deg); }
}
@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}
@keyframes floatSoft { 0%, 100% { transform: translateY(0px) } 50% { transform: translateY(-2px) } }
@keyframes gentleGlow { 0%, 100% { opacity: 0.3 } 50% { opacity: 0.6 } }

.shelf-book { cursor: pointer; transition: all 0.3s cubic-bezier(.34,1.56,.64,1); transform-style: preserve-3d; perspective: 800px; }
.shelf-book:hover { transform: translateY(-8px) translateZ(15px) rotateY(-5deg) !important; }
.shelf-book.pulling { animation: bookPull 0.6s cubic-bezier(.4,0,.2,1) forwards; pointer-events: none; }
.shelf-scroll::-webkit-scrollbar { width: 6px; }
.shelf-scroll::-webkit-scrollbar-thumb { background: rgba(139,107,72,0.3); border-radius: 3px; }
.shelf-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
`;

function getBookColor(index: number) {
    return BOOK_COLORS[index % BOOK_COLORS.length];
}

function getBookHeight(guide: any) {
    const days = guide?.guide_data?.days?.length || 3;
    return Math.min(220, Math.max(150, 130 + days * 12));
}

function getBookWidth(guide: any) {
    const days = guide?.guide_data?.days?.length || 3;
    return Math.min(52, Math.max(32, 28 + days * 3));
}

/* ═══ SINGLE BOOK ON SHELF ═══ */
function ShelfBook({ guide, index, onClick, isPulling }: { guide: any; index: number; onClick: () => void; isPulling: boolean }) {
    const bc = getBookColor(index);
    const h = getBookHeight(guide);
    const w = getBookWidth(guide);
    const g = guide.guide_data;
    const title = g?.title || guide.destination || "Voyage";
    const days = g?.days?.length || "?";
    const destination = guide.destination || "";

    // Truncate title for spine
    const spineTitle = title.length > 25 ? title.substring(0, 22) + "..." : title;

    return (
        <div className={`shelf-book ${isPulling ? 'pulling' : ''}`}
            onClick={onClick}
            style={{
                width: w, height: h, position: 'relative', display: 'inline-flex', flexShrink: 0,
                marginBottom: 0, alignSelf: 'flex-end',
                animation: `shelfFadeIn 0.4s ease ${index * 0.06}s both`,
            }}>
            {/* Book body */}
            <div style={{
                width: '100%', height: '100%', borderRadius: '3px 6px 6px 3px',
                background: `linear-gradient(135deg, ${bc.bg}, ${bc.spine})`,
                boxShadow: `2px 4px 12px rgba(0,0,0,0.4), inset -2px 0 4px rgba(0,0,0,0.2)`,
                position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
                {/* Spine edge */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: `linear-gradient(180deg, ${bc.accent}40, ${bc.spine}, ${bc.accent}40)` }} />

                {/* Top decoration */}
                <div style={{ position: 'absolute', top: 8, left: 8, right: 8, height: 1, background: `${bc.accent}50` }} />
                <div style={{ position: 'absolute', top: 11, left: 10, right: 10, height: 1, background: `${bc.accent}30` }} />

                {/* Bottom decoration */}
                <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, height: 1, background: `${bc.accent}50` }} />
                <div style={{ position: 'absolute', bottom: 11, left: 10, right: 10, height: 1, background: `${bc.accent}30` }} />

                {/* Title (vertical) */}
                <div style={{
                    writingMode: 'vertical-rl', textOrientation: 'mixed',
                    fontFamily: "'Playfair Display', serif", fontSize: w > 40 ? 10 : 8,
                    fontWeight: 700, color: bc.accent, letterSpacing: 0.5,
                    textAlign: 'center', padding: '16px 0',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    maxHeight: h - 40,
                }}>
                    {spineTitle}
                </div>

                {/* Small emblem */}
                <div style={{
                    position: 'absolute', bottom: 16, fontSize: 10, color: `${bc.accent}80`,
                }}>⚜️</div>

                {/* Days badge */}
                <div style={{
                    position: 'absolute', top: 16, fontSize: 7, fontWeight: 800,
                    color: bc.accent, fontFamily: "'Crimson Text', serif",
                }}>{days}J</div>
            </div>

            {/* Page edges (right side) */}
            <div style={{
                position: 'absolute', right: -1, top: 3, bottom: 3, width: 3,
                background: 'repeating-linear-gradient(180deg, #F5F0E8 0px, #F5F0E8 1px, #E8E0D5 1px, #E8E0D5 2px)',
                borderRadius: '0 2px 2px 0',
            }} />
        </div>
    );
}

/* ═══ WOODEN SHELF ═══ */
function WoodenShelf({ children, label }: { children: React.ReactNode; label?: string }) {
    return (
        <div style={{ marginBottom: 0 }}>
            {label && (
                <div style={{
                    fontFamily: "'Crimson Text', serif", fontSize: 11, color: '#8B6B48',
                    letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700,
                    padding: '0 20px 6px', opacity: 0.6,
                }}>{label}</div>
            )}
            <div style={{ position: 'relative' }}>
                {/* Books container */}
                <div style={{
                    display: 'flex', alignItems: 'flex-end', gap: 6, padding: '0 20px',
                    minHeight: 160, paddingBottom: 8,
                }}>
                    {children}
                </div>

                {/* Shelf plank */}
                <div style={{
                    height: 18, borderRadius: '0 0 4px 4px',
                    background: 'linear-gradient(180deg, #8B6B48, #6B4F32, #5A4028)',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.35), inset 0 2px 0 rgba(255,255,255,0.1), inset 0 -2px 0 rgba(0,0,0,0.2)',
                    position: 'relative',
                }}>
                    {/* Wood grain */}
                    <div style={{
                        position: 'absolute', inset: 0, opacity: 0.15,
                        background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.1) 40px, rgba(0,0,0,0.1) 42px)',
                    }} />
                    {/* Front edge highlight */}
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
                        background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.15))',
                        borderRadius: '0 0 4px 4px',
                    }} />
                </div>

                {/* Shelf shadow on wall */}
                <div style={{
                    height: 12, background: 'linear-gradient(180deg, rgba(0,0,0,0.15), transparent)',
                    marginTop: -1,
                }} />
            </div>
        </div>
    );
}

/* ═══ DECORATIVE ITEMS ═══ */
function ShelfDecor({ type }: { type: string }) {
    const items: Record<string, React.ReactNode> = {
        plant: <div style={{ fontSize: 28, animation: 'floatSoft 4s ease-in-out infinite', alignSelf: 'flex-end' }}>🪴</div>,
        globe: <div style={{ fontSize: 24, animation: 'floatSoft 5s ease-in-out 1s infinite', alignSelf: 'flex-end' }}>🌍</div>,
        compass: <div style={{ fontSize: 22, animation: 'floatSoft 3.5s ease-in-out 0.5s infinite', alignSelf: 'flex-end' }}>🧭</div>,
        camera: <div style={{ fontSize: 22, alignSelf: 'flex-end' }}>📷</div>,
        coffee: <div style={{ fontSize: 20, alignSelf: 'flex-end' }}>☕</div>,
        map: <div style={{ fontSize: 24, alignSelf: 'flex-end' }}>🗺️</div>,
    };
    return <>{items[type] || null}</>;
}

/* ═══ YEAR DIVIDER ═══ */
function YearDivider({ year, count, isCurrentYear }: { year: string; count: number; isCurrentYear: boolean }) {
    const romanNumerals: Record<string, string> = {
        '2024': 'MMXXIV', '2025': 'MMXXV', '2026': 'MMXXVI', '2027': 'MMXXVII',
        '2028': 'MMXXVIII', '2029': 'MMXXIX', '2030': 'MMXXX',
    };
    const roman = romanNumerals[year] || year;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '28px 20px 8px',
            animation: 'shelfFadeIn 0.5s ease',
        }}>
            {/* Left ornament */}
            <div style={{
                flex: 1, height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(212,165,116,0.4), rgba(212,165,116,0.15))',
            }} />

            {/* Year plaque */}
            <div style={{
                position: 'relative', padding: '10px 28px', borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(139,107,72,0.2), rgba(90,64,40,0.15))',
                border: '1px solid rgba(212,165,116,0.2)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(212,165,116,0.1)',
                textAlign: 'center',
            }}>
                {/* Corner ornaments */}
                <div style={{ position: 'absolute', top: 4, left: 8, fontSize: 6, color: 'rgba(212,165,116,0.3)' }}>◆</div>
                <div style={{ position: 'absolute', top: 4, right: 8, fontSize: 6, color: 'rgba(212,165,116,0.3)' }}>◆</div>
                <div style={{ position: 'absolute', bottom: 4, left: 8, fontSize: 6, color: 'rgba(212,165,116,0.3)' }}>◆</div>
                <div style={{ position: 'absolute', bottom: 4, right: 8, fontSize: 6, color: 'rgba(212,165,116,0.3)' }}>◆</div>

                {/* Year number */}
                <div style={{
                    fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900,
                    color: '#D4A574', letterSpacing: 3,
                    textShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    lineHeight: 1,
                }}>
                    {year === 'Sans date' ? '—' : year}
                </div>

                {/* Roman numeral */}
                {year !== 'Sans date' && (
                    <div style={{
                        fontFamily: "'Crimson Text', serif", fontSize: 9, fontWeight: 600,
                        color: 'rgba(212,165,116,0.5)', letterSpacing: 3, marginTop: 2,
                    }}>
                        {roman}
                    </div>
                )}

                {/* Book count */}
                <div style={{
                    fontFamily: "'Crimson Text', serif", fontSize: 10,
                    color: 'rgba(139,107,72,0.7)', marginTop: 4,
                }}>
                    {count} voyage{count > 1 ? 's' : ''} {isCurrentYear ? '— en cours' : ''}
                </div>
            </div>

            {/* Right ornament */}
            <div style={{
                flex: 1, height: 1,
                background: 'linear-gradient(90deg, rgba(212,165,116,0.15), rgba(212,165,116,0.4), transparent)',
            }} />
        </div>
    );
}

/* ═══ MAIN PAGE ═══ */
export default function LibraryPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [guides, setGuides] = useState<any[]>([]);
    const [loadingGuides, setLoadingGuides] = useState(true);
    const [activeTab, setActiveTab] = useState<'bucketlist' | 'completed'>(
        (searchParams.get('tab') as any) || 'bucketlist'
    );
    const [pullingId, setPullingId] = useState<string | null>(null);
    const [openGuide, setOpenGuide] = useState<any>(null);

    useEffect(() => {
        if (!loading && !user) { router.push('/auth'); return; }
        if (user) fetchGuides();
    }, [user, loading]);

    const fetchGuides = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('ai_guides')
            .select('*')
            .eq('user_id', user!.id)
            .order('created_at', { ascending: false });
        if (!error && data) setGuides(data);
        setLoadingGuides(false);
    };

    const handleBookClick = useCallback((guide: any) => {
        setPullingId(guide.id);
        // Wait for pull animation then open
        setTimeout(() => {
            setOpenGuide(guide);
            setPullingId(null);
        }, 550);
    }, []);

    const bucketList = guides.filter(g => g.status === 'bucketlist' || (!g.status && g.status !== 'completed'));
    const completed = guides.filter(g => g.status === 'completed');
    const activeGuides = activeTab === 'bucketlist' ? bucketList : completed;

    // Group by year, then split into shelves (max 8 books per shelf)
    const groupedByYear: Record<string, any[]> = {};
    activeGuides.forEach(g => {
        const dateStr = g.trip_date || g.trip_end_date || g.created_at;
        const year = dateStr ? new Date(dateStr).getFullYear().toString() : 'Sans date';
        if (!groupedByYear[year]) groupedByYear[year] = [];
        groupedByYear[year].push(g);
    });

    // Sort years: for bucket list newest first, for completed newest first too
    const sortedYears = Object.keys(groupedByYear).sort((a, b) => {
        if (a === 'Sans date') return 1;
        if (b === 'Sans date') return -1;
        return parseInt(b) - parseInt(a);
    });

    // For each year, split into shelves of max 8
    const yearShelves: { year: string; shelves: any[][] }[] = sortedYears.map(year => {
        const books = groupedByYear[year];
        const shelves: any[][] = [];
        for (let i = 0; i < books.length; i += 8) {
            shelves.push(books.slice(i, i + 8));
        }
        return { year, shelves };
    });

    // Loading state
    if (loading || loadingGuides) return (
        <div style={{ minHeight: '100vh', background: '#2A1F14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <style>{SHELF_CSS}</style>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16, animation: 'floatSoft 2s ease-in-out infinite' }}>📚</div>
                <p style={{ color: '#8B6B48', fontSize: 14, fontFamily: "'Crimson Text', serif" }}>Chargement de ta bibliothèque...</p>
            </div>
        </div>
    );

    // If a book is open, show the TravelBook
    if (openGuide) {
        return (
            <TravelBook
                guide={openGuide.guide_data}
                region={openGuide.destination}
                guideId={openGuide.id}
                onClose={() => setOpenGuide(null)}
                onBucketList={async () => {
                    try { await fetch("/api/guide/bucketlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guide_id: openGuide.id, action: "add" }) }); } catch { }
                }}
                onComplete={async () => {
                    try {
                        await fetch("/api/guide/bucketlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guide_id: openGuide.id, action: "complete" }) });
                        setGuides(prev => prev.map(g => g.id === openGuide.id ? { ...g, status: 'completed' } : g));
                        setOpenGuide(null);
                    } catch { }
                }}
            />
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #2A1F14 0%, #1E1610 50%, #15100A 100%)',
            fontFamily: "'Fredoka', sans-serif",
        }}>
            <style>{SHELF_CSS}</style>

            {/* Header */}
            <div style={{
                padding: '24px 32px 16px',
                borderBottom: '1px solid rgba(139,107,72,0.15)',
                background: 'linear-gradient(180deg, rgba(139,107,72,0.08), transparent)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <button onClick={() => router.push('/')} style={{
                            background: 'none', border: 'none', color: '#8B6B48', fontSize: 12,
                            fontWeight: 600, cursor: 'pointer', fontFamily: "'Crimson Text', serif",
                            marginBottom: 6, letterSpacing: 1,
                        }}>← Retour à la carte</button>
                        <h1 style={{
                            fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900,
                            color: '#D4A574', margin: 0,
                            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        }}>📚 Ma Bibliothèque</h1>
                    </div>
                    <button onClick={() => router.push('/')} style={{
                        padding: '10px 22px', borderRadius: 100, border: '2px solid #8B6B48',
                        background: 'transparent', color: '#D4A574',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        fontFamily: "'Playfair Display', serif",
                        transition: 'all 0.2s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#8B6B48'; e.currentTarget.style.color = '#F5F0E8'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#D4A574'; }}>
                        ⚜️ Nouveau voyage
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, marginTop: 16 }}>
                    <button onClick={() => setActiveTab('bucketlist')} style={{
                        padding: '8px 20px', borderRadius: '12px 12px 0 0', border: 'none',
                        background: activeTab === 'bucketlist' ? 'rgba(139,107,72,0.2)' : 'transparent',
                        color: activeTab === 'bucketlist' ? '#D4A574' : '#6B5540',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        fontFamily: "'Crimson Text', serif",
                        borderBottom: activeTab === 'bucketlist' ? '2px solid #D4A574' : '2px solid transparent',
                        transition: 'all 0.2s',
                    }}>
                        🪣 Bucket List ({bucketList.length})
                    </button>
                    <button onClick={() => setActiveTab('completed')} style={{
                        padding: '8px 20px', borderRadius: '12px 12px 0 0', border: 'none',
                        background: activeTab === 'completed' ? 'rgba(139,107,72,0.2)' : 'transparent',
                        color: activeTab === 'completed' ? '#D4A574' : '#6B5540',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        fontFamily: "'Crimson Text', serif",
                        borderBottom: activeTab === 'completed' ? '2px solid #D4A574' : '2px solid transparent',
                        transition: 'all 0.2s',
                    }}>
                        ✅ Voyages complétés ({completed.length})
                    </button>
                </div>
            </div>

            {/* Bookshelf area */}
            <div className="shelf-scroll" style={{
                height: 'calc(100vh - 150px)', overflowY: 'auto', padding: '24px 0',
                background: `
                    radial-gradient(ellipse at 30% 20%, rgba(139,107,72,0.06) 0%, transparent 60%),
                    radial-gradient(ellipse at 70% 60%, rgba(139,107,72,0.04) 0%, transparent 50%)
                `,
            }}>
                {activeGuides.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                        <div style={{ fontSize: 56, marginBottom: 20, animation: 'floatSoft 3s ease-in-out infinite' }}>
                            {activeTab === 'bucketlist' ? '🪣' : '📚'}
                        </div>
                        <h3 style={{
                            fontFamily: "'Playfair Display', serif", color: '#8B6B48',
                            fontSize: 22, fontWeight: 700, marginBottom: 8,
                        }}>
                            {activeTab === 'bucketlist' ? 'Ta Bucket List est vide' : 'Aucun voyage complété'}
                        </h3>
                        <p style={{
                            fontFamily: "'Crimson Text', serif", color: '#6B5540',
                            fontSize: 14, marginBottom: 24,
                        }}>
                            {activeTab === 'bucketlist'
                                ? "Crée ton premier itinéraire et planifie ton prochain voyage!"
                                : "Tes voyages complétés apparaîtront ici comme des souvenirs."
                            }
                        </p>
                        <WoodenShelf>
                            <ShelfDecor type="plant" />
                            <ShelfDecor type="globe" />
                            <ShelfDecor type="compass" />
                            <ShelfDecor type="map" />
                            <ShelfDecor type="coffee" />
                        </WoodenShelf>
                        <button onClick={() => router.push('/')} style={{
                            marginTop: 16, padding: '12px 28px', borderRadius: 100,
                            border: '2px solid #8B6B48', background: 'transparent',
                            color: '#D4A574', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                            fontFamily: "'Playfair Display', serif",
                        }}>⚜️ Planifier un voyage</button>
                    </div>
                ) : (
                    <>
                        {yearShelves.map(({ year, shelves }, yearIdx) => {
                            const currentYear = new Date().getFullYear().toString();
                            let globalBookIdx = 0;
                            // Count books before this year group for color indexing
                            for (let y = 0; y < yearIdx; y++) {
                                yearShelves[y].shelves.forEach(s => { globalBookIdx += s.length; });
                            }

                            return (
                                <div key={year}>
                                    {/* Year divider */}
                                    <YearDivider
                                        year={year}
                                        count={shelves.reduce((acc, s) => acc + s.length, 0)}
                                        isCurrentYear={year === currentYear}
                                    />

                                    {/* Shelves for this year */}
                                    {shelves.map((shelfBooks, shelfIdx) => {
                                        const startIdx = globalBookIdx;
                                        globalBookIdx += shelfBooks.length;
                                        return (
                                            <WoodenShelf key={`${year}-${shelfIdx}`}>
                                                {shelfIdx === 0 && yearIdx === 0 && <ShelfDecor type="plant" />}
                                                {shelfBooks.map((g, bookIdx) => (
                                                    <ShelfBook
                                                        key={g.id}
                                                        guide={g}
                                                        index={startIdx + bookIdx}
                                                        isPulling={pullingId === g.id}
                                                        onClick={() => handleBookClick(g)}
                                                    />
                                                ))}
                                                {shelfIdx === 0 && shelfBooks.length < 6 && <ShelfDecor type={yearIdx % 2 === 0 ? "globe" : "compass"} />}
                                            </WoodenShelf>
                                        );
                                    })}
                                </div>
                            );
                        })}

                        {/* Extra empty shelf for ambiance */}
                        <WoodenShelf>
                            <ShelfDecor type="camera" />
                            <ShelfDecor type="coffee" />
                            <ShelfDecor type="map" />
                        </WoodenShelf>
                    </>
                )}
            </div>
        </div>
    );
}
