'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useRouter } from 'next/navigation';

const PREF_CATEGORIES = [
    { id: 'culture', icon: '🏛', label: 'Culture & histoire' },
    { id: 'food', icon: '🍽', label: 'Gastronomie' },
    { id: 'adventure', icon: '🤿', label: 'Aventure & sport' },
    { id: 'nature', icon: '🌿', label: 'Nature & paysages' },
    { id: 'nightlife', icon: '🌙', label: 'Vie nocturne' },
    { id: 'shopping', icon: '🛍', label: 'Shopping' },
    { id: 'relax', icon: '🧘', label: 'Détente & bien-être' },
    { id: 'photo', icon: '📸', label: 'Spots photo' },
];

const BUDGET_OPTIONS = [
    { id: 'budget', icon: '🎒', label: 'Backpacker' },
    { id: 'moderate', icon: '🏨', label: 'Modéré' },
    { id: 'luxury', icon: '✨', label: 'Luxe' },
];

const SWAP_REASONS = [
    { v: 'trop_cher', i: '💸', l: 'Trop cher' },
    { v: 'pas_genre', i: '🙅', l: 'Pas mon genre' },
    { v: 'deja_fait', i: '✅', l: 'Déjà fait' },
    { v: 'access', i: '♿', l: 'Pas accessible' },
    { v: 'intense', i: '🔥', l: 'Plus intense' },
    { v: 'calme', i: '🌿', l: 'Plus calme' },
];

const DCOL = ['#2E7DDB', '#0E9AA7', '#F5A623', '#E84855', '#7C3AED', '#059669', '#DB2777'];

interface GuidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    deal: any;
}

export default function GuidePanel({ isOpen, onClose, deal }: GuidePanelProps) {
    const { user, profile } = useAuth();
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [step, setStep] = useState<'prefs' | 'loading' | 'result' | 'limit'>('prefs');
    const [prefs, setPrefs] = useState<string[]>([]);
    const [budget, setBudget] = useState('moderate');
    const [restDays, setRestDays] = useState(1);
    const [guide, setGuide] = useState<any>(null);
    const [guideId, setGuideId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [expandedDay, setExpandedDay] = useState<number>(0);
    const [isMobile, setIsMobile] = useState(false);
    // Swap state
    const [swap, setSwap] = useState<any>(null);
    const [swapAlts, setSwapAlts] = useState<any[] | null>(null);
    const [swapLoading, setSwapLoading] = useState(false);
    // Ratings
    const [ratings, setRatings] = useState<Record<string, number>>({});

    useEffect(() => { setIsMobile(window.innerWidth <= 768); }, []);
    useEffect(() => {
        if (isOpen) {
            setStep('prefs'); setPrefs([]); setBudget('moderate');
            setRestDays(1); setGuide(null); setGuideId(null); setError('');
            setExpandedDay(0); setSwap(null); setSwapAlts(null); setRatings({});
        }
    }, [isOpen]);

    if (!isOpen || !deal) return null;

    const city = deal.city || deal.destination || '';
    const code = deal.destination_code || deal.code || '';

    let nights = 7;
    if (deal.departure_date && deal.return_date) {
        nights = Math.round((new Date(deal.return_date).getTime() - new Date(deal.departure_date).getTime()) / (1000 * 60 * 60 * 24));
    }

    const togglePref = (id: string) => setPrefs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

    const handleGenerate = async () => {
        if (!user) { router.push('/auth'); return; }
        setStep('loading'); setError('');
        try {
            const res = await fetch('/api/guide/generate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination: city, destination_code: code, country: deal.country,
                    departure_date: deal.departure_date, return_date: deal.return_date,
                    price: deal.price, airline: deal.airline, stops: deal.stops,
                    preferences: prefs.map(p => PREF_CATEGORIES.find(c => c.id === p)?.label || p),
                    rest_days: restDays, budget_style: budget,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.error === 'limit_reached') { setStep('limit'); return; }
                setError(data.message || data.error || 'Erreur'); setStep('prefs'); return;
            }
            setGuide(data.guide); setGuideId(data.guide_id); setStep('result');
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
        } catch { setError('Erreur de connexion.'); setStep('prefs'); }
    };

    const handleSwap = async (dayIdx: number, slot: string, reason: string) => {
        setSwapLoading(true); setSwapAlts(null);
        const day = guide.days[dayIdx];
        const original = day[slot];
        try {
            const res = await fetch('/api/guide/swap', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guide_id: guideId, destination: city, country: deal.country,
                    day_number: dayIdx + 1, slot, reason,
                    original_activity: original, budget_style: budget,
                }),
            });
            const data = await res.json();
            if (res.ok && data.alternatives) { setSwapAlts(data.alternatives); }
            else { setSwap(null); }
        } catch { setSwap(null); }
        setSwapLoading(false);
    };

    const confirmSwap = (dayIdx: number, slot: string, alt: any) => {
        setGuide((prev: any) => {
            const u = JSON.parse(JSON.stringify(prev));
            u.days[dayIdx][slot] = alt;
            return u;
        });
        // Save the confirmed swap
        fetch('/api/guide/feedback', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                guide_id: guideId, destination: city, day_number: swap.dayIdx + 1,
                slot: swap.slot, action: 'swap_confirm', swap_reason: swap.reason,
                original_activity: swap.original, replacement_activity: alt,
            }),
        }).catch(() => { });
        setSwap(null); setSwapAlts(null);
    };

    const handleRate = (dayIdx: number, slot: string, stars: number) => {
        const key = `${dayIdx}-${slot}`;
        setRatings(p => ({ ...p, [key]: stars }));
        fetch('/api/guide/feedback', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                guide_id: guideId, destination: city, day_number: dayIdx + 1,
                slot, action: 'rate', rating: stars,
                original_activity: guide.days[dayIdx]?.[slot],
            }),
        }).catch(() => { });
    };

    // ── ACTIVITY BLOCK (morning, afternoon, evening) ──
    const ActivityBlock = ({ data, label, icon, dayIdx, slot, color }: any) => {
        if (!data) return null;
        const rKey = `${dayIdx}-${slot}`;
        return (
            <div style={{ padding: '10px 12px', borderRadius: 12, background: 'white', border: '1px solid rgba(46,125,219,0.04)', marginBottom: 4 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase' as const }}>{label} · {data.duration || ''}</span>
                            <span style={{ fontSize: 11, fontWeight: 700 }}>{data.cost || 0}$</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F1D2F' }}>{data.activity}</div>
                        {data.location && <div style={{ fontSize: 11, color: '#5A6B80' }}>📍 {data.location}</div>}
                        {data.description && <div style={{ fontSize: 11, color: '#5A6B80', marginTop: 2 }}>{data.description}</div>}
                        {data.tip && <div style={{ fontSize: 10, color: '#8A9AB5', fontStyle: 'italic', marginTop: 2 }}>💡 {data.tip}</div>}
                        {data.rating && <div style={{ fontSize: 10, color: '#F5A623', marginTop: 2 }}>{data.rating}</div>}
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(0,0,0,0.03)', marginLeft: 42 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <button key={s} onClick={() => handleRate(dayIdx, slot, s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, opacity: (ratings[rKey] || 0) >= s ? 1 : 0.2, transition: 'opacity 0.15s' }}>⭐</button>
                        ))}
                    </div>
                    <button onClick={() => { setSwap({ dayIdx, slot, original: data, step: 'reason' }); setSwapAlts(null); }}
                        style={{ padding: '2px 7px', borderRadius: 100, border: `1px solid ${color}20`, background: 'transparent', color, fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: "'Fredoka',sans-serif" }}>🔄</button>
                </div>
            </div>
        );
    };

    // ── MEAL BLOCK (lunch, dinner) ──
    const MealBlock = ({ data, label, icon, dayIdx, slot, color }: any) => {
        if (!data) return null;
        const rKey = `${dayIdx}-${slot}`;
        return (
            <div style={{ padding: '10px 12px', borderRadius: 12, background: `${color}06`, border: `1px solid ${color}10`, marginBottom: 4 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase' as const }}>{label}</span>
                            <span style={{ fontSize: 11, fontWeight: 700 }}>{data.cost || 0}$</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F1D2F' }}>{data.name}</div>
                        <div style={{ fontSize: 11, color: '#5A6B80' }}>{data.type} {data.location ? `· 📍 ${data.location}` : ''}</div>
                        {data.must_try && <div style={{ fontSize: 10, color, fontWeight: 600, marginTop: 2 }}>🍴 {data.must_try}</div>}
                        {data.rating && <div style={{ fontSize: 10, color: '#F5A623', marginTop: 2 }}>{data.rating}</div>}
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(0,0,0,0.03)', marginLeft: 42 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <button key={s} onClick={() => handleRate(dayIdx, slot, s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, opacity: (ratings[rKey] || 0) >= s ? 1 : 0.2, transition: 'opacity 0.15s' }}>⭐</button>
                        ))}
                    </div>
                    <button onClick={() => { setSwap({ dayIdx, slot, original: data, step: 'reason' }); setSwapAlts(null); }}
                        style={{ padding: '2px 7px', borderRadius: 100, border: `1px solid ${color}20`, background: 'transparent', color, fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: "'Fredoka',sans-serif" }}>🔄</button>
                </div>
            </div>
        );
    };

    // ── DIRECTIONS BLOCK ──
    const DirectionsBlock = ({ data }: { data: any }) => {
        if (!data) return null;
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px 4px 54px', marginBottom: 2 }}>
                <div style={{ width: 1, height: 16, background: 'rgba(46,125,219,0.1)' }} />
                <div style={{ fontSize: 10, color: '#8A9AB5' }}>
                    {data.mode} <strong>{data.duration}</strong> {data.distance ? `(${data.distance})` : ''} {data.directions ? `— ${data.directions}` : ''}
                </div>
            </div>
        );
    };

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 1100 }} />
            <div ref={scrollRef} style={{
                position: 'fixed',
                ...(isMobile ? { bottom: 0, left: 0, right: 0, maxHeight: '92vh', borderTopLeftRadius: 24, borderTopRightRadius: 24 }
                    : { top: 0, right: 0, width: 460, height: '100vh' }),
                background: '#F8FAFF', zIndex: 1101, overflowY: 'auto', overflowX: 'hidden',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: isMobile ? '0 -8px 30px rgba(0,0,0,0.2)' : '-6px 0 30px rgba(0,0,0,0.15)',
            }}>
                <style>{`
                    @keyframes gFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
                    @keyframes gPulse{0%,100%{opacity:1}50%{opacity:0.5}}
                `}</style>

                {/* ── HEADER ── */}
                <div style={{ background: 'linear-gradient(135deg, #0F1A2A, #1B2D4F)', padding: '20px 24px', position: 'relative' }}>
                    {isMobile && <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} /></div>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 22 }}>🤖</span>
                                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'white', fontFamily: "'Fredoka', sans-serif" }}>Guide GeaiAI</h2>
                            </div>
                            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                                Itinéraire pour <strong style={{ color: '#60A5FA' }}>{city}</strong>
                            </p>
                        </div>
                        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                    <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[deal.price && `${deal.price}$`, `${nights} nuits`, deal.airline, deal.stops === 0 ? 'Direct' : deal.stops && `${deal.stops} escale`].filter(Boolean).map((tag, i) => (
                            <span key={i} style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: 100 }}>{tag}</span>
                        ))}
                    </div>
                </div>

                <div style={{ padding: '20px 16px 32px' }}>

                    {/* ═══ PREFS ═══ */}
                    {step === 'prefs' && (<>
                        {error && <div style={{ padding: '10px 14px', borderRadius: 12, marginBottom: 16, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 13, color: '#DC2626' }}>{error}</div>}
                        {!user && (
                            <div style={{ padding: '14px 16px', borderRadius: 14, marginBottom: 16, background: 'linear-gradient(135deg,#F0F7FF,#EEF2FF)', border: '1px solid rgba(46,125,219,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 20 }}>🔒</span>
                                <div><div style={{ fontSize: 13, fontWeight: 700, color: '#1A2B42' }}>Connecte-toi</div><div style={{ fontSize: 11, color: '#5A7089' }}>Premier guide gratuit!</div></div>
                                <a href="/auth" style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 100, background: '#2E7DDB', color: 'white', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>Go</a>
                            </div>
                        )}
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A2B42', margin: '0 0 10px' }}>Qu'est-ce qui t'intéresse?</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
                            {PREF_CATEGORIES.map(c => {
                                const sel = prefs.includes(c.id);
                                return (<button key={c.id} onClick={() => togglePref(c.id)} style={{ padding: '12px 14px', borderRadius: 14, cursor: 'pointer', border: sel ? '2px solid #2E7DDB' : '1px solid rgba(26,43,66,0.08)', background: sel ? '#F0F7FF' : 'white', textAlign: 'left' }}>
                                    <div style={{ fontSize: 18 }}>{c.icon}</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: sel ? '#2E7DDB' : '#1A2B42' }}>{c.label}</div>
                                </button>);
                            })}
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A2B42', margin: '0 0 10px' }}>Budget</h3>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                            {BUDGET_OPTIONS.map(o => {
                                const sel = budget === o.id;
                                return (<button key={o.id} onClick={() => setBudget(o.id)} style={{ flex: 1, padding: '12px 10px', borderRadius: 14, cursor: 'pointer', border: sel ? '2px solid #2E7DDB' : '1px solid rgba(26,43,66,0.08)', background: sel ? '#F0F7FF' : 'white', textAlign: 'center' }}>
                                    <div style={{ fontSize: 20 }}>{o.icon}</div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: sel ? '#2E7DDB' : '#1A2B42' }}>{o.label}</div>
                                </button>);
                            })}
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A2B42', margin: '0 0 10px' }}>Jours de repos: <span style={{ color: '#2E7DDB' }}>{restDays}</span></h3>
                        <input type="range" min="0" max={Math.max(Math.floor(nights / 3), 1)} value={restDays} onChange={e => setRestDays(Number(e.target.value))} style={{ width: '100%', accentColor: '#2E7DDB', marginBottom: 28 }} />
                        <button onClick={handleGenerate} disabled={prefs.length === 0} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '16px 0', borderRadius: 16, border: 'none',
                            background: prefs.length > 0 ? 'linear-gradient(135deg,#2E7DDB,#1B5BA0)' : '#E2E8F0',
                            color: prefs.length > 0 ? 'white' : '#94A3B8', fontSize: 15, fontWeight: 700, cursor: prefs.length > 0 ? 'pointer' : 'not-allowed', fontFamily: "'Fredoka',sans-serif",
                        }}>🤖 Générer mon Guide GeaiAI</button>
                    </>)}

                    {/* ═══ LOADING ═══ */}
                    {step === 'loading' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', textAlign: 'center' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#F0F7FF,#EEF2FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, animation: 'gFloat 2s ease-in-out infinite' }}><span style={{ fontSize: 30 }}>🤖</span></div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A2B42', margin: '0 0 8px', fontFamily: "'Fredoka',sans-serif" }}>GeaiAI crée ton itinéraire...</h3>
                            <p style={{ fontSize: 13, color: '#8FA3B8' }}>Recherche des meilleurs spots à {city}</p>
                            <div style={{ display: 'flex', gap: 6, marginTop: 24 }}>{[0, 1, 2].map(i => (<div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#2E7DDB', animation: `gPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />))}</div>
                        </div>
                    )}

                    {/* ═══ LIMIT ═══ */}
                    {step === 'limit' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', textAlign: 'center' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                            <h3 style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Fredoka',sans-serif" }}>Guide GeaiAI gratuit utilisé!</h3>
                            <p style={{ fontSize: 14, color: '#5A7089', margin: '10px 0 24px' }}>Passe à Premium pour des guides illimités.</p>
                            <a href="/pricing" style={{ padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', color: 'white', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>⚡ Plans Premium</a>
                            <button onClick={onClose} style={{ marginTop: 14, background: 'none', border: 'none', color: '#8FA3B8', fontSize: 13, cursor: 'pointer' }}>Plus tard</button>
                        </div>
                    )}

                    {/* ═══ RESULT ═══ */}
                    {step === 'result' && guide && (<>
                        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1A2B42', margin: '0 0 6px', fontFamily: "'Fredoka',sans-serif" }}>{guide.title || `Ton voyage à ${city}`}</h3>
                        <p style={{ fontSize: 12, color: '#5A7089', margin: '0 0 16px', lineHeight: 1.5 }}>{guide.summary}</p>

                        {/* Accommodation */}
                        {guide.accommodation && (
                            <div style={{ padding: '12px 14px', borderRadius: 14, marginBottom: 12, background: 'rgba(46,125,219,0.03)', border: '1px solid rgba(46,125,219,0.08)' }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <span style={{ fontSize: 20 }}>🏨</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: '#2E7DDB', textTransform: 'uppercase' as const }}>HÉBERGEMENT</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1D2F' }}>{guide.accommodation.name}</div>
                                        <div style={{ fontSize: 11, color: '#5A6B80' }}>{guide.accommodation.type} · {guide.accommodation.neighborhood}</div>
                                        {guide.accommodation.address && <div style={{ fontSize: 10, color: '#8A9AB5' }}>📍 {guide.accommodation.address}</div>}
                                        {guide.accommodation.tip && <div style={{ fontSize: 10, color: '#2E7DDB', marginTop: 2 }}>💡 {guide.accommodation.tip}</div>}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: '#2E7DDB' }}>{guide.accommodation.price_per_night}$</div>
                                        <div style={{ fontSize: 9, color: '#8A9AB5' }}>/nuit</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Budget summary */}
                        {guide.budget_summary && (
                            <div style={{ padding: '12px 14px', borderRadius: 14, marginBottom: 12, background: '#FAFBFD', border: '1px solid rgba(26,43,66,0.06)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#1A2B42', marginBottom: 8 }}>💰 Budget total estimé</div>
                                {[
                                    ['✈️ Vol', guide.budget_summary.flight],
                                    ['🏨 Hébergement', guide.budget_summary.accommodation_total],
                                    ['🍽 Repas', guide.budget_summary.food_total],
                                    ['🎯 Activités', guide.budget_summary.activities_total],
                                    ['🚕 Transport', guide.budget_summary.transport_local_total],
                                ].map(([l, v]) => (
                                    <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid rgba(26,43,66,0.03)' }}>
                                        <span style={{ color: '#5A7089' }}>{l}</span><span style={{ fontWeight: 600 }}>{v}$</span>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, marginTop: 6, paddingTop: 6, borderTop: '2px solid rgba(46,125,219,0.15)' }}>
                                    <span>Total</span><span style={{ color: '#2E7DDB' }}>~{guide.budget_summary.total_per_person}$ CAD</span>
                                </div>
                            </div>
                        )}

                        {/* Highlights */}
                        {guide.highlights?.length > 0 && (
                            <div style={{ padding: '12px 14px', borderRadius: 14, marginBottom: 16, background: 'linear-gradient(135deg,#F0F7FF,#EEF2FF)', border: '1px solid rgba(46,125,219,0.1)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#2E7DDB', marginBottom: 6 }}>✨ Points forts</div>
                                {guide.highlights.map((h: string, i: number) => (<div key={i} style={{ fontSize: 12, color: '#1A2B42', marginBottom: 3 }}>→ {h}</div>))}
                            </div>
                        )}

                        {/* ── DAY BY DAY ── */}
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A2B42', margin: '0 0 10px' }}>📅 Itinéraire jour par jour</h3>

                        {(guide.days || []).map((day: any, i: number) => {
                            const isExp = expandedDay === i;
                            const col = DCOL[i % DCOL.length];
                            return (
                                <div key={i} style={{ marginBottom: 6, borderRadius: 14, overflow: 'hidden', border: `1px solid ${isExp ? col + '20' : 'rgba(26,43,66,0.04)'}`, background: isExp ? '#FAFBFD' : 'white' }}>
                                    <button onClick={() => setExpandedDay(isExp ? -1 : i)} style={{ width: '100%', padding: '12px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ width: 28, height: 28, borderRadius: 10, background: isExp ? col : '#F0F4F8', color: isExp ? 'white' : '#5A7089', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{day.day || i + 1}</span>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F1D2F' }}>{day.title}</div>
                                                <div style={{ fontSize: 10, color: '#8FA3B8' }}>{day.theme} {day.total_cost ? `· ${day.total_cost}$` : ''}</div>
                                            </div>
                                        </div>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8FA3B8" strokeWidth="2.5" style={{ transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M6 9l6 6 6-6" /></svg>
                                    </button>

                                    {isExp && (
                                        <div style={{ padding: '0 10px 12px' }}>
                                            <ActivityBlock data={day.morning} label="Matin" icon="🌅" dayIdx={i} slot="morning" color={col} />
                                            <DirectionsBlock data={day.getting_to_lunch} />
                                            <MealBlock data={day.lunch} label="Dîner (midi)" icon="🥗" dayIdx={i} slot="lunch" color="#0E9AA7" />
                                            <DirectionsBlock data={day.getting_to_afternoon} />
                                            <ActivityBlock data={day.afternoon} label="Après-midi" icon="☀️" dayIdx={i} slot="afternoon" color={col} />
                                            <DirectionsBlock data={day.getting_to_dinner} />
                                            <MealBlock data={day.dinner} label="Souper" icon="🍽️" dayIdx={i} slot="dinner" color="#7C3AED" />
                                            <ActivityBlock data={day.evening} label="Soirée" icon="🌙" dayIdx={i} slot="evening" color={col} />
                                            <DirectionsBlock data={day.getting_back_hotel} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Tips */}
                        {guide.region_tips && (
                            <div style={{ padding: '12px 14px', borderRadius: 14, marginTop: 14, background: '#F0FDF4', border: '1px solid rgba(22,163,74,0.1)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', marginBottom: 4 }}>🤫 Tips locaux</div>
                                <div style={{ fontSize: 12, color: '#1A2B42' }}>{guide.region_tips}</div>
                            </div>
                        )}
                        {guide.packing_list?.length > 0 && (
                            <div style={{ padding: '12px 14px', borderRadius: 14, marginTop: 10, background: 'rgba(5,150,105,0.02)', border: '1px solid rgba(5,150,105,0.06)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginBottom: 4 }}>🎒 À ne pas oublier</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {guide.packing_list.map((it: string, j: number) => (<span key={j} style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(5,150,105,0.05)', fontSize: 10, fontWeight: 600, color: '#059669' }}>{it}</span>))}
                                </div>
                            </div>
                        )}

                        <button onClick={onClose} style={{ display: 'block', width: '100%', marginTop: 20, padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#2E7DDB,#1B5BA0)', color: 'white', fontSize: 14, fontWeight: 700, fontFamily: "'Fredoka',sans-serif" }}>
                            ✈️ Réserver ce vol
                        </button>
                    </>)}
                </div>
            </div>

            {/* ═══ SWAP MODAL ═══ */}
            {swap && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) { setSwap(null); setSwapAlts(null); } }}>
                    <div style={{ width: '100%', maxWidth: 380, background: '#F8FAFF', borderRadius: 18, padding: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>

                        {/* Step 1: Choose reason */}
                        {swap.step === 'reason' && !swapLoading && !swapAlts && (<>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F1D2F', textAlign: 'center', marginBottom: 12 }}>Pourquoi changer?</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {SWAP_REASONS.map(r => (
                                    <button key={r.v} onClick={() => { setSwap((p: any) => ({ ...p, reason: r.v, step: 'loading' })); handleSwap(swap.dayIdx, swap.slot, r.v); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 11, border: '1px solid rgba(46,125,219,0.05)', background: 'white', cursor: 'pointer', fontFamily: "'Fredoka',sans-serif", fontSize: 12.5, fontWeight: 600, color: '#0F1D2F' }}>
                                        <span style={{ fontSize: 16 }}>{r.i}</span>{r.l}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => { setSwap(null); setSwapAlts(null); }} style={{ display: 'block', margin: '10px auto 0', padding: '4px 12px', borderRadius: 100, border: 'none', background: 'rgba(0,0,0,0.03)', color: '#5A6B80', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                        </>)}

                        {/* Step 2: Loading */}
                        {swapLoading && (
                            <div style={{ textAlign: 'center', padding: '30px 0' }}>
                                <div style={{ fontSize: 30, animation: 'gFloat 1.5s ease-in-out infinite', marginBottom: 10 }}>🤖</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1D2F' }}>GeaiAI cherche des alternatives...</div>
                            </div>
                        )}

                        {/* Step 3: Show alternatives */}
                        {swapAlts && swapAlts.length > 0 && (<>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F1D2F', textAlign: 'center', marginBottom: 10 }}>3 alternatives</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                {swapAlts.map((a: any, j: number) => (
                                    <button key={j} onClick={() => confirmSwap(swap.dayIdx, swap.slot, a)}
                                        style={{ padding: '11px', borderRadius: 13, border: '1.5px solid rgba(46,125,219,0.04)', background: 'white', cursor: 'pointer', textAlign: 'left', fontFamily: "'Fredoka',sans-serif", transition: 'all 0.2s' }}
                                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#2E7DDB')}
                                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(46,125,219,0.04)')}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F1D2F' }}>{a.activity || a.name}</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#2E7DDB' }}>{a.cost}$</span>
                                        </div>
                                        <div style={{ fontSize: 10.5, color: '#5A6B80' }}>📍 {a.location} {a.duration ? `· ${a.duration}` : ''} {a.rating || ''}</div>
                                        {a.why && <div style={{ fontSize: 10, color: '#2E7DDB', marginTop: 2 }}>→ {a.why}</div>}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => { setSwap(null); setSwapAlts(null); }} style={{ display: 'block', margin: '10px auto 0', padding: '4px 12px', borderRadius: 100, border: 'none', background: 'rgba(0,0,0,0.03)', color: '#5A6B80', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Garder l'original</button>
                        </>)}
                    </div>
                </div>
            )}
        </>
    );
}
