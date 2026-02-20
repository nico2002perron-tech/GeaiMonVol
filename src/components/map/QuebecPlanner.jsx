import { useState, useRef, useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";

// ═══════════════════════════════════════════
// ADAPTIVE BRANCHING QUESTIONNAIRE
// ═══════════════════════════════════════════

const QUESTIONS = [
    {
        id: "group", q: "Tu voyages avec qui?", options: [
            { l: "Solo", i: "🧑", v: "solo" },
            { l: "En couple", i: "💑", v: "couple" },
            { l: "Famille (jeunes enfants)", i: "👶", v: "famille-jeune" },
            { l: "Famille (ados+)", i: "👨👩👧👦", v: "famille-ado" },
            { l: "Entre amis", i: "👯", v: "amis" },
            { l: "Groupe organisé", i: "🚌", v: "groupe" },
        ]
    },
    {
        id: "duration", q: "Combien de jours?", options: [
            { l: "Weekend (2-3 jours)", i: "⚡", v: "weekend" },
            { l: "Une semaine", i: "📅", v: "semaine" },
            { l: "10-14 jours", i: "🗓️", v: "long" },
            { l: "2 semaines+", i: "🌎", v: "tres-long" },
        ]
    },
    {
        id: "season", q: "Tu pars quand?", options: [
            { l: "Été (juin-août)", i: "☀️", v: "ete" },
            { l: "Automne (sept-oct)", i: "🍂", v: "automne" },
            { l: "Hiver (déc-mars)", i: "❄️", v: "hiver" },
            { l: "Printemps (avr-mai)", i: "🌸", v: "printemps" },
            { l: "Flexible", i: "🤷", v: "flexible" },
        ]
    },
    {
        id: "vibe", q: "T'es plus quel vibe?", options: [
            { l: "100% nature & plein air", i: "🌲", v: "nature" },
            { l: "Ville & culture", i: "🏙️", v: "ville" },
            { l: "Mix des deux", i: "⚡", v: "mix" },
            { l: "Zen & bien-être", i: "🧘", v: "zen" },
            { l: "Road trip aventure", i: "🛣️", v: "roadtrip" },
        ]
    },
    {
        id: "energy", q: "Ton niveau d'énergie?", options: [
            { l: "Aventure extrême — repousse mes limites", i: "🧗", v: "extreme" },
            { l: "Actif le jour, relax le soir", i: "🚴", v: "actif" },
            { l: "Tranquille — j'aime prendre mon temps", i: "😌", v: "relax" },
            { l: "Repos total — spa, lecture, zéro stress", i: "♨️", v: "repos" },
        ]
    },
    // ── BRANCH: Nature lovers ──
    {
        id: "nature_type", q: "Quel type de nature?", multi: true,
        showIf: (ans) => ["nature", "mix", "roadtrip"].includes(ans.vibe),
        options: [
            { l: "Océan & fleuve", i: "🌊", v: "mer" },
            { l: "Montagnes", i: "⛰️", v: "montagne" },
            { l: "Lacs", i: "🏞️", v: "lacs" },
            { l: "Forêts boréales", i: "🌲", v: "forets" },
            { l: "Fjords", i: "🗻", v: "fjords" },
            { l: "Villages pittoresques", i: "🏘️", v: "villages" },
        ]
    },
    {
        id: "outdoor_activities", q: "Quelles activités outdoor?", multi: true,
        showIf: (ans) => ["nature", "mix", "roadtrip"].includes(ans.vibe) || ["extreme", "actif"].includes(ans.energy),
        options: [
            { l: "Randonnée", i: "🥾", v: "rando" },
            { l: "Kayak / canot", i: "🛶", v: "kayak" },
            { l: "Vélo", i: "🚲", v: "velo" },
            { l: "Observation baleines", i: "🐳", v: "baleines" },
            { l: "Ski / planche", i: "⛷️", v: "ski" },
            { l: "Escalade / via ferrata", i: "🧗", v: "escalade" },
            { l: "Baignade", i: "🏖️", v: "baignade" },
            { l: "Pêche", i: "🎣", v: "peche" },
            { l: "Motoneige / quad", i: "🏎️", v: "motorise" },
        ]
    },
    // ── BRANCH: City lovers ──
    {
        id: "city_interests", q: "Qu'est-ce qui t'attire en ville?", multi: true,
        showIf: (ans) => ["ville", "mix"].includes(ans.vibe),
        options: [
            { l: "Musées & histoire", i: "🏛️", v: "musees" },
            { l: "Festivals & événements", i: "🎵", v: "festivals" },
            { l: "Art & galeries", i: "🎨", v: "art" },
            { l: "Nightlife & bars", i: "🍸", v: "nightlife" },
            { l: "Shopping", i: "🛍️", v: "shopping" },
            { l: "Architecture", i: "🏗️", v: "architecture" },
        ]
    },
    // ── BRANCH: Zen lovers ──
    {
        id: "zen_type", q: "Quel type de détente?", multi: true,
        showIf: (ans) => ans.vibe === "zen" || ans.energy === "repos",
        options: [
            { l: "Spa & bains nordiques", i: "♨️", v: "spa" },
            { l: "Yoga & méditation", i: "🧘", v: "yoga" },
            { l: "Vignobles & dégustation", i: "🍷", v: "vin" },
            { l: "Lecture au bord de l'eau", i: "📖", v: "lecture" },
            { l: "Massages & soins", i: "💆", v: "massages" },
        ]
    },
    // ── BRANCH: Family specific ──
    {
        id: "family_needs", q: "Besoins spéciaux pour la famille?", multi: true,
        showIf: (ans) => ["famille-jeune", "famille-ado"].includes(ans.group),
        options: [
            { l: "Poussette-friendly", i: "👶", v: "poussette" },
            { l: "Activités éducatives", i: "📚", v: "educatif" },
            { l: "Parcs d'attractions", i: "🎢", v: "attractions" },
            { l: "Baignade sécuritaire", i: "🏊", v: "baignade-famille" },
            { l: "Pas trop de route", i: "🚗", v: "courte-distance" },
        ]
    },
    // ── Common questions ──
    {
        id: "food", q: "Côté bouffe?", multi: true, options: [
            { l: "Restos locaux & terroir", i: "🥘", v: "local" },
            { l: "Gastronomique / fine dining", i: "🥂", v: "fine" },
            { l: "Street food & casse-croûtes", i: "🍟", v: "street" },
            { l: "Microbrasseries & bars", i: "🍺", v: "boire" },
            { l: "Végé / allergies", i: "🥗", v: "vege" },
            { l: "Je cuisine moi-même", i: "🏕️", v: "cuisine" },
        ]
    },
    {
        id: "accommodation", q: "Tu dors où?", options: [
            { l: "Hôtel", i: "🏨", v: "hotel" },
            { l: "Airbnb / chalet", i: "🏠", v: "airbnb" },
            { l: "Camping / glamping", i: "⛺", v: "camping" },
            { l: "Auberge de jeunesse", i: "🛏️", v: "auberge" },
            { l: "Hébergement insolite", i: "🪵", v: "insolite" },
        ]
    },
    {
        id: "transport", q: "Tu te déplaces comment?", options: [
            { l: "Auto / location", i: "🚗", v: "auto" },
            { l: "Van / VR", i: "🚐", v: "van" },
            { l: "Transport en commun", i: "🚌", v: "commun" },
            { l: "Vélo", i: "🚲", v: "velo-transport" },
            { l: "Base fixe (pas de déplacement)", i: "📍", v: "fixe" },
        ]
    },
    {
        id: "budget", q: "Budget par personne pour le séjour?", sub: "(hébergement + activités + bouffe, sans transport)", options: [
            { l: "Économe — moins de 500$", i: "💵", v: "econome" },
            { l: "Confortable — 500 à 1000$", i: "💰", v: "confortable" },
            { l: "On se gâte — 1000 à 2000$", i: "💎", v: "luxe" },
            { l: "Pas de limite!", i: "👑", v: "premium" },
        ]
    },
    {
        id: "knowledge", q: "Tu connais le Québec?", options: [
            { l: "Première visite!", i: "🆕", v: "nouveau" },
            { l: "Je connais les classiques", i: "👍", v: "classique" },
            { l: "Je veux sortir des sentiers battus", i: "🗿", v: "expert" },
            { l: "Je suis Québécois — surprends-moi", i: "⚜️", v: "local" },
        ]
    },
    {
        id: "special", q: "Un dernier souhait?", options: [
            { l: "Coucher de soleil magique", i: "🌅", v: "sunset" },
            { l: "Expérience autochtone", i: "🪶", v: "autochtone" },
            { l: "Spot secret que personne connaît", i: "🔮", v: "secret" },
            { l: "Une activité complètement folle", i: "🤪", v: "folle" },
            { l: "Surprends-moi!", i: "🎁", v: "surprise" },
        ]
    },
];

// ═══════════════════════════════════════════
// REGION SCORING
// ═══════════════════════════════════════════

const REGIONS = [
    { name: "Charlevoix", icon: "⛰️", desc: "Montagne, fleuve, terroir gastronomique", tags: ["nature", "mix", "montagne", "gastro", "fine", "local", "photo", "forets", "villages", "rando", "couple", "luxe", "automne", "sunset", "actif", "vin", "spa", "hotel", "airbnb"] },
    { name: "Gaspésie", icon: "🌊", desc: "Percé, mer, road trip épique", tags: ["nature", "roadtrip", "mer", "photo", "rando", "fjords", "faune", "baleines", "auto", "van", "extreme", "actif", "kayak", "camping", "long", "tres-long", "expert", "local"] },
    { name: "Saguenay–Lac-Saint-Jean", icon: "🐋", desc: "Fjord majestueux, baleines, aventure", tags: ["nature", "fjords", "faune", "baleines", "kayak", "rando", "photo", "extreme", "actif", "forets", "camping", "auto", "secret"] },
    { name: "Ville de Québec", icon: "🏰", desc: "Patrimoine UNESCO, charme européen", tags: ["ville", "mix", "culture", "musees", "gastro", "fine", "architecture", "villages", "nouveau", "couple", "famille-jeune", "photos", "hotel", "commun", "weekend", "shopping"] },
    { name: "Montréal", icon: "🏙️", desc: "Culture, gastronomie, nightlife", tags: ["ville", "festivals", "art", "gastro", "boire", "street", "nightlife", "amis", "culture", "nouveau", "shopping", "commun", "weekend", "architecture"] },
    { name: "Laurentides", icon: "🌲", desc: "Lacs, ski, nature accessible", tags: ["nature", "mix", "lacs", "ski", "velo", "spa", "forets", "famille-ado", "amis", "rando", "hiver", "courte-distance", "hotel", "airbnb", "attractions"] },
    { name: "Cantons-de-l'Est", icon: "🍷", desc: "Vignobles, spas, douceur de vivre", tags: ["mix", "zen", "gastro", "boire", "fine", "vin", "villages", "spa", "couple", "relax", "repos", "automne", "massages", "airbnb", "hotel"] },
    { name: "Îles-de-la-Madeleine", icon: "🏖️", desc: "Plages infinies, dépaysement total", tags: ["mer", "baignade", "photo", "deconnexion", "secret", "gastro", "local", "couple", "ete", "kayak", "velo", "long", "camping"] },
    { name: "Bas-Saint-Laurent", icon: "🦌", desc: "Couchers de soleil, quiétude absolue", tags: ["nature", "mer", "villages", "sunset", "photo", "relax", "repos", "velo", "lecture", "secret", "yoga", "camping", "airbnb"] },
    { name: "Côte-Nord", icon: "🐺", desc: "Sauvage, phares, baleines, bout du monde", tags: ["nature", "extreme", "faune", "baleines", "mer", "photo", "roadtrip", "secret", "auto", "van", "long", "tres-long", "expert", "local", "camping"] },
    { name: "Mauricie", icon: "🏕️", desc: "Forêts, canot, déconnexion", tags: ["nature", "forets", "lacs", "kayak", "camping", "peche", "rando", "famille-ado", "amis", "courte-distance", "baignade"] },
    { name: "Outaouais", icon: "🛶", desc: "Parcs nationaux, musées, nature urbaine", tags: ["mix", "musees", "culture", "lacs", "rando", "velo", "famille-jeune", "nouveau", "educatif", "courte-distance"] },
    { name: "Lanaudière", icon: "🎵", desc: "Festivals, nature, accessible", tags: ["mix", "festivals", "nature", "lacs", "famille-ado", "amis", "camping", "courte-distance", "econome", "baignade", "peche"] },
    { name: "Abitibi-Témiscamingue", icon: "🌌", desc: "Aurores boréales, lacs sauvages, off-grid", tags: ["nature", "extreme", "secret", "forets", "lacs", "peche", "local", "expert", "van", "camping", "tres-long"] },
];

function scoreRegions(answers) {
    const tags = [];
    Object.values(answers).forEach(v => {
        if (Array.isArray(v)) tags.push(...v);
        else if (typeof v === "string") tags.push(v);
    });

    return REGIONS.map(r => {
        const matches = r.tags.filter(t => tags.includes(t)).length;
        const score = Math.min(98, Math.round((matches / Math.max(r.tags.length, 1)) * 100));
        return { ...r, score };
    }).sort((a, b) => b.score - a.score);
}

// ═══════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════

const DCOL = ["#2E7DDB", "#0E9AA7", "#F5A623", "#E84855", "#7C3AED", "#059669", "#DB2777"];

const css = `@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700;800&display=swap');
@keyframes qB{0%{background-position:0%}50%{background-position:100%}100%{background-position:0%}}
@keyframes qI{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
@keyframes qO{from{opacity:1}to{opacity:0;transform:translateX(-20px)}}
@keyframes qF{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes qFl{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes qP{0%{transform:scale(.9);opacity:0}100%{transform:scale(1);opacity:1}}
@keyframes qG{0%,100%{box-shadow:0 0 8px rgba(46,125,219,.15)}50%{box-shadow:0 0 24px rgba(46,125,219,.3)}}
@keyframes qSpin{to{transform:rotate(360deg)}}
@keyframes qDot{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
.qS::-webkit-scrollbar{width:3px}.qS::-webkit-scrollbar-thumb{background:rgba(46,125,219,.1);border-radius:3px}`;

export default function QuebecPlanner({ onClose }) {
    const { user } = useAuth();
    const scrollRef = useRef(null);

    // ── State ──
    const [step, setStep] = useState("quiz"); // quiz | ranking | loading | result | error
    const [qIdx, setQIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [multiSel, setMultiSel] = useState([]);
    const [animDir, setAnimDir] = useState("in");
    const [region, setRegion] = useState(null);
    const [guide, setGuide] = useState(null);
    const [guideId, setGuideId] = useState(null);
    const [expandedDay, setExpandedDay] = useState(0);
    const [error, setError] = useState("");
    const [ratings, setRatings] = useState({});

    // ── Filtered questions (adaptive branching) ──
    const activeQuestions = useMemo(() => {
        return QUESTIONS.filter(q => !q.showIf || q.showIf(answers));
    }, [answers]);

    const currentQ = activeQuestions[qIdx];
    const progress = currentQ ? ((qIdx + 1) / activeQuestions.length) * 100 : 100;
    const ranked = useMemo(() => scoreRegions(answers), [answers]);

    // ── Quiz navigation ──
    const goNext = () => {
        setAnimDir("out");
        setTimeout(() => {
            if (qIdx < activeQuestions.length - 1) {
                setQIdx(i => i + 1);
                setMultiSel([]);
                setAnimDir("in");
            } else {
                setStep("ranking");
            }
        }, 250);
    };

    const doSingle = (v) => {
        setAnswers(p => ({ ...p, [currentQ.id]: v }));
        goNext();
    };

    const toggleMulti = (v) => setMultiSel(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

    const confirmMulti = () => {
        if (!multiSel.length) return;
        setAnswers(p => ({ ...p, [currentQ.id]: multiSel }));
        goNext();
    };

    const goBack = () => {
        if (qIdx > 0) {
            setAnimDir("out");
            setTimeout(() => {
                setQIdx(i => i - 1);
                setMultiSel([]);
                setAnimDir("in");
            }, 200);
        }
    };

    // ── Pick region → generate via AI ──
    const pickRegion = async (regionName) => {
        setRegion(regionName);
        setStep("loading");
        setError("");

        // Build preferences string from all answers
        const allPrefs = [];
        Object.entries(answers).forEach(([key, val]) => {
            if (Array.isArray(val)) allPrefs.push(...val);
            else allPrefs.push(val);
        });

        const durationMap = { weekend: 3, semaine: 7, long: 12, "tres-long": 16 };
        const tripDays = durationMap[answers.duration] || 7;
        const budgetMap = { econome: "budget", confortable: "moderate", luxe: "luxury", premium: "luxury" };

        try {
            const res = await fetch("/api/guide/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    destination: regionName,
                    destination_code: null,
                    country: "Canada (Québec)",
                    departure_date: null,
                    return_date: null,
                    price: 0,
                    airline: null,
                    stops: null,
                    trip_days: tripDays,
                    rest_days: Math.max(1, Math.floor(tripDays / 5)),
                    budget_style: budgetMap[answers.budget] || "moderate",
                    preferences: allPrefs,
                    // Extra context for AI
                    quiz_context: {
                        group: answers.group,
                        vibe: answers.vibe,
                        energy: answers.energy,
                        season: answers.season,
                        accommodation: answers.accommodation,
                        transport: answers.transport,
                        food: answers.food,
                        knowledge: answers.knowledge,
                        special: answers.special,
                    },
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.error === "limit_reached") {
                    setError("Tu as atteint ta limite de guides gratuits. Passe à Premium pour continuer!");
                } else {
                    setError(data.message || data.error || "Erreur lors de la génération");
                }
                setStep("error");
                return;
            }

            setGuide(data.guide);
            setGuideId(data.guide_id);
            setExpandedDay(0);
            setStep("result");
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
        } catch (err) {
            setError("Erreur de connexion. Réessaie!");
            setStep("error");
        }
    };

    const reset = () => {
        setStep("quiz");
        setQIdx(0);
        setAnswers({});
        setMultiSel([]);
        setRegion(null);
        setGuide(null);
        setGuideId(null);
        setExpandedDay(0);
        setError("");
        setRatings({});
    };

    // ═══════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
            style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.45)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12, fontFamily: "'Fredoka',sans-serif" }}
        >
            <style>{css}</style>
            <div
                className="qS"
                ref={scrollRef}
                style={{
                    width: "100%",
                    maxWidth: step === "result" ? 780 : step === "ranking" ? 620 : 520,
                    maxHeight: "94vh",
                    overflow: "auto",
                    background: "linear-gradient(175deg,#F8FAFF,#EDF2FB,#E4EAF6)",
                    borderRadius: 28,
                    border: "1px solid rgba(46,125,219,.08)",
                    boxShadow: "0 32px 80px rgba(0,0,0,.2),inset 0 0 0 1px rgba(255,255,255,.5)",
                    transition: "max-width .5s cubic-bezier(.25,.46,.45,.94)",
                    position: "relative",
                }}
            >
                {/* Top gradient bar */}
                <div style={{ height: 3, borderRadius: "28px 28px 0 0", background: "linear-gradient(90deg,#2E7DDB,#60A5FA,#2E5A9E,#1A3A6B,#2E5A9E,#60A5FA,#2E7DDB)", backgroundSize: "300%", animation: "qB 5s ease infinite" }} />

                {/* Close button */}
                {onClose && (
                    <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, zIndex: 10, width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(26,58,107,.06)", color: "rgba(26,58,107,.4)", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fredoka',sans-serif" }}>✕</button>
                )}

                {/* ════════ QUIZ ════════ */}
                {step === "quiz" && currentQ && (
                    <div style={{ padding: "26px 26px 32px" }}>
                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                            <div style={{ fontSize: 32, animation: "qFl 3s ease-in-out infinite" }}>⚜️</div>
                            <h2 style={{ fontSize: 21, fontWeight: 800, color: "#0F1D2F", margin: "2px 0" }}>Planifie ton voyage au Québec</h2>
                            <p style={{ fontSize: 12, color: "#5A6B80", margin: "3px 0 14px" }}>L'IA va créer ton itinéraire parfait</p>

                            {/* Progress bar */}
                            <div style={{ width: "100%", height: 7, borderRadius: 4, background: "rgba(46,125,219,.06)" }}>
                                <div style={{ width: `${progress}%`, height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#2E7DDB,#60A5FA)", transition: "width .4s" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                                <span style={{ fontSize: 10, color: "#8A9AB5", fontWeight: 600, textTransform: "uppercase" }}>{currentQ.id.replace(/_/g, " ")}</span>
                                <span style={{ fontSize: 11, color: "#2E7DDB", fontWeight: 700 }}>{qIdx + 1}/{activeQuestions.length}</span>
                            </div>
                        </div>

                        <div key={currentQ.id} style={{ animation: animDir === "in" ? "qI .3s ease" : "qO .2s ease" }}>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F1D2F", textAlign: "center", marginBottom: 3 }}>{currentQ.q}</h3>
                            {currentQ.sub && <p style={{ fontSize: 11, color: "#8A9AB5", textAlign: "center", marginBottom: 8 }}>{currentQ.sub}</p>}
                            {currentQ.multi && <p style={{ fontSize: 10.5, color: "#2E7DDB", textAlign: "center", fontWeight: 600, marginBottom: 8 }}>✨ Choisis-en plusieurs</p>}

                            <div style={{ display: "grid", gridTemplateColumns: currentQ.options.length <= 4 ? "1fr" : "1fr 1fr", gap: 7 }}>
                                {currentQ.options.map((o) => {
                                    const sel = currentQ.multi ? multiSel.includes(o.v) : answers[currentQ.id] === o.v;
                                    return (
                                        <button
                                            key={o.v}
                                            onClick={() => currentQ.multi ? toggleMulti(o.v) : doSingle(o.v)}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 9, padding: "11px 12px", borderRadius: 13,
                                                border: sel ? "2px solid #2E7DDB" : "1.5px solid rgba(46,125,219,.04)",
                                                background: sel ? "rgba(46,125,219,.04)" : "white",
                                                cursor: "pointer", textAlign: "left", fontFamily: "'Fredoka',sans-serif", transition: "all .2s",
                                            }}
                                        >
                                            <span style={{ fontSize: 20, flexShrink: 0 }}>{o.i}</span>
                                            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0F1D2F" }}>{o.l}</span>
                                            {sel && currentQ.multi && <span style={{ marginLeft: "auto", color: "#2E7DDB", fontWeight: 800 }}>✓</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            {currentQ.multi && (
                                <button onClick={confirmMulti} disabled={!multiSel.length} style={{ display: "block", margin: "14px auto 0", padding: "10px 24px", borderRadius: 100, border: "none", background: multiSel.length ? "linear-gradient(135deg,#2E7DDB,#1A3A6B)" : "rgba(46,125,219,.06)", color: multiSel.length ? "white" : "#8A9AB5", fontSize: 13, fontWeight: 700, cursor: multiSel.length ? "pointer" : "default", fontFamily: "'Fredoka',sans-serif" }}>
                                    Confirmer ({multiSel.length}) →
                                </button>
                            )}
                        </div>

                        {qIdx > 0 && (
                            <button onClick={goBack} style={{ display: "block", margin: "10px auto 0", padding: "5px 14px", borderRadius: 100, border: "none", background: "rgba(46,125,219,.04)", color: "#2E7DDB", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Fredoka',sans-serif" }}>← Retour</button>
                        )}
                    </div>
                )}

                {/* ════════ RANKING ════════ */}
                {step === "ranking" && (
                    <div style={{ padding: "26px 24px 32px", animation: "qF .4s ease" }}>
                        <div style={{ textAlign: "center", marginBottom: 18 }}>
                            <div style={{ fontSize: 24 }}>🏆</div>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F1D2F", margin: 0 }}>Tes destinations parfaites</h2>
                            <p style={{ fontSize: 12, color: "#5A6B80", margin: "3px 0" }}>Classées par compatibilité — clique pour générer ton itinéraire IA</p>
                        </div>

                        {/* #1 Recommendation */}
                        <div
                            onClick={() => user ? pickRegion(ranked[0].name) : null}
                            style={{ marginBottom: 12, padding: "15px 16px", borderRadius: 18, background: "linear-gradient(135deg,rgba(46,125,219,.05),rgba(96,165,250,.02))", border: "2px solid rgba(46,125,219,.12)", animation: "qG 3s ease-in-out infinite", cursor: "pointer", position: "relative" }}
                        >
                            <div style={{ position: "absolute", top: 9, right: 11, background: "linear-gradient(135deg,#2E7DDB,#1A3A6B)", color: "white", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 100 }}>🥇 RECOMMANDÉ</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                <span style={{ fontSize: 28 }}>{ranked[0].icon}</span>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0F1D2F" }}>{ranked[0].name}</div>
                                    <div style={{ fontSize: 11, color: "#5A6B80" }}>{ranked[0].desc}</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                                <div style={{ flex: 1, height: 7, borderRadius: 4, background: "rgba(46,125,219,.06)", overflow: "hidden" }}>
                                    <div style={{ width: `${ranked[0].score}%`, height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#2E7DDB,#60A5FA)" }} />
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 800, color: "#2E7DDB" }}>{ranked[0].score}%</span>
                            </div>
                            <div style={{ textAlign: "center", marginTop: 8 }}>
                                <span style={{ fontSize: 11, color: "#2E7DDB", fontWeight: 700 }}>🤖 Cliquer pour générer l'itinéraire IA →</span>
                            </div>
                        </div>

                        {/* Rest of rankings */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {ranked.slice(1).map((r, i) => (
                                <div
                                    key={r.name}
                                    onClick={() => user ? pickRegion(r.name) : null}
                                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 12, background: "white", border: "1px solid rgba(46,125,219,.03)", cursor: "pointer", transition: "all .2s", animation: `qP .3s ease ${i * .04}s both` }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(4px)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
                                >
                                    <span style={{ fontSize: 10, fontWeight: 800, color: "#8A9AB5", width: 16 }}>#{i + 2}</span>
                                    <span style={{ fontSize: 17 }}>{r.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "#0F1D2F" }}>{r.name}</div>
                                        <div style={{ fontSize: 10, color: "#8A9AB5" }}>{r.desc}</div>
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: r.score > 70 ? "#2E7DDB" : "#8A9AB5" }}>{r.score}%</span>
                                </div>
                            ))}
                        </div>

                        {!user && (
                            <div style={{ textAlign: "center", marginTop: 16, padding: "12px", borderRadius: 14, background: "rgba(232,72,85,.04)", border: "1px solid rgba(232,72,85,.1)" }}>
                                <p style={{ fontSize: 12, color: "#E84855", fontWeight: 600 }}>Connecte-toi pour générer ton itinéraire IA!</p>
                            </div>
                        )}

                        <button onClick={reset} style={{ display: "block", margin: "14px auto 0", padding: "6px 14px", borderRadius: 100, border: "none", background: "rgba(46,125,219,.04)", color: "#2E7DDB", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Fredoka',sans-serif" }}>← Recommencer le quiz</button>
                    </div>
                )}

                {/* ════════ LOADING ════════ */}
                {step === "loading" && (
                    <div style={{ padding: "60px 30px", textAlign: "center", animation: "qF .4s ease" }}>
                        <div style={{ width: 56, height: 56, margin: "0 auto 20px", borderRadius: "50%", border: "4px solid rgba(46,125,219,.1)", borderTopColor: "#2E7DDB", animation: "qSpin 1s linear infinite" }} />
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F1D2F", margin: "0 0 6px" }}>L'IA planifie ton voyage...</h3>
                        <p style={{ fontSize: 13, color: "#5A6B80", margin: 0 }}>⚜️ {region}</p>
                        <p style={{ fontSize: 11, color: "#8A9AB5", marginTop: 12 }}>Itinéraire jour par jour, restos, activités, budget...</p>
                        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
                            {[0, 1, 2].map(i => (
                                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#2E7DDB", animation: `qDot 1.4s ease-in-out ${i * 0.16}s infinite` }} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ════════ ERROR ════════ */}
                {step === "error" && (
                    <div style={{ padding: "50px 30px", textAlign: "center", animation: "qF .4s ease" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F1D2F", margin: "0 0 8px" }}>Oups!</h3>
                        <p style={{ fontSize: 13, color: "#5A6B80", margin: "0 0 20px" }}>{error}</p>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                            <button onClick={() => pickRegion(region)} style={{ padding: "10px 20px", borderRadius: 100, border: "none", background: "linear-gradient(135deg,#2E7DDB,#1A3A6B)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Fredoka',sans-serif" }}>Réessayer</button>
                            <button onClick={() => setStep("ranking")} style={{ padding: "10px 20px", borderRadius: 100, border: "1px solid rgba(46,125,219,.1)", background: "white", color: "#2E7DDB", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Fredoka',sans-serif" }}>Choisir une autre région</button>
                        </div>
                    </div>
                )}

                {/* ════════ RESULT ════════ */}
                {step === "result" && guide && (
                    <div style={{ animation: "qF .4s ease" }}>
                        {/* Header */}
                        <div style={{ padding: "22px 22px 16px", textAlign: "center", background: "linear-gradient(170deg,rgba(46,125,219,.04),transparent)", borderBottom: "1px solid rgba(46,125,219,.05)" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#2E7DDB", marginBottom: 3 }}>⚜️ {region} · Généré par IA</div>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F1D2F", margin: "0 0 2px" }}>{guide.title}</h2>
                            <p style={{ fontSize: 12, color: "#5A6B80", margin: "0 0 6px" }}>{guide.summary}</p>

                            {guide.budget_summary && (
                                <div style={{ display: "inline-flex", gap: 12, padding: "9px 18px", borderRadius: 14, background: "white", border: "1px solid rgba(46,125,219,.08)", marginTop: 6 }}>
                                    <div>
                                        <div style={{ fontSize: 9, color: "#8A9AB5", fontWeight: 700 }}>TOTAL ESTIMÉ</div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: "#2E7DDB" }}>{guide.budget_summary.total_per_person}$</div>
                                    </div>
                                    <div style={{ borderLeft: "1px solid rgba(46,125,219,.08)", paddingLeft: 12 }}>
                                        <div style={{ fontSize: 9, color: "#8A9AB5", fontWeight: 700 }}>HÉBERGEMENT</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F1D2F" }}>{guide.budget_summary.accommodation_total}$</div>
                                    </div>
                                    <div style={{ borderLeft: "1px solid rgba(46,125,219,.08)", paddingLeft: 12 }}>
                                        <div style={{ fontSize: 9, color: "#8A9AB5", fontWeight: 700 }}>ACTIVITÉS</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F1D2F" }}>{guide.budget_summary.activities_total}$</div>
                                    </div>
                                </div>
                            )}

                            {guide.accommodation && (
                                <div style={{ marginTop: 8, fontSize: 11, color: "#5A6B80" }}>
                                    🏨 {guide.accommodation.name} · {guide.accommodation.neighborhood} · {guide.accommodation.price_per_night}$/nuit
                                </div>
                            )}
                        </div>

                        {/* Highlights */}
                        {guide.highlights && (
                            <div style={{ padding: "10px 16px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {guide.highlights.map((h, j) => (
                                    <span key={j} style={{ padding: "3px 10px", borderRadius: 100, background: "rgba(46,125,219,.04)", fontSize: 11, fontWeight: 600, color: "#2E7DDB" }}>✨ {h}</span>
                                ))}
                            </div>
                        )}

                        {/* Day tabs */}
                        <div style={{ display: "flex", gap: 0, padding: "0 6px", overflowX: "auto", borderBottom: "1px solid rgba(46,125,219,.04)" }}>
                            {guide.days?.map((d, i) => (
                                <button
                                    key={i}
                                    onClick={() => setExpandedDay(i)}
                                    style={{
                                        flex: "0 0 auto", padding: "9px 9px", border: "none",
                                        borderBottom: expandedDay === i ? `3px solid ${DCOL[i % DCOL.length]}` : "3px solid transparent",
                                        background: "transparent", color: expandedDay === i ? DCOL[i % DCOL.length] : "#8A9AB5",
                                        fontSize: 11, fontWeight: expandedDay === i ? 700 : 600,
                                        cursor: "pointer", fontFamily: "'Fredoka',sans-serif",
                                    }}
                                >
                                    <div>J{d.day}</div>
                                    <div style={{ fontSize: 8.5 }}>{d.total_cost}$</div>
                                </button>
                            ))}
                        </div>

                        {/* Day detail */}
                        {guide.days?.map((d, i) => expandedDay === i ? (
                            <div key={i} style={{ padding: "14px 16px 18px", animation: "qF .25s ease" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, color: DCOL[i % DCOL.length], margin: 0 }}>{d.theme} {d.title}</h3>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: DCOL[i % DCOL.length], padding: "2px 8px", borderRadius: 100, background: `${DCOL[i % DCOL.length]}10` }}>{d.total_cost}$/pers</span>
                                </div>

                                {/* Morning */}
                                {d.morning && (
                                    <DaySlot icon="🌅" label="Matin" color={DCOL[i % DCOL.length]} data={d.morning} type="activity" />
                                )}
                                {d.getting_to_lunch && <DirectionBlock data={d.getting_to_lunch} />}
                                {d.lunch && <DaySlot icon="🥗" label="Dîner" color="#0E9AA7" data={d.lunch} type="meal" />}
                                {d.getting_to_afternoon && <DirectionBlock data={d.getting_to_afternoon} />}
                                {d.afternoon && <DaySlot icon="☀️" label="Après-midi" color={DCOL[i % DCOL.length]} data={d.afternoon} type="activity" />}
                                {d.getting_to_dinner && <DirectionBlock data={d.getting_to_dinner} />}
                                {d.dinner && <DaySlot icon="🍽️" label="Souper" color="#7C3AED" data={d.dinner} type="meal" />}
                                {d.evening && <DaySlot icon="🌙" label="Soirée" color="#1A3A6B" data={d.evening} type="activity" />}
                                {d.getting_back_hotel && <DirectionBlock data={d.getting_back_hotel} />}
                            </div>
                        ) : null)}

                        {/* Packing list */}
                        {guide.packing_list && (
                            <div style={{ padding: "0 16px 8px" }}>
                                <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(5,150,105,.02)", border: "1px solid rgba(5,150,105,.06)" }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", marginBottom: 4 }}>🎒 À ne pas oublier</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                        {guide.packing_list.map((it, j) => (
                                            <span key={j} style={{ padding: "2px 8px", borderRadius: 100, background: "rgba(5,150,105,.05)", fontSize: 10, fontWeight: 600, color: "#059669" }}>{it}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Region tips */}
                        {guide.region_tips && (
                            <div style={{ padding: "0 16px 12px" }}>
                                <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(46,125,219,.02)", border: "1px solid rgba(46,125,219,.06)" }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#2E7DDB", marginBottom: 3 }}>💡 Conseils</div>
                                    <p style={{ fontSize: 11, color: "#5A6B80", margin: 0 }}>{guide.region_tips}</p>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ padding: "12px 18px 22px", display: "flex", gap: 7, justifyContent: "center", flexWrap: "wrap", borderTop: "1px solid rgba(46,125,219,.04)" }}>
                            <button onClick={() => setStep("ranking")} style={{ padding: "9px 16px", borderRadius: 100, border: "1px solid rgba(46,125,219,.1)", background: "white", color: "#2E7DDB", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Fredoka',sans-serif" }}>🗺️ Autre région</button>
                            <button onClick={reset} style={{ padding: "9px 16px", borderRadius: 100, border: "none", background: "linear-gradient(135deg,#2E7DDB,#1A3A6B)", color: "white", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", boxShadow: "0 3px 8px rgba(46,125,219,.2)" }}>⚜️ Recommencer</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Sub-components ──

function DaySlot({ icon, label, color, data, type }) {
    if (!data) return null;
    const isActivity = type === "activity";
    return (
        <div style={{ padding: "10px 12px", borderRadius: 12, background: "white", border: "1px solid rgba(46,125,219,.04)", marginBottom: 4 }}>
            <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `${color}08`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{icon}</div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            {label} {isActivity ? `· ${data.duration || ""}` : ""} {data.rating ? `· ${data.rating}` : ""}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#0F1D2F" }}>{data.cost}$</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F1D2F" }}>{isActivity ? data.activity : data.name}</div>
                    <div style={{ fontSize: 11, color: "#5A6B80" }}>📍 {data.location}</div>
                    {isActivity && data.description && <div style={{ fontSize: 10.5, color: "#5A6B80", marginTop: 1 }}>{data.description}</div>}
                    {data.tip && <div style={{ fontSize: 10, color: "#8A9AB5", fontStyle: "italic", marginTop: 1 }}>💡 {data.tip}</div>}
                    {data.must_try && <div style={{ fontSize: 10, color, marginTop: 1 }}>⭐ {data.must_try}</div>}
                    {isActivity && data.type && <div style={{ fontSize: 10, color: "#8A9AB5" }}>{data.type}</div>}
                </div>
            </div>
        </div>
    );
}

function DirectionBlock({ data }) {
    if (!data) return null;
    return (
        <div style={{ padding: "5px 12px 5px 46px", marginBottom: 2 }}>
            <div style={{ fontSize: 10, color: "#8A9AB5", display: "flex", gap: 8, alignItems: "center" }}>
                <span>{data.mode}</span>
                <span>·</span>
                <span>{data.duration}</span>
                {data.distance && <><span>·</span><span>{data.distance}</span></>}
            </div>
            {data.directions && <div style={{ fontSize: 9.5, color: "#B0BFCF", marginTop: 1 }}>{data.directions}</div>}
        </div>
    );
}
