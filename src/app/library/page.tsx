'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const DC = ['#2E7DDB', '#0E9AA7', '#F5A623', '#E84855', '#7C3AED', '#059669', '#DB2777'];
const SLOTS = [
    { slot: 'breakfast', label: 'Déjeuner', icon: '🥐' },
    { slot: 'morning', label: 'Matin', icon: '🌅' },
    { slot: 'lunch', label: 'Dîner', icon: '🥗' },
    { slot: 'afternoon', label: 'Après-midi', icon: '☀️' },
    { slot: 'dinner', label: 'Souper', icon: '🍽️' },
    { slot: 'evening', label: 'Soirée', icon: '🌙' },
];

export default function LibraryPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [guides, setGuides] = useState<any[]>([]);
    const [loadingGuides, setLoadingGuides] = useState(true);
    const [selectedGuide, setSelectedGuide] = useState<any>(null);
    const [expandedDay, setExpandedDay] = useState(0);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth');
            return;
        }
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

    const deleteGuide = async (id: string) => {
        const supabase = createClient();
        await supabase.from('ai_guides').delete().eq('id', id);
        setGuides(g => g.filter(x => x.id !== id));
        if (selectedGuide?.id === id) setSelectedGuide(null);
    };

    const formatDate = (d: string) => {
        if (!d) return '';
        return new Date(d).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    if (loading || loadingGuides) return (
        <div style={{ minHeight: '100vh', background: '#0B1120', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fredoka', sans-serif" }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 50, height: 50, margin: '0 auto 16px', borderRadius: '50%', border: '4px solid rgba(46,125,219,.1)', borderTopColor: '#2E7DDB', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#5A6B80', fontSize: 14 }}>Chargement...</p>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0B1120 0%, #0F1D2F 100%)', fontFamily: "'Fredoka', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700;800&display=swap');
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
.lib-card:hover{transform:translateY(-3px)!important;box-shadow:0 12px 32px rgba(46,125,219,0.15)!important}
.lib-scroll::-webkit-scrollbar{width:4px}.lib-scroll::-webkit-scrollbar-thumb{background:rgba(46,125,219,.15);border-radius:4px}`}</style>

            {/* Header */}
            <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#60A5FA', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Fredoka',sans-serif", marginBottom: 8 }}>
                            ← Retour à la carte
                        </button>
                        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: 0 }}>📚 Ma bibliothèque</h1>
                        <p style={{ fontSize: 14, color: '#5A6B80', marginTop: 4 }}>{guides.length} guide{guides.length !== 1 ? 's' : ''} sauvegardé{guides.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button onClick={() => router.push('/')} style={{
                        padding: '10px 20px', borderRadius: 100, border: 'none',
                        background: 'linear-gradient(135deg, #2E7DDB, #1A3A6B)',
                        color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        fontFamily: "'Fredoka', sans-serif",
                    }}>
                        ✨ Nouveau guide
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
                {/* Left: Guide list */}
                <div className="lib-scroll" style={{ width: selectedGuide ? 340 : '100%', maxWidth: selectedGuide ? 340 : 900, margin: selectedGuide ? 0 : '0 auto', padding: '20px', overflowY: 'auto', transition: 'all 0.3s', flexShrink: 0 }}>
                    {guides.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
                            <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Aucun guide sauvegardé</h3>
                            <p style={{ color: '#5A6B80', fontSize: 13, marginBottom: 20 }}>Génère ton premier itinéraire IA!</p>
                            <button onClick={() => router.push('/')} style={{
                                padding: '12px 24px', borderRadius: 100, border: 'none',
                                background: 'linear-gradient(135deg, #2E7DDB, #1A3A6B)',
                                color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                            }}>
                                ⚜️ Créer un guide
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: selectedGuide ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                            {guides.map((g, idx) => {
                                const guide = g.guide_data;
                                const isSelected = selectedGuide?.id === g.id;
                                return (
                                    <div key={g.id} className="lib-card"
                                        onClick={() => { setSelectedGuide(g); setExpandedDay(0); }}
                                        style={{
                                            padding: '16px 18px', borderRadius: 18, cursor: 'pointer',
                                            background: isSelected ? 'rgba(46,125,219,0.08)' : 'rgba(255,255,255,0.03)',
                                            border: isSelected ? '2px solid rgba(46,125,219,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                            transition: 'all 0.25s',
                                            animation: `fadeIn 0.3s ease ${idx * 0.05}s both`,
                                        }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{guide?.title || g.destination}</div>
                                                <div style={{ fontSize: 11, color: '#5A6B80', marginTop: 3 }}>
                                                    📍 {g.destination} {g.country ? `· ${g.country}` : ''}
                                                </div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); deleteGuide(g.id); }}
                                                style={{ background: 'none', border: 'none', color: 'rgba(248,113,113,0.5)', fontSize: 14, cursor: 'pointer', padding: '2px 6px', borderRadius: 8 }}
                                                onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
                                                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(248,113,113,0.5)')}>
                                                🗑️
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                                            {g.departure_date && <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 100, background: 'rgba(46,125,219,0.08)', color: '#60A5FA', fontWeight: 600 }}>📅 {formatDate(g.departure_date)}</span>}
                                            <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 100, background: 'rgba(46,125,219,0.08)', color: '#60A5FA', fontWeight: 600 }}>💰 {g.budget_style}</span>
                                            <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,255,255,0.04)', color: '#5A6B80', fontWeight: 600 }}>{guide?.days?.length || '?'} jours</span>
                                            {g.model_used === 'cache' && <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 100, background: 'rgba(5,150,105,0.1)', color: '#34D399', fontWeight: 600 }}>⚡ Cache</span>}
                                        </div>
                                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>
                                            Créé le {formatDate(g.created_at)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right: Guide detail */}
                {selectedGuide && (
                    <div className="lib-scroll" style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', borderLeft: '1px solid rgba(255,255,255,0.04)', animation: 'fadeIn 0.3s ease' }}>
                        {(() => {
                            const g = selectedGuide.guide_data;
                            if (!g) return <p style={{ color: '#5A6B80' }}>Données non disponibles</p>;
                            return (
                                <>
                                    {/* Header */}
                                    <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: 0 }}>{g.title}</h2>
                                            <button onClick={() => setSelectedGuide(null)} style={{ background: 'rgba(255,255,255,0.04)', border: 'none', color: '#5A6B80', fontSize: 16, cursor: 'pointer', borderRadius: 8, padding: '4px 10px' }}>✕</button>
                                        </div>
                                        <p style={{ fontSize: 13, color: '#5A6B80', marginTop: 4 }}>{g.summary}</p>

                                        {g.budget_summary && (
                                            <div style={{ display: 'flex', gap: 16, marginTop: 12, padding: '12px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                <div><div style={{ fontSize: 9, color: '#5A6B80', fontWeight: 700 }}>TOTAL</div><div style={{ fontSize: 18, fontWeight: 800, color: '#60A5FA' }}>{g.budget_summary.total_per_person}$</div></div>
                                                <div><div style={{ fontSize: 9, color: '#5A6B80', fontWeight: 700 }}>HÉBERG.</div><div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{g.budget_summary.accommodation_total}$</div></div>
                                                <div><div style={{ fontSize: 9, color: '#5A6B80', fontWeight: 700 }}>BOUFFE</div><div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{g.budget_summary.food_total}$</div></div>
                                                <div><div style={{ fontSize: 9, color: '#5A6B80', fontWeight: 700 }}>ACTIVITÉS</div><div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{g.budget_summary.activities_total}$</div></div>
                                            </div>
                                        )}
                                        {g.accommodation && <div style={{ marginTop: 8, fontSize: 12, color: '#5A6B80' }}>🏨 {g.accommodation.name} · {g.accommodation.price_per_night}$/nuit</div>}
                                    </div>

                                    {/* Day tabs */}
                                    <div style={{ display: 'flex', gap: 0, overflowX: 'auto', marginBottom: 16 }}>
                                        {g.days?.map((d: any, i: number) => (
                                            <button key={i} onClick={() => setExpandedDay(i)} style={{
                                                flex: '0 0 auto', padding: '8px 12px', border: 'none',
                                                borderBottom: expandedDay === i ? `3px solid ${DC[i % DC.length]}` : '3px solid transparent',
                                                background: 'transparent', color: expandedDay === i ? DC[i % DC.length] : '#5A6B80',
                                                fontSize: 12, fontWeight: expandedDay === i ? 700 : 600,
                                                cursor: 'pointer', fontFamily: "'Fredoka',sans-serif",
                                            }}>
                                                <div>J{d.day}</div>
                                                <div style={{ fontSize: 9 }}>{d.total_cost}$</div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Day detail */}
                                    {g.days?.map((d: any, i: number) => expandedDay === i ? (
                                        <div key={i} style={{ animation: 'fadeIn 0.25s ease' }}>
                                            <h3 style={{ fontSize: 16, fontWeight: 700, color: DC[i % DC.length], margin: '0 0 14px' }}>{d.theme} {d.title}</h3>
                                            {SLOTS.map(({ slot, label, icon }) => {
                                                const data = d[slot];
                                                if (!data) return null;
                                                const nm = data.activity || data.name || '—';
                                                const time = d.schedule?.[slot] || '';
                                                return (
                                                    <div key={slot} style={{
                                                        display: 'flex', gap: 0, borderRadius: 12, overflow: 'hidden',
                                                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                                                        marginBottom: 6,
                                                    }}>
                                                        {time && <div style={{
                                                            width: 52, flexShrink: 0, background: 'rgba(255,255,255,0.02)',
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                            padding: '8px 4px', borderRight: '1px solid rgba(255,255,255,0.04)',
                                                        }}>
                                                            <span style={{ fontSize: 13, fontWeight: 800, color: DC[i % DC.length] }}>{time.split(':')[0]}</span>
                                                            <span style={{ fontSize: 9, color: '#5A6B80' }}>:{time.split(':')[1] || '00'}</span>
                                                        </div>}
                                                        <div style={{ flex: 1, padding: '10px 14px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ fontSize: 10, fontWeight: 700, color: DC[i % DC.length], textTransform: 'uppercase' }}>{icon} {label}</span>
                                                                <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{data.cost}$</span>
                                                            </div>
                                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 2 }}>{nm}</div>
                                                            <div style={{ fontSize: 11, color: '#5A6B80' }}>📍 {data.location}</div>
                                                            {data.tip && <div style={{ fontSize: 10, color: '#8A9AB5', fontStyle: 'italic', marginTop: 2 }}>💡 {data.tip}</div>}
                                                            {data.must_try && <div style={{ fontSize: 10, color: '#60A5FA', marginTop: 2 }}>⭐ {data.must_try}</div>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : null)}

                                    {/* Tips & Packing */}
                                    {g.packing_list && (
                                        <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'rgba(5,150,105,0.03)', border: '1px solid rgba(5,150,105,0.08)' }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#34D399', marginBottom: 4 }}>🎒 À ne pas oublier</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                {g.packing_list.map((it: string, j: number) => <span key={j} style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(5,150,105,0.06)', fontSize: 10, fontWeight: 600, color: '#34D399' }}>{it}</span>)}
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}
