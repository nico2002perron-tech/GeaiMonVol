'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';

const FAKE_STORIES = [
    {
        id: 1, author: "Marie-Ève L.", avatar: "🧑🦰", destination: "Paris", code: "CDG",
        dates: "12–19 mars 2025", budget: "1 250$", rating: 5,
        title: "Paris au printemps, un rêve devenu réalité",
        excerpt: "On a trouvé ce deal à 195$ aller-retour sur GeaiMonVol et on a pas hésité une seconde. Le vol Air Transat était super confortable, et arrivés à Paris on a été accueillis par un soleil magnifique...",
        body: "On a trouvé ce deal à 195$ aller-retour sur GeaiMonVol et on a pas hésité une seconde. Le vol Air Transat était super confortable, et arrivés à Paris on a été accueillis par un soleil magnifique. On a marché le long de la Seine, visité le Louvre (arrivez à l'ouverture!), et mangé les meilleurs croissants de notre vie dans une petite boulangerie du Marais. Le soir on montait à Montmartre pour le coucher de soleil sur la ville. Budget total pour 7 jours à deux : 1250$ tout inclus. Le guide IA de GeaiMonVol nous avait recommandé le quartier Oberkampf pour les restos pas chers et c'était spot on. Conseil #1 : prenez le métro, pas les taxis. Conseil #2 : réservez les musées en ligne à l'avance.",
        likes: 47,
        comments: [
            { author: "Jean-Philippe M.", avatar: "👨", text: "Wow super récit! On hésite justement pour Paris cet été. Le quartier Oberkampf c'est noté!", likes: 8, date: "il y a 3 jours" },
            { author: "Sarah B.", avatar: "👩", text: "195$ aller-retour?! C'est malade. J'aurais dû activer mes alertes. La prochaine fois je manque pas ça!", likes: 12, date: "il y a 5 jours" },
        ],
        date: "22 mars 2025", dealLevel: "lowest_ever", pricePaid: "195$", verified: true,
    },
    {
        id: 2, author: "Alex T.", avatar: "🧔", destination: "Cancún", code: "CUN",
        dates: "5–12 février 2025", budget: "980$", rating: 4,
        title: "7 jours all-inclusive à Cancún pour moins de 1000$",
        excerpt: "Ma blonde et moi on cherchait une escapade soleil pas trop chère. Quand j'ai vu le deal à 220$ sur GeaiMonVol, j'ai booké dans les 5 minutes...",
        body: "Ma blonde et moi on cherchait une escapade soleil pas trop chère. Quand j'ai vu le deal à 220$ on a sauté dessus. Sunwing, hôtel décent. On a passé une semaine géniale. La plage était top. Le guide IA nous a aidé à trouver des restos moins touristiques.",
        likes: 34,
        comments: [
            { author: "Camille D.", avatar: "👩🦱", text: "980$ à deux tout inclus c'est fou! Quel hôtel vous avez pris?", likes: 5, date: "il y a 1 semaine" },
        ],
        date: "15 février 2025", dealLevel: "incredible", pricePaid: "220$", verified: true,
    },
    {
        id: 3, author: "François G.", avatar: "👨🦲", destination: "Tokyo", code: "NRT",
        dates: "1–14 avril 2025", budget: "2 800$", rating: 5,
        title: "2 semaines au Japon pendant les cerisiers en fleurs",
        excerpt: "Le deal Tokyo à 699$ c'était déjà bien, mais le guide IA m'a sauvé facilement 500$ en me suggérant des ryokans abordables et le JR Pass...",
        body: "Le deal Tokyo à 699$ c'était déjà bien. J'ai pu voir les cerisiers en fleurs. Le Japon est magnifique. Le guide IA m'a donné des bons coins pour manger des ramens authentiques sans faire la file.",
        likes: 89, comments: [],
        date: "18 avril 2025", dealLevel: "good", pricePaid: "699$", verified: true,
    },
];

const LEVEL_COLORS: Record<string, { bg: string; label: string; icon: string }> = {
    lowest_ever: { bg: "#7C3AED", label: "PRIX RECORD", icon: "⚡" },
    incredible: { bg: "#DC2626", label: "INCROYABLE", icon: "🔥" },
    great: { bg: "#EA580C", label: "SUPER DEAL", icon: "✨" },
    good: { bg: "#2E7DDB", label: "BON PRIX", icon: "👍" },
};

const DESTINATIONS_SUGGESTIONS = ["Paris", "Cancún", "Tokyo", "Barcelone", "Lisbonne", "Rome", "Bangkok", "Marrakech", "New York", "Bali", "Miami", "Londres"];

function StarRating({ rating, size = 14, interactive = false, onChange }: { rating: number; size?: number; interactive?: boolean; onChange?: (r: number) => void }) {
    const [hover, setHover] = useState(0);
    return (
        <div style={{ display: "flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map(star => (
                <span key={star} onClick={() => interactive && onChange?.(star)}
                    onMouseEnter={() => interactive && setHover(star)} onMouseLeave={() => interactive && setHover(0)}
                    style={{ fontSize: size, cursor: interactive ? "pointer" : "default", color: star <= (hover || rating) ? "#F59E0B" : "#D1D5DB", transition: "color 0.15s" }}>★</span>
            ))}
        </div>
    );
}

function CommentBlock({ comment }: { comment: any }) {
    const [liked, setLiked] = useState(false);
    return (
        <div style={{ padding: "12px 16px", background: "rgba(244,248,251,0.6)", borderRadius: 12, border: "1px solid rgba(26,43,66,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{comment.avatar}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1A2B42", fontFamily: "'Outfit', system-ui" }}>{comment.author}</span>
                    <span style={{ fontSize: 9, color: "#B0BEC5" }}>{comment.date}</span>
                </div>
                <button onClick={() => setLiked(!liked)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: liked ? "#DC2626" : "#B0BEC5" }}>
                    {liked ? "❤️" : "🤍"} {comment.likes + (liked ? 1 : 0)}
                </button>
            </div>
            <p style={{ fontSize: 12, color: "#5A7089", lineHeight: 1.5, margin: 0 }}>{comment.text}</p>
        </div>
    );
}

function StoryModal({ story, onClose }: { story: any; onClose: () => void }) {
    const [commentText, setCommentText] = useState("");
    const [liked, setLiked] = useState(false);

    if (!story) return null;
    const col = LEVEL_COLORS[story.dealLevel] || LEVEL_COLORS.good;
    const wordCount = commentText.trim().split(/\s+/).filter(Boolean).length;
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 20, overflowY: "auto" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                {/* Header */}
                <div style={{ background: `linear-gradient(135deg, ${col.bg}12 0%, ${col.bg}04 100%)`, padding: "24px 28px 18px", borderBottom: "1px solid rgba(26,43,66,0.06)", position: "sticky", top: 0, zIndex: 5 }}>
                    <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(26,43,66,0.06)", border: "none", borderRadius: 100, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#5A7089" }}>✕</button>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <span style={{ fontSize: 32 }}>{story.avatar}</span>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A2B42", fontFamily: "'Outfit', system-ui" }}>
                                {story.author}
                                {story.verified && <span style={{ marginLeft: 6, fontSize: 9, background: "#ECFDF5", color: "#16A34A", padding: "2px 6px", borderRadius: 100, fontWeight: 700 }}>✓ Vérifié</span>}
                            </div>
                            <div style={{ fontSize: 11, color: "#8FA3B8" }}>{story.date}</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, fontWeight: 800, background: col.bg, color: "white", padding: "3px 10px", borderRadius: 100 }}>{col.icon} {col.label} — {story.pricePaid}</span>
                        <span style={{ fontSize: 10, color: "#5A7089", fontFamily: "'Outfit', system-ui" }}>YUL → {story.destination} ({story.code}) · {story.dates}</span>
                    </div>
                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                        <StarRating rating={story.rating} size={14} />
                        <span style={{ fontSize: 10, color: "#8FA3B8" }}>Budget total : {story.budget}</span>
                    </div>
                </div>
                {/* Body */}
                <div style={{ padding: "24px 28px" }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1A2B42", margin: "0 0 16px", lineHeight: 1.3, fontFamily: "'Fredoka', system-ui" }}>{story.title}</h2>
                    <p style={{ fontSize: 14, color: "#3A4E66", lineHeight: 1.8, margin: 0, whiteSpace: "pre-line" }}>{story.body}</p>
                    {/* Likes */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(26,43,66,0.06)" }}>
                        <button onClick={() => setLiked(!liked)} style={{ background: liked ? "#FEF2F2" : "rgba(26,43,66,0.03)", border: liked ? "1px solid #FECACA" : "1px solid rgba(26,43,66,0.06)", borderRadius: 100, padding: "6px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s" }}>
                            <span>{liked ? "❤️" : "🤍"}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: liked ? "#DC2626" : "#5A7089" }}>{story.likes + (liked ? 1 : 0)}</span>
                        </button>
                        <span style={{ fontSize: 12, color: "#8FA3B8" }}>💬 {story.comments.length} commentaires</span>
                    </div>
                    {/* Comments */}
                    {story.comments.length > 0 && (
                        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                            <h4 style={{ fontSize: 13, fontWeight: 700, color: "#1A2B42", margin: 0, fontFamily: "'Outfit', system-ui" }}>Commentaires</h4>
                            {story.comments.map((c: any, i: number) => <CommentBlock key={i} comment={c} />)}
                        </div>
                    )}
                    {/* Add comment */}
                    <div style={{ marginTop: 20, padding: 16, background: "#F8FAFC", borderRadius: 14, border: "1px solid rgba(26,43,66,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <h4 style={{ fontSize: 12, fontWeight: 700, color: "#1A2B42", margin: 0, fontFamily: "'Outfit', system-ui" }}>Ajouter un commentaire</h4>
                            <span style={{ fontSize: 9, fontWeight: 700, color: wordCount >= 75 ? "#16A34A" : wordCount >= 50 ? "#F59E0B" : "#B0BEC5" }}>{wordCount}/75 mots min</span>
                        </div>
                        <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Partagez votre expérience ou posez une question... (75 mots minimum)" rows={3}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(26,43,66,0.1)", fontSize: 12, fontFamily: "'Outfit', system-ui", resize: "vertical", outline: "none", background: "white" }} />
                        <button disabled={wordCount < 75} style={{ marginTop: 8, padding: "8px 20px", borderRadius: 100, border: "none", fontSize: 12, fontWeight: 700, cursor: wordCount >= 75 ? "pointer" : "not-allowed", background: wordCount >= 75 ? "linear-gradient(135deg, #2E7DDB, #1B5BA0)" : "#E2E8F0", color: wordCount >= 75 ? "white" : "#94A3B8", fontFamily: "'Outfit', system-ui", transition: "all 0.2s" }}>
                            Publier le commentaire
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SubmitForm({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({ destination: "", dates: "", budget: "", rating: 0, title: "", body: "" });
    const wordCount = form.body.trim().split(/\s+/).filter(Boolean).length;
    const isValid = form.destination && form.title && form.rating > 0 && wordCount >= 75;
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", position: "relative" }}>
                {/* Header */}
                <div style={{ background: "linear-gradient(135deg, #D4AF3712 0%, #F5D06008 100%)", padding: "24px 28px 18px", borderBottom: "1px solid rgba(212,175,55,0.1)" }}>
                    <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(26,43,66,0.06)", border: "none", borderRadius: 100, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✕</button>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 28 }}>✍️</span>
                        <div>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1A2B42", margin: 0, fontFamily: "'Fredoka', system-ui" }}>Raconte ton aventure</h3>
                            <p style={{ fontSize: 11, color: "#8FA3B8", margin: 0 }}>Partage ton expérience et aide la communauté !</p>
                        </div>
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, #D4AF37, #F5D060)", padding: "5px 14px", borderRadius: 100, marginTop: 8 }}>
                        <span style={{ fontSize: 12 }}>🎁</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#5C4813" }}>1 mois Premium gratuit pour chaque récit publié</span>
                    </div>
                </div>
                {/* Form */}
                <div style={{ padding: "20px 28px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#1A2B42", marginBottom: 4, display: "block", fontFamily: "'Outfit', system-ui" }}>Destination *</label>
                        <input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="Ex: Paris, Cancún, Tokyo..." list="dest-suggestions"
                            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(26,43,66,0.12)", fontSize: 13, fontFamily: "'Outfit', system-ui", outline: "none" }} />
                        <datalist id="dest-suggestions">{DESTINATIONS_SUGGESTIONS.map(d => <option key={d} value={d} />)}</datalist>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "#1A2B42", marginBottom: 4, display: "block" }}>Dates</label>
                            <input value={form.dates} onChange={e => setForm({ ...form, dates: e.target.value })} placeholder="Ex: 12–19 mars 2025"
                                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(26,43,66,0.12)", fontSize: 13, fontFamily: "'Outfit', system-ui", outline: "none" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "#1A2B42", marginBottom: 4, display: "block" }}>Budget total</label>
                            <input value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="Ex: 1 250$"
                                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(26,43,66,0.12)", fontSize: 13, fontFamily: "'Outfit', system-ui", outline: "none" }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#1A2B42", marginBottom: 4, display: "block" }}>Note du voyage *</label>
                        <StarRating rating={form.rating} size={22} interactive onChange={(r: number) => setForm({ ...form, rating: r })} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#1A2B42", marginBottom: 4, display: "block" }}>Titre de ton récit *</label>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Un titre accrocheur pour ton aventure..."
                            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(26,43,66,0.12)", fontSize: 13, fontFamily: "'Outfit', system-ui", outline: "none" }} />
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "#1A2B42" }}>Ton récit *</label>
                            <span style={{ fontSize: 10, fontWeight: 700, color: wordCount >= 75 ? "#16A34A" : wordCount >= 50 ? "#F59E0B" : "#DC2626", background: wordCount >= 75 ? "#ECFDF5" : wordCount >= 50 ? "#FFFBEB" : "#FEF2F2", padding: "2px 8px", borderRadius: 100 }}>
                                {wordCount}/75 mots {wordCount >= 75 ? "✓" : ""}
                            </span>
                        </div>
                        <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })}
                            placeholder="Raconte-nous ton voyage ! Qu'est-ce qui t'a marqué ? Tes meilleurs spots, tes conseils, tes coups de cœur... (75 mots minimum)" rows={8}
                            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${wordCount >= 75 ? "rgba(22,163,74,0.3)" : "rgba(26,43,66,0.12)"}`, fontSize: 13, fontFamily: "'Outfit', system-ui", resize: "vertical", outline: "none", lineHeight: 1.6, transition: "border-color 0.2s" }} />
                    </div>
                    <div style={{ background: "rgba(46,125,219,0.04)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(46,125,219,0.08)" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>🛡️</span>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#2E7DDB", marginBottom: 2 }}>Transparence</div>
                                <p style={{ fontSize: 10, color: "#5A7089", margin: 0, lineHeight: 1.5 }}>
                                    Ton récit aide notre IA à donner de meilleurs conseils aux futurs voyageurs. Tes données personnelles ne sont jamais partagées. Seul le contenu de ton récit (destination, budget, conseils) est utilisé de façon anonymisée.
                                </p>
                            </div>
                        </div>
                    </div>
                    <button disabled={!isValid} style={{ padding: "14px 0", borderRadius: 14, border: "none", fontSize: 15, fontWeight: 700, cursor: isValid ? "pointer" : "not-allowed", fontFamily: "'Fredoka', system-ui", background: isValid ? "linear-gradient(135deg, #2E7DDB, #1B5BA0)" : "#E2E8F0", color: isValid ? "white" : "#94A3B8", boxShadow: isValid ? "0 4px 16px rgba(46,125,219,0.3)" : "none", transition: "all 0.2s" }}>
                        {isValid ? "🐦 Publier mon récit — 1 mois Premium offert" : `Encore ${Math.max(0, 75 - wordCount)} mots`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function RecitsPage() {
    const [selectedStory, setSelectedStory] = useState<any>(null);
    const [showSubmit, setShowSubmit] = useState(false);
    const [filterDest, setFilterDest] = useState("Tous");
    const destinations = useMemo(() => ["Tous", ...new Set(FAKE_STORIES.map(s => s.destination))], []);
    const filteredStories = useMemo(() => filterDest === "Tous" ? FAKE_STORIES : FAKE_STORIES.filter(s => s.destination === filterDest), [filterDest]);

    return (
        <div style={{ fontFamily: "'Outfit', system-ui, sans-serif", background: "#F4F8FB", minHeight: "100vh" }}>
            {/* Nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(26,43,66,0.05)", position: "sticky", top: 0, zIndex: 100 }}>
                <Link href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none" }}>
                    <span style={{ fontSize: 22 }}>🐦</span>
                    <span style={{ fontWeight: 700, fontSize: 17, color: "#1A2B42", fontFamily: "'Fredoka', system-ui" }}>Geai<span style={{ color: "#2E7DDB" }}>MonVol</span></span>
                </Link>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Link href="/" style={{ padding: "6px 14px", borderRadius: 100, background: "rgba(46,125,219,0.06)", color: "#5A7089", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>← Retour aux deals</Link>
                    <button onClick={() => setShowSubmit(true)} style={{ padding: "6px 16px", borderRadius: 100, border: "none", background: "linear-gradient(135deg, #2E7DDB, #1B5BA0)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                        ✍️ Raconter <span style={{ background: "rgba(255,255,255,0.2)", padding: "1px 8px", borderRadius: 100, fontSize: 9, fontWeight: 800 }}>1 mois gratuit</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontFamily: "'Fredoka', system-ui", fontSize: 26, fontWeight: 700, color: "#1A2B42", margin: "0 0 4px" }}>📖 Récits de voyageurs</h1>
                        <p style={{ fontSize: 13, color: "#5A7089", margin: "0 0 10px" }}>{FAKE_STORIES.length} aventures partagées par la communauté</p>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 100, background: "linear-gradient(135deg, rgba(124,58,237,0.06), rgba(46,125,219,0.06))", border: "1px solid rgba(124,58,237,0.1)" }}>
                            <span style={{ fontSize: 12 }}>🧠</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED" }}>Chaque récit entraîne notre IA pour de meilleurs conseils voyage</span>
                        </div>
                    </div>
                    <button onClick={() => setShowSubmit(true)} style={{ padding: "10px 22px", borderRadius: 100, border: "none", background: "linear-gradient(135deg, #2E7DDB, #1B5BA0)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', system-ui", boxShadow: "0 4px 16px rgba(46,125,219,0.2)", display: "flex", alignItems: "center", gap: 6 }}>
                        ✍️ Raconter <span style={{ background: "rgba(255,255,255,0.2)", padding: "1px 8px", borderRadius: 100, fontSize: 9, fontWeight: 800 }}>1 mois gratuit</span>
                    </button>
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 16, scrollbarWidth: "none", marginBottom: 8 }}>
                    {destinations.map(dest => (
                        <button key={dest} onClick={() => setFilterDest(dest)} style={{ padding: "6px 14px", borderRadius: 100, border: "1px solid rgba(26,43,66,0.08)", background: filterDest === dest ? "#2E7DDB" : "white", color: filterDest === dest ? "white" : "#5A7089", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0, fontFamily: "'Outfit', system-ui" }}>{dest}</button>
                    ))}
                </div>

                {/* Stories list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {filteredStories.map(story => {
                        const col = LEVEL_COLORS[story.dealLevel] || LEVEL_COLORS.good;
                        return (
                            <div key={story.id} onClick={() => setSelectedStory(story)} style={{ background: "white", borderRadius: 16, padding: "20px 24px", border: "1px solid rgba(26,43,66,0.06)", boxShadow: "0 2px 12px rgba(26,43,66,0.05)", cursor: "pointer", transition: "all 0.2s" }}
                                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(26,43,66,0.1)"; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(26,43,66,0.05)"; }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <span style={{ fontSize: 28 }}>{story.avatar}</span>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: "#1A2B42", fontFamily: "'Outfit', system-ui" }}>
                                                {story.author}
                                                {story.verified && <span style={{ marginLeft: 6, fontSize: 9, background: "#ECFDF5", color: "#16A34A", padding: "2px 6px", borderRadius: 100, fontWeight: 700 }}>✓ Vérifié</span>}
                                            </div>
                                            <div style={{ fontSize: 11, color: "#8FA3B8" }}>YUL → {story.destination} · {story.dates} · {story.date}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <span style={{ fontSize: 9, fontWeight: 800, background: col.bg, color: "white", padding: "3px 10px", borderRadius: 100 }}>{col.icon} {story.pricePaid}</span>
                                        <StarRating rating={story.rating} size={11} />
                                    </div>
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1A2B42", margin: "0 0 8px", fontFamily: "'Outfit', system-ui" }}>{story.title}</h3>
                                <p style={{ fontSize: 13, color: "#5A7089", lineHeight: 1.6, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{story.excerpt}</p>
                                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
                                    <span style={{ fontSize: 12, color: "#8FA3B8" }}>❤️ {story.likes}</span>
                                    <span style={{ fontSize: 12, color: "#8FA3B8" }}>💬 {story.comments.length}</span>
                                    <span style={{ fontSize: 9, fontWeight: 700, color: "#7C3AED", background: "rgba(124,58,237,0.06)", padding: "2px 8px", borderRadius: 100, display: "flex", alignItems: "center", gap: 3 }}>🧠 Entraîne l&apos;IA</span>
                                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#2E7DDB", fontWeight: 700 }}>Lire le récit →</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Transparence mini */}
                <div style={{ marginTop: 32, background: "linear-gradient(135deg, #0F1A2A, #1A2B42)", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 32, flexShrink: 0 }}>🛡️</span>
                    <div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: "white", margin: "0 0 4px", fontFamily: "'Outfit', system-ui" }}>Tes récits nourrissent notre IA — en toute transparence</h4>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.5 }}>
                            Chaque récit est anonymisé avant d&apos;être analysé. Tes données personnelles ne sont jamais partagées.
                            L&apos;IA utilise uniquement les infos de voyage (destination, budget, conseils) pour améliorer les recommandations.
                            Tu peux supprimer ton récit à tout moment.
                        </p>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {selectedStory && <StoryModal story={selectedStory} onClose={() => setSelectedStory(null)} />}
            {showSubmit && <SubmitForm onClose={() => setShowSubmit(false)} />}
        </div>
    );
}
