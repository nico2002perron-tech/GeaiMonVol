import { useState, useRef, useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";

/* ═══ QUESTIONS ═══ */
const QUESTIONS = [
    {
        id: "group", q: "Tu voyages avec qui?", options: [
            { l: "Solo", i: "🧑", v: "solo" }, { l: "En couple", i: "💑", v: "couple" },
            { l: "Famille (jeunes enfants)", i: "👶", v: "famille-jeune" }, { l: "Famille (ados+)", i: "👨👩👧👦", v: "famille-ado" },
            { l: "Entre amis", i: "👯", v: "amis" }, { l: "Groupe organisé", i: "🚌", v: "groupe" }]
    },
    {
        id: "duration", q: "Combien de jours?", options: [
            { l: "Weekend (2-3 jours)", i: "⚡", v: "weekend" }, { l: "Une semaine", i: "📅", v: "semaine" },
            { l: "10-14 jours", i: "🗓️", v: "long" }, { l: "2 semaines+", i: "🌎", v: "tres-long" }]
    },
    {
        id: "season", q: "Tu pars quand?", options: [
            { l: "Été (juin-août)", i: "☀️", v: "ete" }, { l: "Automne (sept-oct)", i: "🍂", v: "automne" },
            { l: "Hiver (déc-mars)", i: "❄️", v: "hiver" }, { l: "Printemps (avr-mai)", i: "🌸", v: "printemps" }, { l: "Flexible", i: "🤷", v: "flexible" }]
    },
    {
        id: "vibe", q: "T'es plus quel vibe?", options: [
            { l: "100% nature", i: "🌲", v: "nature" }, { l: "Ville & culture", i: "🏙️", v: "ville" },
            { l: "Mix des deux", i: "⚡", v: "mix" }, { l: "Zen & bien-être", i: "🧘", v: "zen" }, { l: "Road trip", i: "🛣️", v: "roadtrip" }]
    },
    {
        id: "energy", q: "Ton niveau d'énergie?", options: [
            { l: "Aventure extrême", i: "🧗", v: "extreme" }, { l: "Actif le jour, relax le soir", i: "🚴", v: "actif" },
            { l: "Tranquille", i: "😌", v: "relax" }, { l: "Repos total", i: "♨️", v: "repos" }]
    },
    {
        id: "wake_up", q: "T'es plus lève-tôt ou lève-tard?", options: [
            { l: "Lève-tôt — 6h-7h, je veux tout voir!", i: "🌅", v: "tot" },
            { l: "Normal — 8h-9h", i: "☀️", v: "normal" },
            { l: "Grasse mat' — 10h+, vacances!", i: "😴", v: "tard" }]
    },
    {
        id: "nature_type", q: "Quel type de nature?", multi: true, showIf: a => ["nature", "mix", "roadtrip"].includes(a.vibe), options: [
            { l: "Océan & fleuve", i: "🌊", v: "mer" }, { l: "Montagnes", i: "⛰️", v: "montagne" },
            { l: "Lacs", i: "🏞️", v: "lacs" }, { l: "Forêts", i: "🌲", v: "forets" },
            { l: "Fjords", i: "🗻", v: "fjords" }, { l: "Villages", i: "🏘️", v: "villages" }]
    },
    {
        id: "outdoor_activities", q: "Quelles activités outdoor?", multi: true, showIf: a => ["nature", "mix", "roadtrip"].includes(a.vibe) || ["extreme", "actif"].includes(a.energy), options: [
            { l: "Randonnée", i: "🥾", v: "rando" }, { l: "Kayak / canot", i: "🛶", v: "kayak" }, { l: "Vélo", i: "🚲", v: "velo" },
            { l: "Baleines", i: "🐳", v: "baleines" }, { l: "Ski", i: "⛷️", v: "ski" },
            { l: "Escalade / via ferrata", i: "🧗", v: "escalade" }, { l: "Baignade", i: "🏖️", v: "baignade" },
            { l: "Pêche", i: "🎣", v: "peche" }, { l: "Motoneige / quad", i: "🏎️", v: "motorise" }]
    },
    {
        id: "city_interests", q: "Qu'est-ce qui t'attire en ville?", multi: true, showIf: a => ["ville", "mix"].includes(a.vibe), options: [
            { l: "Musées", i: "🏛️", v: "musees" }, { l: "Festivals", i: "🎵", v: "festivals" },
            { l: "Art & galeries", i: "🎨", v: "art" }, { l: "Nightlife", i: "🍸", v: "nightlife" }, { l: "Shopping", i: "🛍️", v: "shopping" }]
    },
    {
        id: "zen_type", q: "Quel type de détente?", multi: true, showIf: a => a.vibe === "zen" || a.energy === "repos", options: [
            { l: "Spa & bains nordiques", i: "♨️", v: "spa" }, { l: "Yoga", i: "🧘", v: "yoga" },
            { l: "Vignobles", i: "🍷", v: "vin" }, { l: "Massages", i: "💆", v: "massages" }]
    },
    {
        id: "family_needs", q: "Besoins famille?", multi: true, showIf: a => ["famille-jeune", "famille-ado"].includes(a.group), options: [
            { l: "Poussette-friendly", i: "👶", v: "poussette" }, { l: "Activités éducatives", i: "📚", v: "educatif" },
            { l: "Parcs d'attractions", i: "🎢", v: "attractions" }, { l: "Baignade sécuritaire", i: "🏊", v: "baignade-famille" }]
    },
    {
        id: "equipment", q: "Tu as déjà ton équipement?", multi: true, sub: "Coche ce que tu possèdes",
        showIf: a => (a.outdoor_activities || []).length > 0 || ["nature", "roadtrip"].includes(a.vibe), options: [
            { l: "Vélos", i: "🚲", v: "has_velo" }, { l: "Kayak / canot", i: "🛶", v: "has_kayak" },
            { l: "Équipement rando", i: "🥾", v: "has_rando" }, { l: "Camping", i: "⛺", v: "has_camping" },
            { l: "Rien — je loue tout!", i: "🏪", v: "loue_tout" }]
    },
    {
        id: "food", q: "Côté bouffe?", multi: true, options: [
            { l: "Restos locaux", i: "🥘", v: "local" }, { l: "Fine dining", i: "🥂", v: "fine" },
            { l: "Street food", i: "🍟", v: "street" }, { l: "Microbrasseries", i: "🍺", v: "boire" },
            { l: "Végé / allergies", i: "🥗", v: "vege" }, { l: "Je cuisine", i: "🏕️", v: "cuisine" }]
    },
    {
        id: "accommodation", q: "Tu dors où?", options: [
            { l: "Hôtel", i: "🏨", v: "hotel" }, { l: "Airbnb / chalet", i: "🏠", v: "airbnb" },
            { l: "Camping / glamping", i: "⛺", v: "camping" }, { l: "Auberge", i: "🛏️", v: "auberge" }, { l: "Insolite", i: "🪵", v: "insolite" }]
    },
    {
        id: "transport", q: "Transport?", options: [
            { l: "Auto / location", i: "🚗", v: "auto" }, { l: "Van / VR", i: "🚐", v: "van" },
            { l: "Transport en commun", i: "🚌", v: "commun" }, { l: "Vélo", i: "🚲", v: "velo-transport" }, { l: "Base fixe", i: "📍", v: "fixe" }]
    },
    {
        id: "budget", q: "Budget par personne?", sub: "(sans transport)", options: [
            { l: "Économe — -500$", i: "💵", v: "econome" }, { l: "Confortable — 500-1000$", i: "💰", v: "confortable" },
            { l: "On se gâte — 1000-2000$", i: "💎", v: "luxe" }, { l: "Pas de limite!", i: "👑", v: "premium" }]
    },
    {
        id: "knowledge", q: "Tu connais le Québec?", options: [
            { l: "Première visite!", i: "🆕", v: "nouveau" }, { l: "Les classiques", i: "👍", v: "classique" },
            { l: "Sentiers battus? Non merci.", i: "🗿", v: "expert" }, { l: "Québécois", i: "⚜️", v: "local" }]
    },
    {
        id: "special", q: "Un dernier souhait?", options: [
            { l: "Coucher de soleil magique", i: "🌅", v: "sunset" }, { l: "Expérience autochtone", i: "🪶", v: "autochtone" },
            { l: "Spot secret", i: "🔮", v: "secret" }, { l: "Activité folle", i: "🤪", v: "folle" }, { l: "Surprends-moi!", i: "🎁", v: "surprise" }]
    },
];

/* ═══ REGIONS ═══ */
const REGIONS = [
    { name: "Charlevoix", icon: "⛰️", desc: "Montagne, fleuve, terroir", tags: ["nature", "mix", "montagne", "fine", "local", "forets", "villages", "rando", "couple", "luxe", "automne", "sunset", "spa", "hotel", "airbnb"] },
    { name: "Gaspésie", icon: "🌊", desc: "Percé, mer, road trip épique", tags: ["nature", "roadtrip", "mer", "rando", "fjords", "baleines", "auto", "van", "extreme", "actif", "kayak", "camping", "long", "expert"] },
    { name: "Saguenay–Lac-Saint-Jean", icon: "🐋", desc: "Fjord, baleines, aventure", tags: ["nature", "fjords", "baleines", "kayak", "rando", "extreme", "actif", "forets", "camping", "secret"] },
    { name: "Ville de Québec", icon: "🏰", desc: "Patrimoine UNESCO, charme", tags: ["ville", "mix", "musees", "fine", "nouveau", "couple", "famille-jeune", "hotel", "commun", "weekend", "shopping"] },
    { name: "Montréal", icon: "🏙️", desc: "Culture, gastro, nightlife", tags: ["ville", "festivals", "art", "boire", "street", "nightlife", "amis", "nouveau", "shopping", "commun", "weekend"] },
    { name: "Laurentides", icon: "🌲", desc: "Lacs, ski, nature accessible", tags: ["nature", "mix", "lacs", "ski", "velo", "spa", "forets", "famille-ado", "amis", "rando", "hiver", "airbnb"] },
    { name: "Cantons-de-l'Est", icon: "🍷", desc: "Vignobles, spas", tags: ["mix", "zen", "fine", "boire", "vin", "villages", "spa", "couple", "relax", "repos", "automne", "massages"] },
    { name: "Îles-de-la-Madeleine", icon: "🏖️", desc: "Plages, dépaysement", tags: ["mer", "baignade", "secret", "local", "couple", "ete", "kayak", "velo", "long"] },
    { name: "Bas-Saint-Laurent", icon: "🦌", desc: "Couchers de soleil, quiétude", tags: ["nature", "mer", "villages", "sunset", "relax", "repos", "velo", "secret", "yoga", "camping"] },
    { name: "Côte-Nord", icon: "🐺", desc: "Sauvage, bout du monde", tags: ["nature", "extreme", "baleines", "mer", "roadtrip", "secret", "auto", "van", "long", "expert", "camping"] },
    { name: "Mauricie", icon: "🏕️", desc: "Forêts, canot, déconnexion", tags: ["nature", "forets", "lacs", "kayak", "camping", "peche", "rando", "famille-ado", "amis", "baignade"] },
    { name: "Outaouais", icon: "🛶", desc: "Parcs, musées, nature", tags: ["mix", "musees", "lacs", "rando", "velo", "famille-jeune", "nouveau", "educatif"] },
];

function scoreR(a) {
    const t = []; Object.values(a).forEach(v => { if (Array.isArray(v)) t.push(...v); else if (typeof v === "string") t.push(v) });
    return REGIONS.map(r => { const m = r.tags.filter(x => t.includes(x)).length; return { ...r, score: Math.min(98, Math.round((m / Math.max(r.tags.length, 1)) * 100)) } }).sort((a, b) => b.score - a.score)
}

/* ═══ SCHEDULE ═══ */
const SCH = {
    tot: { breakfast: "7:00", morning: "8:00", lunch: "12:00", afternoon: "13:30", dinner: "18:00", evening: "20:00" },
    normal: { breakfast: "8:30", morning: "9:30", lunch: "12:30", afternoon: "14:00", dinner: "18:30", evening: "20:30" },
    tard: { breakfast: "10:00", morning: "11:00", lunch: "13:00", afternoon: "14:30", dinner: "19:00", evening: "21:00" }
};
function addTimes(g, w) { if (!g?.days) return g; const t = SCH[w] || SCH.normal; return { ...g, days: g.days.map(d => ({ ...d, schedule: { ...t, ...(d.schedule || {}) } })) } }

const SWAP_R = [{ l: "Trop cher", i: "💸", v: "trop_cher" }, { l: "Pas mon genre", i: "🙅", v: "pas_genre" }, { l: "Déjà fait", i: "✅", v: "deja_fait" }, { l: "Pas accessible", i: "♿", v: "access" }, { l: "Plus intense", i: "🔥", v: "intense" }, { l: "Plus calme", i: "🌿", v: "calme" }];
const DC = ["#2E7DDB", "#0E9AA7", "#F5A623", "#E84855", "#7C3AED", "#059669", "#DB2777"];
const SLOTS = [
    { slot: "breakfast", label: "Déjeuner", icon: "🥐", color: "#F5A623" },
    { slot: "morning", label: "Matin", icon: "🌅", colorIdx: true },
    { slot: "lunch", label: "Dîner", icon: "🥗", color: "#0E9AA7" },
    { slot: "afternoon", label: "Après-midi", icon: "☀️", colorIdx: true },
    { slot: "dinner", label: "Souper", icon: "🍽️", color: "#7C3AED" },
    { slot: "evening", label: "Soirée", icon: "🌙", color: "#1A3A6B" },
];

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
.qS::-webkit-scrollbar{width:4px}.qS::-webkit-scrollbar-thumb{background:rgba(46,125,219,.15);border-radius:4px}`;

/* ═══════════════════════════════════════════ */
/* MAIN COMPONENT                              */
/* ═══════════════════════════════════════════ */

export default function QuebecPlanner({ onClose }) {
    const { user } = useAuth();
    const sr = useRef(null);

    const [step, setStep] = useState("quiz");
    const [qIdx, setQIdx] = useState(0);
    const [ans, setAns] = useState({});
    const [mSel, setMSel] = useState([]);
    const [aDir, setADir] = useState("in");
    const [region, setRegion] = useState(null);
    const [guide, setGuide] = useState(null);
    const [guideId, setGuideId] = useState(null);
    const [exDay, setExDay] = useState(0);
    const [error, setError] = useState("");
    const [ratings, setRatings] = useState({});
    const [swp, setSwp] = useState(null);
    const [swpAlts, setSwpAlts] = useState(null);
    const [swpLoad, setSwpLoad] = useState(false);
    const [editTime, setEditTime] = useState(null);
    const [notes, setNotes] = useState({});

    const aQ = useMemo(() => QUESTIONS.filter(q => !q.showIf || q.showIf(ans)), [ans]);
    const CQ = aQ[qIdx];
    const prog = CQ ? ((qIdx + 1) / aQ.length) * 100 : 100;
    const ranked = useMemo(() => scoreR(ans), [ans]);

    /* ── Quiz nav ── */
    const goN = () => { setADir("out"); setTimeout(() => { if (qIdx < aQ.length - 1) { setQIdx(i => i + 1); setMSel([]); setADir("in") } else setStep("ranking") }, 250) };
    const doS = v => { setAns(p => ({ ...p, [CQ.id]: v })); goN() };
    const togM = v => setMSel(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
    const confM = () => { if (!mSel.length) return; setAns(p => ({ ...p, [CQ.id]: mSel })); goN() };
    const goB = () => { if (qIdx > 0) { setADir("out"); setTimeout(() => { setQIdx(i => i - 1); setMSel([]); setADir("in") }, 200) } };

    /* ── Generate ── */
    const pickR = async rn => {
        setRegion(rn); setStep("loading"); setError("");
        const ap = []; Object.values(ans).forEach(v => { if (Array.isArray(v)) ap.push(...v); else ap.push(v) });
        const dm = { weekend: 3, semaine: 7, long: 12, "tres-long": 16 };
        const bm = { econome: "budget", confortable: "moderate", luxe: "luxury", premium: "luxury" };
        try {
            const r = await fetch("/api/guide/generate", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    destination: rn, country: "Canada (Québec)", trip_days: dm[ans.duration] || 7,
                    rest_days: Math.max(1, Math.floor((dm[ans.duration] || 7) / 5)), budget_style: bm[ans.budget] || "moderate",
                    preferences: ap, quiz_context: {
                        group: ans.group, vibe: ans.vibe, energy: ans.energy, season: ans.season,
                        wake_up: ans.wake_up, accommodation: ans.accommodation, transport: ans.transport, food: ans.food,
                        knowledge: ans.knowledge, special: ans.special, equipment: ans.equipment
                    }
                })
            });
            const d = await r.json();
            if (!r.ok) { setError(d.error === "limit_reached" ? "Limite atteinte. Passe à Premium!" : d.message || d.error || "Erreur"); setStep("error"); return }
            setGuide(addTimes(d.guide, ans.wake_up || "normal")); setGuideId(d.guide_id); setExDay(0); setStep("result");
            if (sr.current) sr.current.scrollTop = 0;
        } catch { setError("Erreur de connexion."); setStep("error") }
    };

    /* ── Swap ── */
    const reqSwap = (di, sl, reason) => {
        setSwpLoad(true);
        fetch("/api/guide/swap", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                guide_id: guideId, destination: region, country: "Canada (Québec)", day_number: di + 1, slot: sl, reason,
                original_activity: guide.days[di][sl], budget_style: ans.budget === "econome" ? "budget" : ans.budget === "luxe" ? "luxury" : "moderate"
            })
        })
            .then(r => r.json()).then(d => { setSwpAlts(d.alternatives || []); setSwpLoad(false) })
            .catch(() => { setSwpAlts([{ activity: "Erreur", location: region, cost: 0, duration: "—" }]); setSwpLoad(false) })
    };
    const confSwap = (di, sl, alt) => { setGuide(p => { const u = JSON.parse(JSON.stringify(p)); u.days[di][sl] = alt; return u }); setSwp(null); setSwpAlts(null) };
    const updTime = (di, key, t) => { setGuide(p => { const u = JSON.parse(JSON.stringify(p)); if (!u.days[di].schedule) u.days[di].schedule = {}; u.days[di].schedule[key] = t; return u }); setEditTime(null) };
    const reset = () => { setStep("quiz"); setQIdx(0); setAns({}); setMSel([]); setRegion(null); setGuide(null); setGuideId(null); setExDay(0); setError(""); setRatings({}); setSwp(null); setSwpAlts(null); setNotes({}) };

    /* ═══ RENDER ═══ */
    const bx = { position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.45)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 8, fontFamily: "'Fredoka',sans-serif" };
    const card = { width: "100%", maxWidth: step === "result" ? 920 : step === "ranking" ? 640 : 560, maxHeight: "96vh", overflow: "auto", background: "linear-gradient(175deg,#F8FAFF,#EDF2FB,#E4EAF6)", borderRadius: 24, border: "1px solid rgba(46,125,219,.08)", boxShadow: "0 32px 80px rgba(0,0,0,.2),inset 0 0 0 1px rgba(255,255,255,.5)", transition: "max-width .5s", position: "relative" };

    return (
        <div onClick={e => { if (e.target === e.currentTarget && onClose) onClose() }} style={bx}>
            <style>{css}</style>
            <div className="qS" ref={sr} style={card}>
                <div style={{ height: 3, borderRadius: "24px 24px 0 0", background: "linear-gradient(90deg,#2E7DDB,#60A5FA,#2E5A9E,#1A3A6B,#2E5A9E,#60A5FA,#2E7DDB)", backgroundSize: "300%", animation: "qB 5s ease infinite" }} />
                {onClose && <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, zIndex: 10, width: 34, height: 34, borderRadius: "50%", border: "none", background: "rgba(26,58,107,.06)", color: "rgba(26,58,107,.4)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>}

                {/* ═══ QUIZ ═══ */}
                {step === "quiz" && CQ && <div style={{ padding: "28px 28px 36px" }}>
                    <div style={{ textAlign: "center", marginBottom: 22 }}>
                        <div style={{ fontSize: 36, animation: "qFl 3s ease-in-out infinite" }}>⚜️</div>
                        <h2 style={{ fontSize: 23, fontWeight: 800, color: "#0F1D2F", margin: "4px 0" }}>Planifie ton voyage au Québec</h2>
                        <p style={{ fontSize: 13, color: "#5A6B80", margin: "4px 0 16px" }}>L'IA crée ton itinéraire parfait</p>
                        <div style={{ width: "100%", height: 8, borderRadius: 4, background: "rgba(46,125,219,.06)" }}>
                            <div style={{ width: `${prog}%`, height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#2E7DDB,#60A5FA)", transition: "width .4s" }} /></div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                            <span style={{ fontSize: 11, color: "#8A9AB5", fontWeight: 600 }}>{CQ.id.replace(/_/g, " ")}</span>
                            <span style={{ fontSize: 12, color: "#2E7DDB", fontWeight: 700 }}>{qIdx + 1}/{aQ.length}</span></div></div>
                    <div key={CQ.id} style={{ animation: aDir === "in" ? "qI .3s ease" : "qO .2s ease" }}>
                        <h3 style={{ fontSize: 19, fontWeight: 700, color: "#0F1D2F", textAlign: "center", marginBottom: 4 }}>{CQ.q}</h3>
                        {CQ.sub && <p style={{ fontSize: 12, color: "#8A9AB5", textAlign: "center", marginBottom: 10 }}>{CQ.sub}</p>}
                        {CQ.multi && <p style={{ fontSize: 11, color: "#2E7DDB", textAlign: "center", fontWeight: 600, marginBottom: 10 }}>✨ Choisis-en plusieurs</p>}
                        <div style={{ display: "grid", gridTemplateColumns: CQ.options.length <= 4 ? "1fr" : "1fr 1fr", gap: 8 }}>
                            {CQ.options.map(o => {
                                const s = CQ.multi ? mSel.includes(o.v) : ans[CQ.id] === o.v; return (
                                    <button key={o.v} onClick={() => CQ.multi ? togM(o.v) : doS(o.v)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderRadius: 14, border: s ? "2px solid #2E7DDB" : "1.5px solid rgba(46,125,219,.06)", background: s ? "rgba(46,125,219,.04)" : "white", cursor: "pointer", textAlign: "left", fontFamily: "'Fredoka',sans-serif", transition: "all .2s" }}>
                                        <span style={{ fontSize: 22, flexShrink: 0 }}>{o.i}</span>
                                        <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0F1D2F" }}>{o.l}</span>
                                        {s && CQ.multi && <span style={{ marginLeft: "auto", color: "#2E7DDB", fontWeight: 800 }}>✓</span>}
                                    </button>)
                            })}</div>
                        {CQ.multi && <button onClick={confM} disabled={!mSel.length} style={{ display: "block", margin: "16px auto 0", padding: "11px 28px", borderRadius: 100, border: "none", background: mSel.length ? "linear-gradient(135deg,#2E7DDB,#1A3A6B)" : "rgba(46,125,219,.06)", color: mSel.length ? "white" : "#8A9AB5", fontSize: 14, fontWeight: 700, cursor: mSel.length ? "pointer" : "default", fontFamily: "'Fredoka',sans-serif" }}>Confirmer ({mSel.length}) →</button>}
                    </div>
                    {qIdx > 0 && <button onClick={goB} style={{ display: "block", margin: "12px auto 0", padding: "6px 16px", borderRadius: 100, border: "none", background: "rgba(46,125,219,.04)", color: "#2E7DDB", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>← Retour</button>}
                </div>}

                {/* ═══ RANKING ═══ */}
                {step === "ranking" && <div style={{ padding: "28px 26px 36px", animation: "qF .4s ease" }}>
                    <div style={{ textAlign: "center", marginBottom: 20 }}><div style={{ fontSize: 28 }}>🏆</div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F1D2F", margin: 0 }}>Tes destinations parfaites</h2>
                        <p style={{ fontSize: 13, color: "#5A6B80", margin: "4px 0" }}>Clique pour générer ton itinéraire IA</p></div>
                    <div onClick={() => user && pickR(ranked[0].name)} style={{ marginBottom: 14, padding: "18px", borderRadius: 20, background: "linear-gradient(135deg,rgba(46,125,219,.05),rgba(96,165,250,.02))", border: "2px solid rgba(46,125,219,.12)", animation: "qG 3s ease-in-out infinite", cursor: "pointer", position: "relative" }}>
                        <div style={{ position: "absolute", top: 10, right: 12, background: "linear-gradient(135deg,#2E7DDB,#1A3A6B)", color: "white", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 100 }}>🥇 RECOMMANDÉ</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 32 }}>{ranked[0].icon}</span>
                            <div><div style={{ fontSize: 18, fontWeight: 800, color: "#0F1D2F" }}>{ranked[0].name}</div>
                                <div style={{ fontSize: 12, color: "#5A6B80" }}>{ranked[0].desc}</div></div></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                            <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(46,125,219,.06)", overflow: "hidden" }}><div style={{ width: `${ranked[0].score}%`, height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#2E7DDB,#60A5FA)" }} /></div>
                            <span style={{ fontSize: 16, fontWeight: 800, color: "#2E7DDB" }}>{ranked[0].score}%</span></div>
                        <div style={{ textAlign: "center", marginTop: 10 }}><span style={{ fontSize: 12, color: "#2E7DDB", fontWeight: 700 }}>🤖 Générer l'itinéraire IA →</span></div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {ranked.slice(1).map((r, i) => <div key={r.name} onClick={() => user && pickR(r.name)}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 14, background: "white", border: "1px solid rgba(46,125,219,.04)", cursor: "pointer", transition: "all .2s", animation: `qP .3s ease ${i * .04}s both` }}
                            onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"} onMouseLeave={e => e.currentTarget.style.transform = ""}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#8A9AB5", width: 18 }}>#{i + 2}</span>
                            <span style={{ fontSize: 20 }}>{r.icon}</span>
                            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: "#0F1D2F" }}>{r.name}</div><div style={{ fontSize: 10, color: "#8A9AB5" }}>{r.desc}</div></div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: r.score > 70 ? "#2E7DDB" : "#8A9AB5" }}>{r.score}%</span>
                        </div>)}</div>
                    {!user && <div style={{ textAlign: "center", marginTop: 16, padding: "14px", borderRadius: 14, background: "rgba(232,72,85,.04)", border: "1px solid rgba(232,72,85,.1)" }}><p style={{ fontSize: 13, color: "#E84855", fontWeight: 600, margin: 0 }}>Connecte-toi pour générer!</p></div>}
                    <button onClick={reset} style={{ display: "block", margin: "16px auto 0", padding: "7px 16px", borderRadius: 100, border: "none", background: "rgba(46,125,219,.04)", color: "#2E7DDB", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>← Recommencer</button>
                </div>}

                {/* ═══ LOADING ═══ */}
                {step === "loading" && <div style={{ padding: "70px 30px", textAlign: "center", animation: "qF .4s ease" }}>
                    <div style={{ width: 60, height: 60, margin: "0 auto 24px", borderRadius: "50%", border: "4px solid rgba(46,125,219,.1)", borderTopColor: "#2E7DDB", animation: "qSpin 1s linear infinite" }} />
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0F1D2F", margin: "0 0 6px" }}>L'IA planifie ton voyage...</h3>
                    <p style={{ fontSize: 14, color: "#5A6B80", margin: 0 }}>⚜️ {region}</p>
                    <p style={{ fontSize: 12, color: "#8A9AB5", marginTop: 14 }}>Itinéraire, restos, horaire, budget...</p>
                    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 18 }}>
                        {[0, 1, 2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#2E7DDB", animation: `qDot 1.4s ease-in-out ${i * .16}s infinite` }} />)}</div>
                </div>}

                {/* ═══ ERROR ═══ */}
                {step === "error" && <div style={{ padding: "60px 30px", textAlign: "center", animation: "qF .4s ease" }}>
                    <div style={{ fontSize: 44, marginBottom: 14 }}>😕</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F1D2F", margin: "0 0 8px" }}>Oups!</h3>
                    <p style={{ fontSize: 14, color: "#5A6B80", margin: "0 0 22px" }}>{error}</p>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button onClick={() => pickR(region)} style={{ padding: "11px 22px", borderRadius: 100, border: "none", background: "linear-gradient(135deg,#2E7DDB,#1A3A6B)", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Réessayer</button>
                        <button onClick={() => setStep("ranking")} style={{ padding: "11px 22px", borderRadius: 100, border: "1px solid rgba(46,125,219,.1)", background: "white", color: "#2E7DDB", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Autre région</button>
                    </div>
                </div>}

                {/* ═══ RESULT ═══ */}
                {step === "result" && guide && <div style={{ animation: "qF .4s ease" }}>
                    {/* Header */}
                    <div style={{ padding: "24px 24px 18px", textAlign: "center", background: "linear-gradient(170deg,rgba(46,125,219,.04),transparent)", borderBottom: "1px solid rgba(46,125,219,.05)" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#2E7DDB", marginBottom: 4 }}>⚜️ {region} · Généré par IA</div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F1D2F", margin: "0 0 4px" }}>{guide.title}</h2>
                        <p style={{ fontSize: 13, color: "#5A6B80", margin: "0 0 8px" }}>{guide.summary}</p>
                        {guide.budget_summary && <div style={{ display: "inline-flex", gap: 14, padding: "10px 20px", borderRadius: 16, background: "white", border: "1px solid rgba(46,125,219,.08)", marginTop: 6, flexWrap: "wrap", justifyContent: "center" }}>
                            <div><div style={{ fontSize: 10, color: "#8A9AB5", fontWeight: 700 }}>TOTAL</div><div style={{ fontSize: 20, fontWeight: 800, color: "#2E7DDB" }}>{guide.budget_summary.total_per_person}$</div></div>
                            <div style={{ borderLeft: "1px solid rgba(46,125,219,.08)", paddingLeft: 14 }}><div style={{ fontSize: 10, color: "#8A9AB5", fontWeight: 700 }}>HÉBERG.</div><div style={{ fontSize: 15, fontWeight: 700, color: "#0F1D2F" }}>{guide.budget_summary.accommodation_total}$</div></div>
                            <div style={{ borderLeft: "1px solid rgba(46,125,219,.08)", paddingLeft: 14 }}><div style={{ fontSize: 10, color: "#8A9AB5", fontWeight: 700 }}>ACTIVITÉS</div><div style={{ fontSize: 15, fontWeight: 700, color: "#0F1D2F" }}>{guide.budget_summary.activities_total}$</div></div>
                            <div style={{ borderLeft: "1px solid rgba(46,125,219,.08)", paddingLeft: 14 }}><div style={{ fontSize: 10, color: "#8A9AB5", fontWeight: 700 }}>BOUFFE</div><div style={{ fontSize: 15, fontWeight: 700, color: "#0F1D2F" }}>{guide.budget_summary.food_total}$</div></div>
                        </div>}
                        {guide.accommodation && <div style={{ marginTop: 8, fontSize: 12, color: "#5A6B80" }}>🏨 {guide.accommodation.name} · {guide.accommodation.price_per_night}$/nuit</div>}
                    </div>

                    {/* Highlights */}
                    {guide.highlights && <div style={{ padding: "10px 18px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {guide.highlights.map((h, j) => <span key={j} style={{ padding: "4px 12px", borderRadius: 100, background: "rgba(46,125,219,.04)", fontSize: 12, fontWeight: 600, color: "#2E7DDB" }}>✨ {h}</span>)}</div>}

                    {/* Day tabs */}
                    <div style={{ display: "flex", gap: 0, padding: "0 8px", overflowX: "auto", borderBottom: "1px solid rgba(46,125,219,.04)" }}>
                        {guide.days?.map((d, i) => <button key={i} onClick={() => setExDay(i)} style={{
                            flex: "0 0 auto", padding: "10px 10px", border: "none",
                            borderBottom: exDay === i ? `3px solid ${DC[i % DC.length]}` : "3px solid transparent", background: "transparent",
                            color: exDay === i ? DC[i % DC.length] : "#8A9AB5", fontSize: 12, fontWeight: exDay === i ? 700 : 600, cursor: "pointer", fontFamily: "'Fredoka',sans-serif"
                        }}>
                            <div>J{d.day}</div><div style={{ fontSize: 9 }}>{d.total_cost}$</div></button>)}</div>

                    {/* ═══ DAY DETAIL — CALENDAR ═══ */}
                    {guide.days?.map((d, i) => exDay === i ? <div key={i} style={{ padding: "16px 18px 20px", animation: "qF .25s ease" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: DC[i % DC.length], margin: 0 }}>{d.theme} {d.title}</h3>
                            <span style={{ fontSize: 11, fontWeight: 700, color: DC[i % DC.length], padding: "3px 10px", borderRadius: 100, background: `${DC[i % DC.length]}10` }}>{d.total_cost}$/pers</span>
                        </div>

                        {SLOTS.map(({ slot, label, icon, color, colorIdx }) => {
                            const data = d[slot]; if (!data) return null;
                            const c = colorIdx ? DC[i % DC.length] : color;
                            const time = d.schedule?.[slot] || "—";
                            const nm = data.activity || data.name || "—";
                            const dir = d[`getting_to_${slot}`];
                            const ek = `${i}-${slot}`;
                            return (<div key={slot} style={{ marginBottom: 6 }}>
                                {/* Direction */}
                                {dir && <div style={{ padding: "3px 14px 3px 62px", marginBottom: 2 }}>
                                    <div style={{ fontSize: 10, color: "#B0BFCF", display: "flex", gap: 6, alignItems: "center" }}>
                                        <span>↓</span><span>{dir.mode}</span><span>·</span><span>{dir.duration}</span>
                                        {dir.distance && <><span>·</span><span>{dir.distance}</span></>}
                                    </div></div>}

                                {/* Calendar block */}
                                <div style={{ display: "flex", gap: 0, borderRadius: 14, overflow: "hidden", background: "white", border: `1px solid ${c}15` }}>
                                    {/* Time col */}
                                    <div onClick={() => setEditTime(editTime === ek ? null : ek)} style={{ width: 58, flexShrink: 0, background: `${c}06`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 4px", borderRight: `2px solid ${c}18`, cursor: "pointer" }}>
                                        <span style={{ fontSize: 15, fontWeight: 800, color: c, lineHeight: 1 }}>{time.split(":")[0]}</span>
                                        <span style={{ fontSize: 10, fontWeight: 600, color: `${c}99` }}>:{time.split(":")[1] || "00"}</span>
                                        <span style={{ fontSize: 8, color: "#B0BFCF", marginTop: 2 }}>✏️</span>
                                    </div>
                                    {/* Content */}
                                    <div style={{ flex: 1, padding: "10px 14px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: c, textTransform: "uppercase", letterSpacing: .5 }}>
                                                {icon} {label} {data.duration ? `· ${data.duration}` : ""} {data.rating ? `· ${data.rating}` : ""}</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: "#0F1D2F" }}>{data.cost}$</span></div>
                                        <div style={{ fontSize: 14.5, fontWeight: 700, color: "#0F1D2F", marginTop: 2 }}>{nm}</div>
                                        <div style={{ fontSize: 12, color: "#5A6B80" }}>📍 {data.location}</div>
                                        {data.description && <div style={{ fontSize: 11, color: "#5A6B80", marginTop: 2 }}>{data.description}</div>}
                                        {data.tip && <div style={{ fontSize: 10.5, color: "#8A9AB5", fontStyle: "italic", marginTop: 2 }}>💡 {data.tip}</div>}
                                        {data.must_try && <div style={{ fontSize: 10.5, color: c, marginTop: 2 }}>⭐ {data.must_try}</div>}

                                        {/* Rating + Swap */}
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(0,0,0,.03)" }}>
                                            <div style={{ display: "flex", gap: 2 }}>{[1, 2, 3, 4, 5].map(s => <button key={s} onClick={() => setRatings(p => ({ ...p, [ek]: s }))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: (ratings[ek] || 0) >= s ? 1 : .2 }}>⭐</button>)}</div>
                                            <button onClick={() => { setSwp({ dayIdx: i, slot, step: "reason" }); setSwpAlts(null) }}
                                                style={{ padding: "3px 10px", borderRadius: 100, border: `1px solid ${c}15`, background: "transparent", color: c, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Fredoka',sans-serif" }}>🔄 Changer</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Time editor */}
                                {editTime === ek && <div style={{ padding: "6px 14px 6px 62px", animation: "qF .2s ease" }}>
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                        <input type="time" defaultValue={time} onChange={e => updTime(i, slot, e.target.value)}
                                            style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid rgba(46,125,219,.15)", fontSize: 12, fontFamily: "'Fredoka',sans-serif", color: "#0F1D2F" }} />
                                        <span style={{ fontSize: 10, color: "#8A9AB5" }}>← modifier l'heure</span>
                                    </div></div>}
                            </div>)
                        })}

                        {/* Notes */}
                        <div style={{ marginTop: 10 }}>
                            <textarea placeholder="📝 Notes personnelles..." value={notes[`d-${i}`] || ""} onChange={e => setNotes(p => ({ ...p, [`d-${i}`]: e.target.value }))}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(46,125,219,.08)", background: "rgba(46,125,219,.02)", fontSize: 12, fontFamily: "'Fredoka',sans-serif", color: "#0F1D2F", resize: "vertical", minHeight: 44, outline: "none" }} />
                        </div>
                    </div> : null)}

                    {/* Packing */}
                    {guide.packing_list && <div style={{ padding: "0 18px 10px" }}><div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(5,150,105,.02)", border: "1px solid rgba(5,150,105,.06)" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", marginBottom: 6 }}>🎒 À ne pas oublier</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{guide.packing_list.map((it, j) => <span key={j} style={{ padding: "3px 10px", borderRadius: 100, background: "rgba(5,150,105,.05)", fontSize: 11, fontWeight: 600, color: "#059669" }}>{it}</span>)}</div>
                    </div></div>}

                    {/* Tips */}
                    {guide.region_tips && <div style={{ padding: "0 18px 14px" }}><div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(46,125,219,.02)", border: "1px solid rgba(46,125,219,.06)" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#2E7DDB", marginBottom: 4 }}>💡 Conseils</div>
                        <p style={{ fontSize: 12, color: "#5A6B80", margin: 0 }}>{guide.region_tips}</p>
                    </div></div>}

                    {/* Actions */}
                    <div style={{ padding: "14px 20px 24px", display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", borderTop: "1px solid rgba(46,125,219,.04)" }}>
                        <button onClick={() => setStep("ranking")} style={{ padding: "10px 18px", borderRadius: 100, border: "1px solid rgba(46,125,219,.1)", background: "white", color: "#2E7DDB", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🗺️ Autre région</button>
                        <button onClick={reset} style={{ padding: "10px 18px", borderRadius: 100, border: "none", background: "linear-gradient(135deg,#2E7DDB,#1A3A6B)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: "0 3px 8px rgba(46,125,219,.2)" }}>⚜️ Recommencer</button>
                    </div>
                </div>}

                {/* ═══ SWAP MODAL ═══ */}
                {swp && <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => { if (e.target === e.currentTarget) { setSwp(null); setSwpAlts(null) } }}>
                    <div style={{ width: "100%", maxWidth: 400, background: "#F8FAFF", borderRadius: 20, padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,.2)", animation: "qF .3s ease" }}>
                        {swp.step === "reason" && <>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F1D2F", textAlign: "center", marginBottom: 14 }}>Pourquoi changer?</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                                {SWAP_R.map(r => <button key={r.v} onClick={() => { setSwp(p => ({ ...p, reason: r.v, step: "loading" })); reqSwap(swp.dayIdx, swp.slot, r.v) }}
                                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(46,125,219,.06)", background: "white", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontSize: 13.5, fontWeight: 600, color: "#0F1D2F" }}>
                                    <span style={{ fontSize: 18 }}>{r.i}</span>{r.l}</button>)}</div>
                            <button onClick={() => { setSwp(null); setSwpAlts(null) }} style={{ display: "block", margin: "12px auto 0", padding: "5px 14px", borderRadius: 100, border: "none", background: "rgba(0,0,0,.03)", color: "#5A6B80", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
                        </>}

                        {swp.step === "loading" && swpLoad && <div style={{ textAlign: "center", padding: "30px 0" }}>
                            <div style={{ width: 40, height: 40, margin: "0 auto 14px", borderRadius: "50%", border: "3px solid rgba(46,125,219,.1)", borderTopColor: "#2E7DDB", animation: "qSpin 1s linear infinite" }} />
                            <p style={{ fontSize: 13, color: "#5A6B80" }}>L'IA cherche des alternatives...</p>
                        </div>}

                        {swpAlts && swpAlts.length > 0 && <>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F1D2F", textAlign: "center", marginBottom: 12 }}>3 alternatives</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {swpAlts.map((a, j) => <button key={j} onClick={() => confSwap(swp.dayIdx, swp.slot, a)}
                                    style={{ padding: "13px 14px", borderRadius: 14, border: "1.5px solid rgba(46,125,219,.06)", background: "white", cursor: "pointer", textAlign: "left", fontFamily: "'Fredoka',sans-serif", transition: "all .2s" }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = "#2E7DDB"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(46,125,219,.06)"}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F1D2F" }}>{a.activity || a.name}</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: "#2E7DDB" }}>{a.cost}$</span></div>
                                    <div style={{ fontSize: 11.5, color: "#5A6B80", marginTop: 2 }}>📍 {a.location} · {a.duration} {a.rating ? `· ${a.rating}` : ""}</div>
                                    {a.why && <div style={{ fontSize: 10.5, color: "#059669", marginTop: 2 }}>✓ {a.why}</div>}
                                </button>)}</div>
                            <button onClick={() => { setSwp(null); setSwpAlts(null) }} style={{ display: "block", margin: "12px auto 0", padding: "5px 14px", borderRadius: 100, border: "none", background: "rgba(0,0,0,.03)", color: "#5A6B80", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Garder l'original</button>
                        </>}
                    </div>
                </div>}

            </div>
        </div>
    );
}
