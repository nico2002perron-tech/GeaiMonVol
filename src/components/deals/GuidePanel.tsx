'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useRouter } from 'next/navigation';

const PREF_CATEGORIES = [
    { id: 'culture', icon: '🏛', label: 'Culture & histoire', desc: 'Musées, monuments, sites historiques' },
    { id: 'food', icon: '🍽', label: 'Gastronomie', desc: 'Restaurants locaux, street food, marchés' },
    { id: 'adventure', icon: '🤿', label: 'Aventure & sport', desc: 'Randonnée, plongée, vélo, escalade' },
    { id: 'nature', icon: '🌿', label: 'Nature & paysages', desc: 'Parcs, plages, points de vue' },
    { id: 'nightlife', icon: '🌙', label: 'Vie nocturne', desc: 'Bars, rooftops, spectacles' },
    { id: 'shopping', icon: '🛍', label: 'Shopping', desc: 'Marchés locaux, boutiques, souvenirs' },
    { id: 'relax', icon: '🧘', label: 'Détente & bien-être', desc: 'Spas, hammams, journées tranquilles' },
    { id: 'photo', icon: '📸', label: 'Spots photo', desc: 'Endroits mémorables pour des photos' },
];

const BUDGET_OPTIONS = [
    { id: 'budget', icon: '🎒', label: 'Backpacker', desc: 'Hostels, street food' },
    { id: 'moderate', icon: '🏨', label: 'Modéré', desc: 'Hôtels 3★, restos locaux' },
    { id: 'luxury', icon: '✨', label: 'Luxe', desc: 'Hôtels 4-5★, gastronomie' },
];

interface GuidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    deal: {
        city?: string;
        destination?: string;
        destination_code?: string;
        code?: string;
        country?: string;
        price?: number;
        airline?: string;
        stops?: number;
        departure_date?: string;
        return_date?: string;
    } | null;
}

export default function GuidePanel({ isOpen, onClose, deal }: GuidePanelProps) {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState<'prefs' | 'loading' | 'result' | 'limit'>('prefs');
    const [prefs, setPrefs] = useState<string[]>([]);
    const [budget, setBudget] = useState('moderate');
    const [restDays, setRestDays] = useState(1);
    const [guide, setGuide] = useState<any>(null);
    const [error, setError] = useState('');
    const [expandedDay, setExpandedDay] = useState<number | null>(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(window.innerWidth <= 768);
    }, []);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setStep('prefs');
            setPrefs([]);
            setBudget('moderate');
            setRestDays(1);
            setGuide(null);
            setError('');
            setExpandedDay(0);
        }
    }, [isOpen]);

    if (!isOpen || !deal) return null;

    const city = deal.city || deal.destination || '';
    const code = deal.destination_code || deal.code || '';

    const togglePref = (id: string) => {
        setPrefs(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const handleGenerate = async () => {
        if (!user) {
            router.push('/auth');
            return;
        }

        setStep('loading');
        setError('');

        try {
            const res = await fetch('/api/guide/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination: city,
                    destination_code: code,
                    country: deal.country,
                    departure_date: deal.departure_date,
                    return_date: deal.return_date,
                    price: deal.price,
                    airline: deal.airline,
                    stops: deal.stops,
                    preferences: prefs.map(p => PREF_CATEGORIES.find(c => c.id === p)?.label || p),
                    rest_days: restDays,
                    budget_style: budget,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.error === 'limit_reached') {
                    setStep('limit');
                    return;
                }
                setError(data.message || data.error || 'Erreur lors de la génération.');
                setStep('prefs');
                return;
            }

            setGuide(data.guide);
            setStep('result');
        } catch (err) {
            setError('Erreur de connexion. Réessaie.');
            setStep('prefs');
        }
    };

    // ── Nights calculation ──
    let nights = 7;
    if (deal.departure_date && deal.return_date) {
        nights = Math.round(
            (new Date(deal.return_date).getTime() - new Date(deal.departure_date).getTime()) / (1000 * 60 * 60 * 24)
        );
    }

    return (
        <>
            {/* Overlay */}
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(3px)', zIndex: 1100,
            }} />

            {/* Panel */}
            <div style={{
                position: 'fixed',
                ...(isMobile ? {
                    bottom: 0, left: 0, right: 0, maxHeight: '92vh',
                    borderTopLeftRadius: 24, borderTopRightRadius: 24,
                } : {
                    top: 0, right: 0, width: 440, height: '100vh',
                }),
                background: 'white', zIndex: 1101,
                overflowY: 'auto', overflowX: 'hidden',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: isMobile ? '0 -8px 30px rgba(0,0,0,0.2)' : '-6px 0 30px rgba(0,0,0,0.15)',
                animation: isMobile ? 'guideSlideUp 0.35s ease-out' : 'guideSlideIn 0.35s ease-out',
            }}>
                <style>{`
                    @keyframes guideSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
                    @keyframes guideSlideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
                    @keyframes guidePulse{0%,100%{opacity:1}50%{opacity:0.5}}
                    @keyframes guideSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
                    @keyframes guideFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
                `}</style>

                {/* ── HEADER ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #0F1A2A, #1B2D4F)',
                    padding: '20px 24px', position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', top: -30, right: -20, width: 120, height: 120,
                        borderRadius: '50%', background: 'radial-gradient(circle, rgba(46,125,219,0.15), transparent 70%)',
                        pointerEvents: 'none',
                    }} />
                    {isMobile && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 22 }}>🤖</span>
                                <h2 style={{
                                    margin: 0, fontSize: 20, fontWeight: 700, color: 'white',
                                    fontFamily: "'Fredoka', sans-serif",
                                }}>
                                    Guide IA
                                </h2>
                                <span style={{
                                    fontSize: 9, fontWeight: 800, color: '#60A5FA',
                                    background: 'rgba(96,165,250,0.15)',
                                    padding: '2px 8px', borderRadius: 100,
                                    border: '1px solid rgba(96,165,250,0.2)',
                                }}>
                                    HAIKU
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                                Itinéraire personnalisé pour <strong style={{ color: '#60A5FA' }}>{city}</strong>
                            </p>
                        </div>
                        <button onClick={onClose} style={{
                            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                            width: 36, height: 36, color: 'white', fontSize: 18, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>✕</button>
                    </div>

                    {/* Trip summary bar */}
                    <div style={{
                        marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap',
                    }}>
                        {[
                            deal.price && `${deal.price}$ aller-retour`,
                            `${nights} nuits`,
                            deal.airline,
                            deal.stops === 0 ? 'Direct' : `${deal.stops} escale`,
                        ].filter(Boolean).map((tag, i) => (
                            <span key={i} style={{
                                fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                                background: 'rgba(255,255,255,0.08)', padding: '3px 10px',
                                borderRadius: 100,
                            }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── CONTENT ── */}
                <div style={{ padding: '20px 24px 32px' }}>

                    {/* ═══ STEP: PREFERENCES ═══ */}
                    {step === 'prefs' && (
                        <>
                            {error && (
                                <div style={{
                                    padding: '10px 14px', borderRadius: 12, marginBottom: 16,
                                    background: '#FEF2F2', border: '1px solid #FECACA',
                                    fontSize: 13, color: '#DC2626',
                                }}>
                                    {error}
                                </div>
                            )}

                            {!user && (
                                <div style={{
                                    padding: '14px 16px', borderRadius: 14, marginBottom: 16,
                                    background: 'linear-gradient(135deg, #F0F7FF, #EEF2FF)',
                                    border: '1px solid rgba(46,125,219,0.15)',
                                    display: 'flex', alignItems: 'center', gap: 10,
                                }}>
                                    <span style={{ fontSize: 20 }}>🔒</span>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2B42' }}>
                                            Connecte-toi pour générer ton guide
                                        </div>
                                        <div style={{ fontSize: 11, color: '#5A7089' }}>
                                            Premier guide gratuit!
                                        </div>
                                    </div>
                                    <a href="/auth" style={{
                                        marginLeft: 'auto', padding: '6px 14px', borderRadius: 100,
                                        background: '#2E7DDB', color: 'white', fontSize: 11,
                                        fontWeight: 700, textDecoration: 'none',
                                    }}>
                                        Se connecter
                                    </a>
                                </div>
                            )}

                            {/* Preferences */}
                            <h3 style={{
                                fontSize: 14, fontWeight: 700, color: '#1A2B42', margin: '0 0 10px',
                            }}>
                                Qu'est-ce qui t'intéresse? <span style={{ color: '#8FA3B8', fontWeight: 500 }}>(choisis-en 2-4)</span>
                            </h3>
                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
                                marginBottom: 24,
                            }}>
                                {PREF_CATEGORIES.map(cat => {
                                    const isSelected = prefs.includes(cat.id);
                                    return (
                                        <button key={cat.id} onClick={() => togglePref(cat.id)} style={{
                                            padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                                            border: isSelected ? '2px solid #2E7DDB' : '1px solid rgba(26,43,66,0.08)',
                                            background: isSelected ? '#F0F7FF' : 'white',
                                            textAlign: 'left', transition: 'all 0.2s ease',
                                            boxShadow: isSelected ? '0 2px 8px rgba(46,125,219,0.12)' : 'none',
                                        }}>
                                            <div style={{ fontSize: 18, marginBottom: 4 }}>{cat.icon}</div>
                                            <div style={{
                                                fontSize: 12, fontWeight: 700,
                                                color: isSelected ? '#2E7DDB' : '#1A2B42',
                                            }}>{cat.label}</div>
                                            <div style={{ fontSize: 10, color: '#8FA3B8', marginTop: 2 }}>
                                                {cat.desc}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Budget style */}
                            <h3 style={{
                                fontSize: 14, fontWeight: 700, color: '#1A2B42', margin: '0 0 10px',
                            }}>
                                Style de budget
                            </h3>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                                {BUDGET_OPTIONS.map(opt => {
                                    const isSelected = budget === opt.id;
                                    return (
                                        <button key={opt.id} onClick={() => setBudget(opt.id)} style={{
                                            flex: 1, padding: '12px 10px', borderRadius: 14, cursor: 'pointer',
                                            border: isSelected ? '2px solid #2E7DDB' : '1px solid rgba(26,43,66,0.08)',
                                            background: isSelected ? '#F0F7FF' : 'white',
                                            textAlign: 'center', transition: 'all 0.2s ease',
                                        }}>
                                            <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</div>
                                            <div style={{
                                                fontSize: 11, fontWeight: 700,
                                                color: isSelected ? '#2E7DDB' : '#1A2B42',
                                            }}>{opt.label}</div>
                                            <div style={{ fontSize: 9, color: '#8FA3B8', marginTop: 2 }}>
                                                {opt.desc}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Rest days */}
                            <h3 style={{
                                fontSize: 14, fontWeight: 700, color: '#1A2B42', margin: '0 0 10px',
                            }}>
                                Jours de repos: <span style={{ color: '#2E7DDB' }}>{restDays}</span>
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                                <span style={{ fontSize: 11, color: '#8FA3B8' }}>0</span>
                                <input
                                    type="range" min="0" max={Math.max(Math.floor(nights / 3), 1)} value={restDays}
                                    onChange={e => setRestDays(Number(e.target.value))}
                                    style={{ flex: 1, accentColor: '#2E7DDB' }}
                                />
                                <span style={{ fontSize: 11, color: '#8FA3B8' }}>{Math.max(Math.floor(nights / 3), 1)}</span>
                            </div>

                            {/* Generate CTA */}
                            <button
                                onClick={handleGenerate}
                                disabled={prefs.length === 0}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    width: '100%', padding: '16px 0', borderRadius: 16, border: 'none',
                                    background: prefs.length > 0
                                        ? 'linear-gradient(135deg, #2E7DDB, #1B5BA0)'
                                        : '#E2E8F0',
                                    color: prefs.length > 0 ? 'white' : '#94A3B8',
                                    fontSize: 15, fontWeight: 700, cursor: prefs.length > 0 ? 'pointer' : 'not-allowed',
                                    fontFamily: "'Fredoka', sans-serif",
                                    boxShadow: prefs.length > 0 ? '0 4px 16px rgba(46,125,219,0.3)' : 'none',
                                    transition: 'all 0.35s ease',
                                }}
                            >
                                <span style={{ fontSize: 18 }}>🤖</span>
                                Générer mon guide IA
                            </button>
                            <p style={{ textAlign: 'center', fontSize: 11, color: '#B0B8C4', marginTop: 8 }}>
                                {profile?.plan === 'premium'
                                    ? '✨ Guides illimités avec ton plan Premium'
                                    : '🎁 Premier guide gratuit · Ensuite Premium'
                                }
                            </p>
                        </>
                    )}

                    {/* ═══ STEP: LOADING ═══ */}
                    {step === 'loading' && (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', padding: '60px 0', textAlign: 'center',
                        }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #F0F7FF, #EEF2FF)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 20, animation: 'guideFloat 2s ease-in-out infinite',
                            }}>
                                <span style={{ fontSize: 30 }}>🤖</span>
                            </div>
                            <h3 style={{
                                fontSize: 18, fontWeight: 700, color: '#1A2B42', margin: '0 0 8px',
                                fontFamily: "'Fredoka', sans-serif",
                            }}>
                                L'IA crée ton itinéraire...
                            </h3>
                            <p style={{ fontSize: 13, color: '#8FA3B8', margin: 0 }}>
                                Analyse des meilleures activités à {city}
                            </p>
                            {/* Progress dots */}
                            <div style={{ display: 'flex', gap: 6, marginTop: 24 }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i} style={{
                                        width: 8, height: 8, borderRadius: '50%', background: '#2E7DDB',
                                        animation: `guidePulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                                    }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══ STEP: LIMIT REACHED ═══ */}
                    {step === 'limit' && (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            padding: '40px 0', textAlign: 'center',
                        }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                            <h3 style={{
                                fontSize: 20, fontWeight: 700, color: '#1A2B42', margin: '0 0 10px',
                                fontFamily: "'Fredoka', sans-serif",
                            }}>
                                Tu as utilisé ton guide gratuit!
                            </h3>
                            <p style={{ fontSize: 14, color: '#5A7089', margin: '0 0 24px', lineHeight: 1.5 }}>
                                Passe à Premium pour générer des guides illimités
                                pour toutes tes destinations.
                            </p>
                            <a href="/pricing" style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '14px 32px', borderRadius: 14,
                                background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                                color: 'white', fontSize: 15, fontWeight: 700,
                                textDecoration: 'none', fontFamily: "'Fredoka', sans-serif",
                                boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
                            }}>
                                <span>⚡</span>
                                Voir les plans Premium
                            </a>
                            <button onClick={onClose} style={{
                                marginTop: 14, background: 'none', border: 'none',
                                color: '#8FA3B8', fontSize: 13, cursor: 'pointer',
                            }}>
                                Peut-être plus tard
                            </button>
                        </div>
                    )}

                    {/* ═══ STEP: RESULT ═══ */}
                    {step === 'result' && guide && (
                        <>
                            {/* Title & summary */}
                            <div style={{ marginBottom: 20 }}>
                                <h3 style={{
                                    fontSize: 22, fontWeight: 700, color: '#1A2B42', margin: '0 0 8px',
                                    fontFamily: "'Fredoka', sans-serif",
                                }}>
                                    {guide.title || `Ton voyage à ${city}`}
                                </h3>
                                <p style={{ fontSize: 13, color: '#5A7089', margin: 0, lineHeight: 1.5 }}>
                                    {guide.summary}
                                </p>
                            </div>

                            {/* Highlights */}
                            {guide.highlights && guide.highlights.length > 0 && (
                                <div style={{
                                    padding: '14px 16px', borderRadius: 14, marginBottom: 20,
                                    background: 'linear-gradient(135deg, #F0F7FF, #EEF2FF)',
                                    border: '1px solid rgba(46,125,219,0.1)',
                                }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#2E7DDB', marginBottom: 8 }}>
                                        ✨ Points forts
                                    </div>
                                    {guide.highlights.map((h: string, i: number) => (
                                        <div key={i} style={{
                                            fontSize: 12, color: '#1A2B42', marginBottom: 4,
                                            display: 'flex', alignItems: 'flex-start', gap: 6,
                                        }}>
                                            <span style={{ color: '#2E7DDB', flexShrink: 0 }}>→</span>
                                            {h}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Budget estimate */}
                            {guide.budget_estimate && (
                                <div style={{
                                    padding: '14px 16px', borderRadius: 14, marginBottom: 20,
                                    background: '#FAFBFD', border: '1px solid rgba(26,43,66,0.06)',
                                }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1A2B42', marginBottom: 10 }}>
                                        💰 Budget estimé
                                    </div>
                                    {[
                                        ['✈️ Vol', `${guide.budget_estimate.flight}$`],
                                        ['🏨 Hébergement/nuit', `${guide.budget_estimate.accommodation_per_night}$`],
                                        ['🍽 Repas/jour', `${guide.budget_estimate.food_per_day}$`],
                                        ['🎯 Activités total', `${guide.budget_estimate.activities_total}$`],
                                        ['🚕 Transport local', `${guide.budget_estimate.transport_local}$`],
                                    ].map(([label, val]) => (
                                        <div key={label as string} style={{
                                            display: 'flex', justifyContent: 'space-between',
                                            fontSize: 12, padding: '4px 0',
                                            borderBottom: '1px solid rgba(26,43,66,0.04)',
                                        }}>
                                            <span style={{ color: '#5A7089' }}>{label}</span>
                                            <span style={{ color: '#1A2B42', fontWeight: 600 }}>{val}</span>
                                        </div>
                                    ))}
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        fontSize: 14, fontWeight: 800, marginTop: 8, paddingTop: 8,
                                        borderTop: '2px solid rgba(46,125,219,0.15)',
                                    }}>
                                        <span style={{ color: '#1A2B42' }}>Total estimé</span>
                                        <span style={{ color: '#2E7DDB', fontFamily: "'Fredoka', sans-serif" }}>
                                            ~{guide.budget_estimate.total_estimate}$ CAD
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Day by day itinerary */}
                            <h3 style={{
                                fontSize: 14, fontWeight: 700, color: '#1A2B42', margin: '0 0 12px',
                            }}>
                                📅 Itinéraire jour par jour
                            </h3>
                            {(guide.days || []).map((day: any, i: number) => {
                                const isExpanded = expandedDay === i;
                                return (
                                    <div key={i} style={{
                                        marginBottom: 8, borderRadius: 14, overflow: 'hidden',
                                        border: '1px solid rgba(26,43,66,0.06)',
                                        background: isExpanded ? '#FAFBFD' : 'white',
                                        transition: 'all 0.2s ease',
                                    }}>
                                        {/* Day header */}
                                        <button onClick={() => setExpandedDay(isExpanded ? null : i)} style={{
                                            width: '100%', padding: '14px 16px', border: 'none',
                                            background: 'none', cursor: 'pointer', textAlign: 'left',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{
                                                    width: 28, height: 28, borderRadius: 10,
                                                    background: isExpanded
                                                        ? 'linear-gradient(135deg, #2E7DDB, #1B5BA0)'
                                                        : '#F0F4F8',
                                                    color: isExpanded ? 'white' : '#5A7089',
                                                    fontSize: 12, fontWeight: 800,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontFamily: "'Fredoka', sans-serif",
                                                }}>
                                                    {day.day || i + 1}
                                                </span>
                                                <div>
                                                    <div style={{
                                                        fontSize: 13, fontWeight: 700, color: '#1A2B42',
                                                        fontFamily: "'Outfit', sans-serif",
                                                    }}>
                                                        {day.title || `Jour ${i + 1}`}
                                                    </div>
                                                    <div style={{ fontSize: 10, color: '#8FA3B8' }}>
                                                        {day.theme || ''}
                                                    </div>
                                                </div>
                                            </div>
                                            <svg width="16" height="16" viewBox="0 0 24 24"
                                                fill="none" stroke="#8FA3B8" strokeWidth="2.5"
                                                style={{
                                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                                    transition: 'transform 0.2s ease',
                                                }}>
                                                <path d="M6 9l6 6 6-6" />
                                            </svg>
                                        </button>

                                        {/* Day content */}
                                        {isExpanded && (
                                            <div style={{ padding: '0 16px 16px' }}>
                                                {['morning', 'afternoon', 'evening'].map(period => {
                                                    const act = day[period];
                                                    if (!act) return null;
                                                    const periodLabel = period === 'morning' ? '🌅 Matin'
                                                        : period === 'afternoon' ? '☀️ Après-midi'
                                                            : '🌙 Soirée';
                                                    return (
                                                        <div key={period} style={{
                                                            padding: '12px 14px', borderRadius: 12, marginBottom: 8,
                                                            background: 'white', border: '1px solid rgba(26,43,66,0.04)',
                                                        }}>
                                                            <div style={{
                                                                fontSize: 10, fontWeight: 700, color: '#8FA3B8',
                                                                marginBottom: 6, textTransform: 'uppercase' as const,
                                                            }}>
                                                                {periodLabel}
                                                            </div>
                                                            <div style={{
                                                                fontSize: 14, fontWeight: 700, color: '#1A2B42',
                                                                marginBottom: 4,
                                                            }}>
                                                                {act.activity}
                                                            </div>
                                                            <div style={{
                                                                fontSize: 12, color: '#5A7089', lineHeight: 1.5,
                                                                marginBottom: 6,
                                                            }}>
                                                                {act.description}
                                                            </div>
                                                            {act.tip && (
                                                                <div style={{
                                                                    fontSize: 11, color: '#2E7DDB', fontWeight: 600,
                                                                    display: 'flex', alignItems: 'flex-start', gap: 4,
                                                                }}>
                                                                    <span>💡</span> {act.tip}
                                                                </div>
                                                            )}
                                                            {act.estimated_cost && (
                                                                <div style={{
                                                                    fontSize: 11, color: '#16A34A', fontWeight: 700,
                                                                    marginTop: 4,
                                                                }}>
                                                                    {act.estimated_cost}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {/* Restaurant recommendation */}
                                                {day.restaurant && (
                                                    <div style={{
                                                        padding: '12px 14px', borderRadius: 12,
                                                        background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)',
                                                        border: '1px solid rgba(234,88,12,0.1)',
                                                    }}>
                                                        <div style={{
                                                            fontSize: 10, fontWeight: 700, color: '#EA580C',
                                                            marginBottom: 6,
                                                        }}>
                                                            🍽 RESTAURANT DU JOUR
                                                        </div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2B42' }}>
                                                            {day.restaurant.name}
                                                        </div>
                                                        <div style={{ fontSize: 11, color: '#5A7089', marginTop: 2 }}>
                                                            {day.restaurant.type} · {day.restaurant.price_range}
                                                        </div>
                                                        {day.restaurant.tip && (
                                                            <div style={{
                                                                fontSize: 11, color: '#EA580C', fontWeight: 600,
                                                                marginTop: 4,
                                                            }}>
                                                                💡 {day.restaurant.tip}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Tips sections */}
                            {guide.local_tips && guide.local_tips.length > 0 && (
                                <div style={{
                                    padding: '14px 16px', borderRadius: 14, marginTop: 16,
                                    background: '#F0FDF4', border: '1px solid rgba(22,163,74,0.1)',
                                }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', marginBottom: 8 }}>
                                        🤫 Astuces d'initié
                                    </div>
                                    {guide.local_tips.map((tip: string, i: number) => (
                                        <div key={i} style={{
                                            fontSize: 12, color: '#1A2B42', marginBottom: 4,
                                            display: 'flex', gap: 6,
                                        }}>
                                            <span style={{ color: '#16A34A' }}>•</span> {tip}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {guide.packing_tips && guide.packing_tips.length > 0 && (
                                <div style={{
                                    padding: '14px 16px', borderRadius: 14, marginTop: 12,
                                    background: '#FAFBFD', border: '1px solid rgba(26,43,66,0.06)',
                                }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1A2B42', marginBottom: 8 }}>
                                        🧳 À ne pas oublier
                                    </div>
                                    {guide.packing_tips.map((tip: string, i: number) => (
                                        <div key={i} style={{
                                            fontSize: 12, color: '#5A7089', marginBottom: 4,
                                            display: 'flex', gap: 6,
                                        }}>
                                            <span>✓</span> {tip}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* New guide button */}
                            <button onClick={onClose} style={{
                                display: 'block', width: '100%', marginTop: 24, padding: '14px 0',
                                borderRadius: 14, border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #2E7DDB, #1B5BA0)',
                                color: 'white', fontSize: 14, fontWeight: 700,
                                fontFamily: "'Fredoka', sans-serif",
                            }}>
                                ✈️ Réserver ce vol
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
