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
    const top3 = useMemo(() => rankedRegions.slice(0, 3), [rankedRegions]);

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
                    {/* ═══ ENERGY ═══ */}
                    {step === 'energy' && (<>
                        <Title icon="⚡" text="Ton niveau d'énergie en voyage?" sub="Journées bien remplies ou on prend ça relax?" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Opt icon="🔥" label="Intense" desc="Lever tôt, coucher tard, voir un max" value="intense" current={answers.energy} onClick={(v: string) => { set('energy', v); setTimeout(next, 300); }} />
                            <Opt icon="⚖️" label="Équilibré" desc="Activités le jour, soirées relax" value="mixed" current={answers.energy} onClick={(v: string) => { set('energy', v); setTimeout(next, 300); }} />
                            <Opt icon="🌊" label="Tranquille" desc="Pas de rush, on profite du moment" value="relax" current={answers.energy} onClick={(v: string) => { set('energy', v); setTimeout(next, 300); }} />
                        </div>
                    </>)}

                    {/* ═══ SEASON ═══ */}
                    {step === 'season' && (<>
                        <Title icon="🗓️" text="Tu penses voyager quand?" sub="La saison change tout au Québec!" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Opt icon="☀️" label="Été (juin-août)" desc="Festivals, plages, vélo, nature" value="summer" current={answers.season} onClick={(v: string) => { set('season', v); setTimeout(next, 300); }} />
                            <Opt icon="🍂" label="Automne (sept-oct)" desc="Couleurs, vendanges, randonnée" value="fall" current={answers.season} onClick={(v: string) => { set('season', v); setTimeout(next, 300); }} />
                            <Opt icon="❄️" label="Hiver (déc-mars)" desc="Ski, traîneau, patinage, Carnaval" value="winter" current={answers.season} onClick={(v: string) => { set('season', v); setTimeout(next, 300); }} />
                            <Opt icon="🌸" label="Printemps (avril-mai)" desc="Cabanes à sucre, renouveau" value="spring" current={answers.season} onClick={(v: string) => { set('season', v); setTimeout(next, 300); }} />
                            <Opt icon="🤷" label="Pas encore décidé" desc="On verra!" value="flexible" current={answers.season} onClick={(v: string) => { set('season', v); setTimeout(next, 300); }} />
                        </div>
                    </>)}

                    {/* ═══ FOOD ═══ */}
                    {step === 'food' && (<>
                        <Title icon="🍴" text="Côté bouffe, t'es comment?" sub="Choisis tout ce qui te parle" />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {[
                                { icon: '🧀', label: 'Terroir & fromages', value: 'terroir' },
                                { icon: '🍷', label: 'Vin & vignobles', value: 'wine' },
                                { icon: '🍺', label: 'Microbrasseries', value: 'micro' },
                                { icon: '⭐', label: 'Fine dining', value: 'fine-dining' },
                                { icon: '🍁', label: 'Cabane à sucre', value: 'sugar-shack' },
                                { icon: '🦞', label: 'Fruits de mer', value: 'seafood' },
                                { icon: '🥐', label: 'Cafés & brunchs', value: 'cafe' },
                                { icon: '🌮', label: 'Street food', value: 'street-food' },
                                { icon: '🫐', label: 'Cueillette & marchés', value: 'market' },
                                { icon: '🍽', label: 'Je mange de tout!', value: 'all' },
                            ].map(c => (
                                <Chip key={c.value} {...c} toggleKey="food" />
                            ))}
                        </div>
                        <button onClick={next} disabled={answers.food.length === 0}
                            style={{
                                display: 'block', width: '100%', marginTop: 20, padding: '12px', borderRadius: 14,
                                border: 'none', cursor: answers.food.length > 0 ? 'pointer' : 'not-allowed',
                                background: answers.food.length > 0 ? 'linear-gradient(135deg, #2E7DDB, #1A3A6B)' : 'rgba(26,43,66,.06)',
                                color: answers.food.length > 0 ? 'white' : '#5A6B80',
                                fontSize: 14, fontWeight: 700, fontFamily: F,
                            }}>Continuer</button>
                    </>)}
                    {/* ═══ ACCOMMODATION ═══ */}
                    {step === 'accommodation' && (<>
                        <Title icon="🏨" text="Tu dors où idéalement?" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Opt icon="⛺" label="Camping / prêt-à-camper" desc="Proche de la nature" value="camping" current={answers.accommodation} onClick={(v: string) => { set('accommodation', v); setTimeout(next, 300); }} />
                            <Opt icon="🏡" label="Chalet / Airbnb" desc="Comme à la maison" value="chalet" current={answers.accommodation} onClick={(v: string) => { set('accommodation', v); setTimeout(next, 300); }} />
                            <Opt icon="🏨" label="Hôtel / auberge" desc="Confort classique" value="hotel" current={answers.accommodation} onClick={(v: string) => { set('accommodation', v); setTimeout(next, 300); }} />
                            <Opt icon="✨" label="Boutique / luxe" desc="Se gâter" value="luxury" current={answers.accommodation} onClick={(v: string) => { set('accommodation', v); setTimeout(next, 300); }} />
                            <Opt icon="🛖" label="Hébergement insolite" desc="Yourte, cabane, igloo..." value="unique" current={answers.accommodation} onClick={(v: string) => { set('accommodation', v); setTimeout(next, 300); }} />
                        </div>
                    </>)}

                    {/* ═══ TRANSPORT ═══ */}
                    {step === 'transport' && (<>
                        <Title icon="🚗" text="Comment tu te déplaces?" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Opt icon="🚗" label="En auto" desc="Liberté totale" value="car" current={answers.transport} onClick={(v: string) => { set('transport', v); setTimeout(next, 300); }} />
                            <Opt icon="🚐" label="Location / VR" desc="Road trip style" value="rental" current={answers.transport} onClick={(v: string) => { set('transport', v); setTimeout(next, 300); }} />
                            <Opt icon="🚌" label="Transport en commun" desc="Bus, train" value="transit" current={answers.transport} onClick={(v: string) => { set('transport', v); setTimeout(next, 300); }} />
                            <Opt icon="🚲" label="Vélo / actif" desc="Cyclotourisme" value="bike" current={answers.transport} onClick={(v: string) => { set('transport', v); setTimeout(next, 300); }} />
                        </div>
                    </>)}
                    {/* ═══ DURATION ═══ */}
                    {step === 'duration' && (<>
                        <Title icon="📅" text="Combien de jours?" sub="On adaptera l'itinéraire à ta durée" />
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, margin: '30px 0' }}>
                            <button onClick={() => set('duration', Math.max(2, answers.duration - 1))}
                                style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(46,125,219,.2)', background: 'rgba(46,125,219,.05)', color: '#2E7DDB', fontSize: 24, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>−</button>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 48, fontWeight: 800, color: '#2E7DDB', fontFamily: F }}>{answers.duration}</div>
                                <div style={{ fontSize: 13, color: '#5A7089' }}>jours</div>
                            </div>
                            <button onClick={() => set('duration', Math.min(14, answers.duration + 1))}
                                style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(46,125,219,.2)', background: 'rgba(46,125,219,.05)', color: '#2E7DDB', fontSize: 24, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>+</button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                            {[3, 5, 7, 10].map(d => (
                                <button key={d} onClick={() => set('duration', d)}
                                    style={{ padding: '6px 16px', borderRadius: 100, border: answers.duration === d ? '2px solid #2E7DDB' : '1px solid rgba(26,43,66,.08)', background: answers.duration === d ? 'rgba(46,125,219,.12)' : 'rgba(26,43,66,.03)', color: answers.duration === d ? '#2E7DDB' : '#8FA3B8', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                                    {d} jours
                                </button>
                            ))}
                        </div>
                        <button onClick={next} style={{
                            display: 'block', width: '100%', padding: '12px', borderRadius: 14, border: 'none',
                            background: 'linear-gradient(135deg, #2E7DDB, #1A3A6B)', color: 'white',
                            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: F,
                        }}>Continuer</button>
                    </>)}

                    {/* ═══ BUDGET ═══ */}
                    {step === 'budget' && (<>
                        <Title icon="💰" text="Ton budget voyage?" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Opt icon="🎒" label="Économique" desc="Camping, restos abordables, activités gratuites" value="budget" current={answers.budget} onClick={(v: string) => { set('budget', v); setTimeout(next, 300); }} />
                            <Opt icon="🏨" label="Modéré" desc="Hôtels 3★, bons restos, activités variées" value="moderate" current={answers.budget} onClick={(v: string) => { set('budget', v); setTimeout(next, 300); }} />
                            <Opt icon="✨" label="On se gâte" desc="Hôtels 4-5★, gastronomie, expériences premium" value="luxury" current={answers.budget} onClick={(v: string) => { set('budget', v); setTimeout(next, 300); }} />
                        </div>
                    </>)}

                    {/* ═══ SPECIAL ═══ */}
                    {step === 'special' && (<>
                        <Title icon="💬" text="Un souhait spécial?" sub="Quelque chose de précis que tu veux absolument voir ou faire? (optionnel)" />
                        <textarea
                            value={answers.special}
                            onChange={e => set('special', e.target.value)}
                            placeholder="Ex: Je veux absolument voir des baleines, J'adore les escape games, On fête notre anniversaire..."
                            style={{
                                width: '100%', minHeight: 100, padding: 14, borderRadius: 14,
                                border: '1.5px solid rgba(46,125,219,.1)', background: 'rgba(26,43,66,.03)',
                                color: '#1A2B42', fontSize: 13, fontFamily: F, resize: 'vertical',
                                outline: 'none',
                            }}
                        />
                        <button onClick={next} style={{
                            display: 'block', width: '100%', marginTop: 16, padding: '14px', borderRadius: 14, border: 'none',
                            background: 'linear-gradient(135deg, #2E7DDB, #1A3A6B)', color: 'white',
                            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: F,
                            boxShadow: '0 4px 20px rgba(46,125,219,.3)',
                        }}>
                            Voir mes résultats! ⚜️
                        </button>
                    </>)}
                    {/* ═══ RESULTS ═══ */}
                    {step === 'results' && (<>
                        <div style={{ textAlign: 'center', marginBottom: 20, animation: 'fadeUp .4s ease' }}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>⚜️</div>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A2B42', margin: '0 0 6px', fontFamily: F }}>Ton top 3 Québec!</h2>
                            <p style={{ fontSize: 12, color: '#5A7089' }}>Basé sur tes réponses, voici les régions parfaites pour toi</p>
                        </div>

                        {top3.map((region: any, idx: number) => {
                            const reasons = getMatchReasons(region, answers);
                            const medal = ['🥇', '🥈', '🥉'][idx];
                            const isSelected = selectedRegion === region.id;
                            const matchPct = Math.min(99, Math.round(60 + (region.score / (top3[0].score || 1)) * 38));

                            return (
                                <div key={region.id} className="region-card"
                                    onClick={() => setSelectedRegion(isSelected ? null : region.id)}
                                    style={{
                                        padding: '16px 18px', borderRadius: 18, marginBottom: 10,
                                        background: isSelected ? 'rgba(46,125,219,.1)' : 'rgba(26,43,66,.03)',
                                        border: isSelected ? '2px solid rgba(46,125,219,.4)' : '1px solid rgba(26,43,66,.06)',
                                        animation: `fadeUp .4s ease ${idx * 0.12}s both`,
                                    }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                        <span style={{ fontSize: 24 }}>{medal}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 22 }}>{region.emoji}</span>
                                                <span style={{ fontSize: 16, fontWeight: 800, color: '#1A2B42' }}>{region.name}</span>
                                            </div>
                                            <div style={{ fontSize: 11, color: '#5A7089', marginTop: 2 }}>{region.tagline}</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: '#2E7DDB' }}>{matchPct}%</div>
                                            <div style={{ fontSize: 9, color: '#8FA3B8' }}>match</div>
                                        </div>
                                    </div>

                                    {/* Match reasons */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                                        {reasons.map((r, i) => (
                                            <span key={i} style={{ padding: '3px 10px', borderRadius: 100, background: 'rgba(46,125,219,.08)', fontSize: 10, fontWeight: 600, color: '#2E7DDB' }}>
                                                ✓ {r}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Highlights */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {region.highlights.map((h: string, i: number) => (
                                            <span key={i} style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(26,43,66,.04)', fontSize: 9, color: '#8FA3B8' }}>
                                                {h}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Generate CTA */ }
                            {
                                isSelected && (
                                    <button onClick={(e) => { e.stopPropagation(); handleGenerate(region.id); }}
                                        style={{
                                            display: 'block', width: '100%', marginTop: 12, padding: '12px', borderRadius: 14, border: 'none',
                                            background: 'linear-gradient(135deg, #2E7DDB, #1A3A6B)', color: 'white',
                                            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: F,
                                            boxShadow: '0 4px 16px rgba(46,125,219,.3)',
                                            animation: 'fadeUp .3s ease',
                                        }}>
                                        ✨ Générer mon itinéraire {region.name}
                                    </button>
                                )
                            }
                            </div>
                    );
                    })}

                    {/* Other regions */}
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(26,43,66,.04)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA3B8', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Autres régions</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {rankedRegions.slice(3).map(region => (
                                <button key={region.id}
                                    onClick={() => { setSelectedRegion(region.id); }}
                                    style={{
                                        padding: '6px 12px', borderRadius: 100,
                                        border: selectedRegion === region.id ? '1.5px solid #2E7DDB' : '1px solid rgba(26,43,66,.06)',
                                        background: selectedRegion === region.id ? 'rgba(46,125,219,.1)' : 'rgba(26,43,66,.03)',
                                        color: selectedRegion === region.id ? '#2E7DDB' : '#5A7089',
                                        fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                                    }}>
                                    {region.emoji} {region.name}
                                </button>
                            ))}
                        </div>
                        {selectedRegion && !top3.find(r => r.id === selectedRegion) && (
                            <button onClick={() => handleGenerate(selectedRegion)}
                                style={{
                                    display: 'block', width: '100%', marginTop: 12, padding: '12px', borderRadius: 14, border: 'none',
                                    background: 'linear-gradient(135deg, #2E7DDB, #1A3A6B)', color: 'white',
                                    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: F,
                                    animation: 'fadeUp .3s ease',
                                }}>
                                ✨ Générer mon itinéraire {QC_REGIONS.find(r => r.id === selectedRegion)?.name}
                            </button>
                        )}
                    </div>

                    {/* Re-do quiz */}
                    <button onClick={() => { setStep('welcome'); setAnswers({ ...INITIAL_ANSWERS }); setSelectedRegion(null); }}
                        style={{ display: 'block', margin: '20px auto 0', padding: '6px 16px', borderRadius: 100, border: 'none', background: 'rgba(26,43,66,.04)', color: '#8FA3B8', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                        🔄 Recommencer le quiz
                    </button>
                </>)}

                {/* ═══ GENERATING (loading) ═══ */}
                {step === 'generating' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', textAlign: 'center', animation: 'fadeUp .4s ease' }}>
                        {guideLimitReached ? (
                            <>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1A2B42', fontFamily: F }}>Guide gratuit utilisé!</h3>
                                <p style={{ fontSize: 14, color: '#5A7089', margin: '10px 0 24px' }}>Passe à Premium pour des guides illimités.</p>
                                <a href="/pricing" style={{ padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', color: 'white', fontSize: 15, fontWeight: 700, textDecoration: 'none', fontFamily: F }}>⚡ Plans Premium</a>
                                <button onClick={() => setStep('results')} style={{ marginTop: 14, background: 'none', border: 'none', color: '#8FA3B8', fontSize: 13, cursor: 'pointer', fontFamily: F }}>← Retour aux résultats</button>
                            </>
                        ) : (
                            <>
                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#EEF2FF,#F0F7FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, animation: 'pulse 2s ease-in-out infinite' }}>
                                    <span style={{ fontSize: 30 }}>🤖</span>
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A2B42', margin: '0 0 8px', fontFamily: F }}>GeaiAI crée ton itinéraire...</h3>
                                <p style={{ fontSize: 13, color: '#5A7089' }}>Recherche des meilleurs spots au Québec</p>
                                <div style={{ display: 'flex', gap: 6, marginTop: 24 }}>
                                    {[0, 1, 2].map(i => (
                                        <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#2E7DDB', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                                    ))}
                                </div>
                                {guideError && <p style={{ marginTop: 16, fontSize: 12, color: '#DC2626' }}>{guideError}</p>}
                            </>
                        )}
                    </div>
                )}

                {/* ═══ GUIDE RESULT ═══ */}
                {step === 'guide' && guide && (
                    <div style={{ animation: 'fadeUp .4s ease' }}>
                        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1A2B42', margin: '0 0 6px', fontFamily: F }}>{guide.title || 'Ton itinéraire Québec'}</h3>
                        <p style={{ fontSize: 12, color: '#5A7089', margin: '0 0 16px', lineHeight: 1.5 }}>{guide.summary}</p>

                        {/* Accommodation */}
                        {guide.accommodation && (
                            <div style={{ padding: '12px 14px', borderRadius: 14, marginBottom: 12, background: 'rgba(46,125,219,0.04)', border: '1px solid rgba(46,125,219,0.1)' }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <span style={{ fontSize: 20 }}>🏨</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: '#2E7DDB', textTransform: 'uppercase' as const }}>HÉBERGEMENT</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2B42' }}>{guide.accommodation.name}</div>
                                        <div style={{ fontSize: 11, color: '#5A7089' }}>{guide.accommodation.type} · {guide.accommodation.neighborhood}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: '#2E7DDB' }}>{guide.accommodation.price_per_night}$</div>
                                        <div style={{ fontSize: 9, color: '#8FA3B8' }}>/nuit</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Budget summary */}
                        {guide.budget_summary && (
                            <div style={{ padding: '12px 14px', borderRadius: 14, marginBottom: 12, background: 'rgba(26,43,66,.02)', border: '1px solid rgba(26,43,66,0.06)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#1A2B42', marginBottom: 8 }}>💰 Budget total estimé</div>
                                {[
                                    ['🏨 Hébergement', guide.budget_summary.accommodation_total],
                                    ['🍽 Repas', guide.budget_summary.food_total],
                                    ['🎯 Activités', guide.budget_summary.activities_total],
                                    ['🚕 Transport', guide.budget_summary.transport_local_total],
                                ].map(([l, v]) => (
                                    <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid rgba(26,43,66,0.04)' }}>
                                        <span style={{ color: '#5A7089' }}>{l}</span><span style={{ fontWeight: 600, color: '#1A2B42' }}>{v}$</span>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, marginTop: 6, paddingTop: 6, borderTop: '2px solid rgba(46,125,219,0.15)' }}>
                                    <span style={{ color: '#1A2B42' }}>Total</span><span style={{ color: '#2E7DDB' }}>~{guide.budget_summary.total_per_person}$ CAD</span>
                                </div>
                            </div>
                        )}

                        {/* Highlights */}
                        {guide.highlights?.length > 0 && (
                            <div style={{ padding: '12px 14px', borderRadius: 14, marginBottom: 16, background: 'rgba(46,125,219,.04)', border: '1px solid rgba(46,125,219,0.1)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#2E7DDB', marginBottom: 6 }}>✨ Points forts</div>
                                {guide.highlights.map((h: string, i: number) => (<div key={i} style={{ fontSize: 12, color: '#1A2B42', marginBottom: 3 }}>→ {h}</div>))}
                            </div>
                        )}

                        {/* DAY BY DAY */}
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A2B42', margin: '0 0 10px' }}>📅 Itinéraire jour par jour</h3>
                        {(guide.days || []).map((day: any, i: number) => {
                            const isExp = expandedDay === i;
                            const DCOL = ['#2E7DDB', '#0E9AA7', '#F5A623', '#E84855', '#7C3AED', '#059669', '#DB2777'];
                            const col = DCOL[i % DCOL.length];
                            return (
                                <div key={i} style={{ marginBottom: 6, borderRadius: 14, overflow: 'hidden', border: `1px solid ${isExp ? col + '20' : 'rgba(26,43,66,0.06)'}`, background: isExp ? 'rgba(46,125,219,.02)' : 'white' }}>
                                    <button onClick={() => setExpandedDay(isExp ? -1 : i)} style={{ width: '100%', padding: '12px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: F }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ width: 28, height: 28, borderRadius: 10, background: isExp ? col : '#F0F4F8', color: isExp ? 'white' : '#5A7089', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{day.day || i + 1}</span>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2B42' }}>{day.title}</div>
                                                <div style={{ fontSize: 10, color: '#8FA3B8' }}>{day.theme} {day.total_cost ? `· ${day.total_cost}$` : ''}</div>
                                            </div>
                                        </div>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8FA3B8" strokeWidth="2.5" style={{ transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M6 9l6 6 6-6" /></svg>
                                    </button>
                                    {isExp && (
                                        <div style={{ padding: '0 12px 12px' }}>
                                            {['morning', 'lunch', 'afternoon', 'dinner', 'evening'].map(slot => {
                                                const d = day[slot];
                                                if (!d) return null;
                                                const slotLabels: Record<string, { icon: string; label: string }> = {
                                                    morning: { icon: '🌅', label: 'Matin' },
                                                    lunch: { icon: '🥗', label: 'Dîner' },
                                                    afternoon: { icon: '☀️', label: 'Après-midi' },
                                                    dinner: { icon: '🍽️', label: 'Souper' },
                                                    evening: { icon: '🌙', label: 'Soirée' },
                                                };
                                                const s = slotLabels[slot];
                                                return (
                                                    <div key={slot} style={{ padding: '8px 10px', borderRadius: 10, background: 'white', border: '1px solid rgba(26,43,66,0.04)', marginBottom: 4 }}>
                                                        <div style={{ fontSize: 9, fontWeight: 700, color: col, textTransform: 'uppercase' as const }}>{s.icon} {s.label} · {d.duration || ''}</div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2B42' }}>{d.activity || d.name}</div>
                                                        {d.location && <div style={{ fontSize: 11, color: '#5A7089' }}>📍 {d.location}</div>}
                                                        {d.description && <div style={{ fontSize: 11, color: '#5A7089', marginTop: 2 }}>{d.description}</div>}
                                                        {d.tip && <div style={{ fontSize: 10, color: '#8FA3B8', fontStyle: 'italic', marginTop: 2 }}>💡 {d.tip}</div>}
                                                        {d.cost !== undefined && <div style={{ fontSize: 11, fontWeight: 700, color: '#2E7DDB', marginTop: 2 }}>{d.cost}$</div>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Tips */}
                        {guide.region_tips && (
                            <div style={{ padding: '12px 14px', borderRadius: 14, marginTop: 14, background: 'rgba(22,163,74,0.04)', border: '1px solid rgba(22,163,74,0.1)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', marginBottom: 4 }}>🤫 Tips locaux</div>
                                <div style={{ fontSize: 12, color: '#1A2B42' }}>{guide.region_tips}</div>
                            </div>
                        )}
                        {guide.packing_list?.length > 0 && (
                            <div style={{ padding: '12px 14px', borderRadius: 14, marginTop: 10, background: 'rgba(5,150,105,0.03)', border: '1px solid rgba(5,150,105,0.08)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginBottom: 4 }}>🎒 À ne pas oublier</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {guide.packing_list.map((it: string, j: number) => (<span key={j} style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(5,150,105,0.06)', fontSize: 10, fontWeight: 600, color: '#059669' }}>{it}</span>))}
                                </div>
                            </div>
                        )}

                        <button onClick={onClose} style={{ display: 'block', width: '100%', marginTop: 20, padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#2E7DDB,#1B5BA0)', color: 'white', fontSize: 14, fontWeight: 700, fontFamily: F }}>
                            ⚜️ Fermer
                        </button>
                        <button onClick={() => { setStep('results'); setGuide(null); }}
                            style={{ display: 'block', margin: '10px auto 0', padding: '6px 16px', borderRadius: 100, border: 'none', background: 'rgba(26,43,66,.04)', color: '#8FA3B8', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                            ← Choisir une autre région
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
