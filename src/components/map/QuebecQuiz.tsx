'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import TripDatePicker from './TripDatePicker';

const QC_REGIONS = [
    {
        id: 'ville-de-quebec', name: 'Ville de Québec', emoji: '🏰',
        img: '🏰', tagline: 'Histoire, culture et gastronomie dans la plus belle ville du Canada',
        strengths: { culture: 10, food: 9, history: 10, nightlife: 7, nature: 5, adventure: 4, relax: 6, photo: 9, family: 8, romantic: 9, art: 8, winter: 8 },
        highlights: ['Vieux-Québec UNESCO', 'Château Frontenac', 'Gastronomie de classe mondiale', 'Carnaval d\'hiver'],
        bestFor: ['culture', 'romantic', 'history', 'food'],
    },
    {
        id: 'montreal', name: 'Montréal', emoji: '🎭',
        img: '🎭', tagline: 'Métropole vibrante, festivals, bouffe et nightlife incroyable',
        strengths: { culture: 9, food: 10, history: 7, nightlife: 10, nature: 4, adventure: 5, relax: 6, photo: 8, family: 7, romantic: 7, art: 10, winter: 6 },
        highlights: ['Festival de Jazz', 'Mile End & Plateau', 'Scène culinaire diversifiée', 'Art de rue & musées'],
        bestFor: ['nightlife', 'food', 'art', 'culture'],
    },
    {
        id: 'charlevoix', name: 'Charlevoix', emoji: '⛰️',
        img: '⛰️', tagline: 'Montagnes, fleuve, terroir et art — la perle du Québec',
        strengths: { culture: 7, food: 9, history: 5, nightlife: 3, nature: 9, adventure: 7, relax: 8, photo: 10, family: 7, romantic: 10, art: 8, winter: 8 },
        highlights: ['Le Massif de Charlevoix', 'Route du Fleuve', 'Gastronomie terroir', 'Baie-Saint-Paul artistique'],
        bestFor: ['romantic', 'nature', 'food', 'photo'],
    },
    {
        id: 'gaspesie', name: 'Gaspésie', emoji: '🪨',
        img: '🪨', tagline: 'Road trip épique — Rocher Percé, baleines et bout du monde',
        strengths: { culture: 6, food: 7, history: 6, nightlife: 2, nature: 10, adventure: 9, relax: 6, photo: 10, family: 7, romantic: 7, art: 5, winter: 5 },
        highlights: ['Rocher Percé', 'Parc Forillon', 'Mont Albert (Chic-Chocs)', 'Fous de Bassan'],
        bestFor: ['nature', 'adventure', 'photo', 'roadtrip'],
    },
    {
        id: 'saguenay-lac-saint-jean', name: 'Saguenay–Lac-Saint-Jean', emoji: '💙',
        img: '💙', tagline: 'Fjord majestueux, lac immense et bleuets à perte de vue',
        strengths: { culture: 6, food: 6, history: 5, nightlife: 3, nature: 9, adventure: 8, relax: 6, photo: 8, family: 9, romantic: 6, art: 4, winter: 8 },
        highlights: ['Fjord du Saguenay', 'Zoo de Saint-Félicien', 'Véloroute des Bleuets', 'Val-Jalbert'],
        bestFor: ['nature', 'family', 'adventure'],
    },
    {
        id: 'laurentides', name: 'Laurentides', emoji: '🎿',
        img: '🎿', tagline: 'Ski, nature, spa et villages charmants à 1h de Montréal',
        strengths: { culture: 5, food: 7, history: 4, nightlife: 5, nature: 8, adventure: 8, relax: 9, photo: 7, family: 8, romantic: 8, art: 6, winter: 10 },
        highlights: ['Mont Tremblant', 'Village de Tremblant', 'Spas nordiques', 'Sentier des Cimes'],
        bestFor: ['winter', 'relax', 'adventure', 'romantic'],
    },
    {
        id: 'cantons-de-lest', name: 'Cantons-de-l\'Est', emoji: '🍷',
        img: '🍷', tagline: 'Route des vins, villages anglais et montagnes de ski',
        strengths: { culture: 6, food: 9, history: 5, nightlife: 4, nature: 8, adventure: 7, relax: 8, photo: 8, family: 7, romantic: 9, art: 5, winter: 8 },
        highlights: ['Route des Vins', 'North Hatley', 'Mont Sutton', 'Abbaye de Saint-Benoît-du-Lac'],
        bestFor: ['food', 'romantic', 'nature', 'winter'],
    },
    {
        id: 'cote-nord', name: 'Côte-Nord', emoji: '🐋',
        img: '🐋', tagline: 'Baleines, fjord, Mingan et nature sauvage à l\'état pur',
        strengths: { culture: 5, food: 5, history: 5, nightlife: 1, nature: 10, adventure: 9, relax: 5, photo: 9, family: 7, romantic: 6, art: 3, winter: 5 },
        highlights: ['Baleines à Tadoussac', 'Archipel de Mingan', 'Fjord du Saguenay', 'Cap-de-Bon-Désir'],
        bestFor: ['nature', 'adventure', 'photo'],
    },
    {
        id: 'outaouais', name: 'Outaouais', emoji: '🏛️',
        img: '🏛️', tagline: 'Musées nationaux, parc de la Gatineau et plein air',
        strengths: { culture: 8, food: 6, history: 7, nightlife: 5, nature: 7, adventure: 7, relax: 6, photo: 7, family: 8, romantic: 5, art: 6, winter: 7 },
        highlights: ['Musée canadien de l\'histoire', 'Parc de la Gatineau', 'Caverne Laflèche', 'Eco-Odyssée'],
        bestFor: ['culture', 'family', 'nature'],
    },
    {
        id: 'mauricie', name: 'Mauricie', emoji: '🌲',
        img: '🌲', tagline: 'Parc national, microbrasseries et Forêt perdue magique',
        strengths: { culture: 6, food: 7, history: 6, nightlife: 4, nature: 8, adventure: 6, relax: 7, photo: 7, family: 8, romantic: 7, art: 4, winter: 9 },
        highlights: ['Parc de la Mauricie', 'Domaine de la Forêt Perdue', 'Le Trou du Diable', 'Festival Western'],
        bestFor: ['nature', 'winter', 'family', 'food'],
    },
];

type StepId = 'welcome' | 'group' | 'vibe' | 'interests' | 'energy' | 'season' | 'food' | 'accommodation' | 'transport' | 'duration' | 'budget' | 'special' | 'results' | 'generating' | 'guide';

interface QuizAnswers {
    group: string;
    vibe: string;
    interests: string[];
    energy: string;
    season: string;
    food: string[];
    accommodation: string;
    transport: string;
    duration: number;
    budget: string;
    special: string;
}

const INITIAL_ANSWERS: QuizAnswers = {
    group: '', vibe: '', interests: [], energy: '', season: '',
    food: [], accommodation: '', transport: '', duration: 5, budget: 'moderate', special: '',
};

const F = "'Fredoka', sans-serif";
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700;800&display=swap');
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes confetti{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(-20px) rotate(360deg);opacity:0}}
.quiz-opt{cursor:pointer;transition:all .2s;border:2px solid rgba(46,125,219,.1);background:rgba(46,125,219,.03)}
.quiz-opt:hover{transform:translateY(-2px);border-color:rgba(46,125,219,.3);background:rgba(46,125,219,.06)}
.quiz-opt.selected{border-color:#2E7DDB!important;background:rgba(46,125,219,.1)!important;box-shadow:0 4px 16px rgba(46,125,219,.12)}
.quiz-chip{cursor:pointer;transition:all .2s;border:1.5px solid rgba(26,43,66,.1);background:rgba(46,125,219,.03)}
.quiz-chip:hover{border-color:rgba(46,125,219,.3);background:rgba(46,125,219,.06)}
.quiz-chip.selected{border-color:#2E7DDB!important;background:rgba(46,125,219,.1)!important}
.quiz-scroll::-webkit-scrollbar{width:4px}.quiz-scroll::-webkit-scrollbar-thumb{background:rgba(46,125,219,.2);border-radius:4px}
.region-card{cursor:pointer;transition:all .3s;position:relative;overflow:hidden}
.region-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(46,125,219,.15)!important}
`;

function scoreRegions(answers: QuizAnswers) {
    const weights: Record<string, number> = {};
    answers.interests.forEach(i => { weights[i] = (weights[i] || 0) + 3; });
    if (answers.vibe === 'romantic') weights.romantic = (weights.romantic || 0) + 4;
    if (answers.vibe === 'party') weights.nightlife = (weights.nightlife || 0) + 4;
    if (answers.vibe === 'chill') weights.relax = (weights.relax || 0) + 4;
    if (answers.vibe === 'explorer') { weights.nature = (weights.nature || 0) + 2; weights.adventure = (weights.adventure || 0) + 2; }
    if (answers.vibe === 'cultural') { weights.culture = (weights.culture || 0) + 3; weights.history = (weights.history || 0) + 2; }
    if (answers.group === 'family') weights.family = (weights.family || 0) + 3;
    if (answers.group === 'couple') weights.romantic = (weights.romantic || 0) + 3;
    if (answers.group === 'friends') weights.nightlife = (weights.nightlife || 0) + 2;
    if (answers.energy === 'intense') weights.adventure = (weights.adventure || 0) + 2;
    if (answers.energy === 'relax') weights.relax = (weights.relax || 0) + 2;
    if (answers.energy === 'mixed') { weights.nature = (weights.nature || 0) + 1; weights.relax = (weights.relax || 0) + 1; }
    if (answers.season === 'winter') weights.winter = (weights.winter || 0) + 3;
    if (answers.season === 'fall') weights.photo = (weights.photo || 0) + 2;
    if (answers.food.includes('terroir')) weights.food = (weights.food || 0) + 2;
    if (answers.food.includes('fine-dining')) weights.food = (weights.food || 0) + 2;
    if (answers.food.includes('micro')) weights.food = (weights.food || 0) + 1;

    return QC_REGIONS.map(region => {
        let score = 0;
        Object.entries(weights).forEach(([key, w]) => { score += (region.strengths[key as keyof typeof region.strengths] || 0) * w; });
        region.bestFor.forEach(b => { if (weights[b]) score += 5; });
        return { ...region, score };
    }).sort((a, b) => b.score - a.score);
}

function getMatchReasons(region: typeof QC_REGIONS[0], answers: QuizAnswers): string[] {
    const reasons: string[] = [];
    const s = region.strengths;
    if (answers.interests.includes('nature') && s.nature >= 8) reasons.push('Nature spectaculaire');
    if (answers.interests.includes('culture') && s.culture >= 8) reasons.push('Riche en culture');
    if (answers.interests.includes('food') && s.food >= 8) reasons.push('Gastronomie exceptionnelle');
    if (answers.interests.includes('adventure') && s.adventure >= 8) reasons.push('Aventures palpitantes');
    if (answers.interests.includes('photo') && s.photo >= 9) reasons.push('Paysages à couper le souffle');
    if (answers.vibe === 'romantic' && s.romantic >= 8) reasons.push('Destination romantique idéale');
    if (answers.vibe === 'party' && s.nightlife >= 7) reasons.push('Vie nocturne animée');
    if (answers.vibe === 'chill' && s.relax >= 7) reasons.push('Parfait pour relaxer');
    if (answers.group === 'family' && s.family >= 8) reasons.push('Super pour les familles');
    if (answers.season === 'winter' && s.winter >= 8) reasons.push('Paradis hivernal');
    if (answers.interests.includes('art') && s.art >= 7) reasons.push('Scène artistique vibrante');
    if (answers.interests.includes('nightlife') && s.nightlife >= 7) reasons.push('Sorties et ambiance festive');
    if (reasons.length === 0) {
        region.bestFor.slice(0, 2).forEach(b => {
            const labels: Record<string, string> = {
                culture: 'Riche patrimoine culturel', nature: 'Nature grandiose', food: 'Gastronomie locale réputée',
                adventure: 'Aventures variées', romantic: 'Ambiance romantique', family: 'Activités familiales',
                winter: 'Activités d\'hiver', photo: 'Panoramas spectaculaires', nightlife: 'Vie nocturne',
                art: 'Scène artistique', relax: 'Détente et bien-être', roadtrip: 'Road trip mémorable',
            };
            reasons.push(labels[b] || b);
        });
    }
    return reasons.slice(0, 3);
}

interface QuebecQuizProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (region: string, quizData: any) => void;
}

export default function QuebecQuiz({ isOpen, onClose, onGenerate }: QuebecQuizProps) {
    const { user } = useAuth();
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [step, setStep] = useState<StepId>('welcome');
    const [answers, setAnswers] = useState<QuizAnswers>({ ...INITIAL_ANSWERS });
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [guide, setGuide] = useState<any>(null);
    const [guideLoading, setGuideLoading] = useState(false);
    const [guideError, setGuideError] = useState('');
    const [guideLimitReached, setGuideLimitReached] = useState(false);
    const [expandedDay, setExpandedDay] = useState<number>(0);

    useEffect(() => {
        if (isOpen) {
            setStep('welcome'); setAnswers({ ...INITIAL_ANSWERS }); setSelectedRegion(null);
            setGuide(null); setGuideError(''); setGuideLimitReached(false); setExpandedDay(0);
        }
    }, [isOpen]);

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [step]);

    const rankedRegions = useMemo(() => scoreRegions(answers), [answers]);
    if (!isOpen) return null;

    const STEPS: StepId[] = ['welcome', 'group', 'vibe', 'interests', 'energy', 'season', 'food', 'accommodation', 'transport', 'duration', 'budget', 'special', 'results'];
    const currentIdx = STEPS.indexOf(step);
    const totalSteps = STEPS.length - 2;
    const progress = step === 'welcome' ? 0 : step === 'results' ? 100 : Math.round(((currentIdx - 1) / (totalSteps)) * 100);

    const next = () => { const i = STEPS.indexOf(step); if (i < STEPS.length - 1) setStep(STEPS[i + 1]); };
    const back = () => {
        if (step === 'generating' || step === 'guide') { setStep('results'); setGuide(null); setGuideLoading(false); setGuideError(''); return; }
        const i = STEPS.indexOf(step); if (i > 0) setStep(STEPS[i - 1]); else onClose();
    };

    const set = (key: keyof QuizAnswers, val: any) => setAnswers(a => ({ ...a, [key]: val }));
    const toggleArr = (key: 'interests' | 'food', val: string) => {
        setAnswers(a => ({
            ...a, [key]: (a[key] as string[]).includes(val)
                ? (a[key] as string[]).filter(x => x !== val) : [...(a[key] as string[]), val],
        }));
    };

    const handleGenerate = async (regionId: string) => {
        if (!user) { router.push('/auth'); return; }
        const region = QC_REGIONS.find(r => r.id === regionId);
        const regionName = region?.name || regionId;
        setStep('generating'); setGuideLoading(true); setGuideError(''); setGuideLimitReached(false);
        try {
            const res = await fetch('/api/guide/generate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination: regionName, destination_code: '', country: 'Canada (Québec)',
                    departure_date: null, return_date: null, price: 0, airline: 'Route', stops: 0,
                    preferences: answers.interests, rest_days: 1, budget_style: answers.budget || 'moderate',
                    quiz_context: { ...answers, duration: answers.duration },
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.error === 'limit_reached') { setGuideLimitReached(true); setGuideLoading(false); return; }
                setGuideError(data.message || data.error || 'Erreur'); setStep('results'); setGuideLoading(false); return;
            }
            setGuide(data.guide); setStep('guide'); if (scrollRef.current) scrollRef.current.scrollTop = 0;
        } catch { setGuideError('Erreur de connexion.'); setStep('results'); }
        setGuideLoading(false);
    };

    const Opt = ({ icon, label, desc, value, current, onClick }: any) => (
        <div className={`quiz-opt ${current === value ? 'selected' : ''}`} onClick={() => onClick(value)} style={{ padding: '14px 16px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>{icon}</span>
            <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2B42' }}>{label}</div>
                {desc && <div style={{ fontSize: 11, color: '#5A7089', marginTop: 2 }}>{desc}</div>}
            </div>
            {current === value && <span style={{ marginLeft: 'auto', fontSize: 16 }}>✓</span>}
        </div>
    );

    const Chip = ({ icon, label, value, arr, toggleKey }: any) => (
        <div className={`quiz-chip ${(answers[toggleKey as keyof QuizAnswers] as string[]).includes(value) ? 'selected' : ''}`} onClick={() => toggleArr(toggleKey, value)} style={{ padding: '8px 14px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1A2B42' }}>{label}</span>
        </div>
    );

    const Title = ({ icon, text, sub }: { icon: string; text: string; sub?: string }) => (
        <div style={{ marginBottom: 20, animation: 'fadeUp .4s ease' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A2B42', margin: 0, fontFamily: F }}>{text}</h2>
            {sub && <p style={{ fontSize: 13, color: '#5A7089', marginTop: 4 }}>{sub}</p>}
        </div>
    );

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(10px)' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <style>{CSS}</style>
            <div style={{ width: '100%', maxWidth: 520, maxHeight: '92vh', borderRadius: 24, background: 'linear-gradient(180deg, #F8FAFF 0%, #EEF2F9 100%)', border: '1px solid rgba(46,125,219,.12)', boxShadow: '0 24px 64px rgba(0,0,0,.15)', display: 'flex', flexDirection: 'column', fontFamily: F, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(26,43,66,.06)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <button onClick={back} style={{ background: 'none', border: 'none', color: '#2E7DDB', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>{step === 'welcome' ? '✕ Fermer' : '← Retour'}</button>
                        <span style={{ fontSize: 11, color: '#5A7089', fontWeight: 600 }}>{step !== 'welcome' && step !== 'results' && `${currentIdx}/${totalSteps}`}</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: 'rgba(46,125,219,.08)' }}>
                        <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #2E7DDB, #60A5FA)', width: `${progress}%`, transition: 'width .4s ease' }} />
                    </div>
                </div>
                <div ref={scrollRef} className="quiz-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 24px' }}>
                    {step === 'welcome' && (
                        <div style={{ textAlign: 'center', animation: 'fadeUp .4s ease' }}>
                            <div style={{ fontSize: 56, marginBottom: 12 }}>⚜️</div>
                            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2B42', margin: '0 0 8px', fontFamily: F }}>Ton Québec</h1>
                            <p style={{ fontSize: 14, color: '#5A7089', marginBottom: 24, lineHeight: 1.5 }}>Réponds à quelques questions et on te suggère les meilleures régions du Québec pour toi — avec un itinéraire sur mesure.</p>
                            <button onClick={next} style={{ padding: '14px 40px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg, #2E7DDB, #1A3A6B)', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: F, boxShadow: '0 4px 20px rgba(46,125,219,.3)' }}>C'est parti! 🚀</button>
                        </div>
                    )}
                    {step === 'group' && (<>
                        <Title icon="👥" text="Tu voyages avec qui?" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Opt icon="🧑" label="Solo" desc="Liberté totale" value="solo" current={answers.group} onClick={(v: string) => { set('group', v); setTimeout(next, 300); }} />
                            <Opt icon="💑" label="En couple" desc="Romantique" value="couple" current={answers.group} onClick={(v: string) => { set('group', v); setTimeout(next, 300); }} />
                            <Opt icon="👨👩👧👦" label="En famille" desc="Fun pour tous" value="family" current={answers.group} onClick={(v: string) => { set('group', v); setTimeout(next, 300); }} />
                            <Opt icon="🍻" label="Entre amis" desc="Aventure" value="friends" current={answers.group} onClick={(v: string) => { set('group', v); setTimeout(next, 300); }} />
                        </div>
                    </>)}
                    {step === 'vibe' && (<>
                        <Title icon="✨" text="C'est quoi le vibe recherché?" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Opt icon="🌹" label="Romantique" value="romantic" current={answers.vibe} onClick={(v: string) => { set('vibe', v); setTimeout(next, 300); }} />
                            <Opt icon="🗺️" label="Explorateur" value="explorer" current={answers.vibe} onClick={(v: string) => { set('vibe', v); setTimeout(next, 300); }} />
                            <Opt icon="🎉" label="Party" value="party" current={answers.vibe} onClick={(v: string) => { set('vibe', v); setTimeout(next, 300); }} />
                            <Opt icon="🧘" label="Chill" value="chill" current={answers.vibe} onClick={(v: string) => { set('vibe', v); setTimeout(next, 300); }} />
                        </div>
                    </>)}
                    {step === 'interests' && (<>
                        <Title icon="🎯" text="Tes intérêts? (min 2)" />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {[{ icon: '🏛', label: 'Culture', value: 'culture' }, { icon: '🍽', label: 'Gastronomie', value: 'food' }, { icon: '🌿', label: 'Nature', value: 'nature' }, { icon: '🤿', label: 'Aventure', value: 'adventure' }, { icon: '📸', label: 'Photo', value: 'photo' }, { icon: '🎨', label: 'Art', value: 'art' }].map(c => (<Chip key={c.value} {...c} toggleKey="interests" />))}
                        </div>
                        <button onClick={next} disabled={answers.interests.length < 2} style={{ display: 'block', width: '100%', marginTop: 20, padding: '12px', borderRadius: 14, border: 'none', background: answers.interests.length >= 2 ? 'linear-gradient(135deg, #2E7DDB, #1A3A6B)' : '#E5E7EB', color: 'white', fontWeight: 700, fontFamily: F }}>Continuer</button>
                    </>)}
                    {step === 'energy' && (<Opt icon="🔥" label="Intense" value="intense" current={answers.energy} onClick={(v: string) => { set('energy', v); setTimeout(next, 300); }} />)}
                    {step === 'season' && (<Opt icon="☀️" label="Été" value="summer" current={answers.season} onClick={(v: string) => { set('season', v); setTimeout(next, 300); }} />)}
                    {step === 'food' && (<Chip icon="🧀" label="Terroir" value="terroir" toggleKey="food" />)}
                    {step === 'accommodation' && (<Opt icon="⛺" label="Camping" value="camping" current={answers.accommodation} onClick={(v: string) => { set('accommodation', v); setTimeout(next, 300); }} />)}
                    {step === 'transport' && (<Opt icon="🚗" label="Auto" value="car" current={answers.transport} onClick={(v: string) => { set('transport', v); setTimeout(next, 300); }} />)}
                    {step === 'duration' && (<>
                        <Title icon="📅" text="Combien de jours?" />
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, margin: '20px 0' }}>
                            <button onClick={() => set('duration', Math.max(2, answers.duration - 1))} style={{ width: 40, height: 40, borderRadius: '50%' }}>-</button>
                            <span style={{ fontSize: 32, fontWeight: 800 }}>{answers.duration}</span>
                            <button onClick={() => set('duration', Math.min(14, answers.duration + 1))} style={{ width: 40, height: 40, borderRadius: '50%' }}>+</button>
                        </div>
                        <button onClick={next} style={{ width: '100%', padding: '12px', borderRadius: 14, background: '#2E7DDB', color: 'white' }}>Continuer</button>
                    </>)}
                    {step === 'budget' && (<Opt icon="🎒" label="Éco" value="budget" current={answers.budget} onClick={(v: string) => { set('budget', v); setTimeout(next, 300); }} />)}
                    {step === 'special' && (<><textarea value={answers.special} onChange={e => set('special', e.target.value)} style={{ width: '100%', height: 100 }} /><button onClick={next} style={{ width: '100%', background: '#2E7DDB', color: 'white' }}>Voir résultats</button></>)}
                    {step === 'results' && (<>
                        {rankedRegions.slice(0, 3).map((r, i) => (
                            <div key={r.id} onClick={() => setSelectedRegion(r.id)} style={{ padding: 16, borderRadius: 18, marginBottom: 10, background: selectedRegion === r.id ? '#EBF5FF' : '#F3F4F6' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{r.emoji} {r.name}</span><span style={{ color: '#2E7DDB', fontWeight: 800 }}>{Math.round(70 + (r.score / 10))}%</span></div>
                                {selectedRegion === r.id && <button onClick={() => handleGenerate(r.id)} style={{ width: '100%', marginTop: 10, padding: 10, background: '#2E7DDB', color: 'white', borderRadius: 12 }}>Générer itinéraire</button>}
                            </div>
                        ))}
                    </>)}
                    {step === 'generating' && (<div style={{ textAlign: 'center', padding: 40 }}>{guideLimitReached ? <><p>Limite atteinte!</p><a href="/pricing">Premium</a></> : <><p>GeaiAI crée ton itinéraire...</p></>}</div>)}
                    {step === 'guide' && guide && (
                        <div>
                            <h3 style={{ fontSize: 18, fontWeight: 800 }}>{guide.title}</h3>
                            <p style={{ fontSize: 13, color: '#4B5563', margin: '10px 0' }}>{guide.summary}</p>
                            {guide.days.map((d: any, i: number) => (
                                <div key={i} style={{ marginBottom: 10, padding: 12, background: '#F9FAFB', borderRadius: 12 }}>
                                    <div style={{ fontWeight: 700 }}>Jour {i + 1}: {d.title}</div>
                                    <div style={{ fontSize: 12, color: '#6B7280' }}>{d.theme}</div>
                                </div>
                            ))}
                            <button onClick={onClose} style={{ width: '100%', marginTop: 20, padding: 12, background: '#2E7DDB', color: 'white', borderRadius: 12 }}>Terminer</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
