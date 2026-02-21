import { useState, useMemo } from "react";

/*
  TravelBook — Présentation d'un guide IA sous forme de livre ancien
  Props:
    guide: object (guide_data from API)
    region: string
    onClose: () => void
    onBucketList: () => void  (ajouter à la bucket list)
    onComplete: () => void    (marquer comme complété → bibliothèque)
*/

const BOOK_COLORS = [
    { bg: "#8B2500", spine: "#5C1A00", accent: "#D4A574", name: "Bordeaux" },
    { bg: "#1A3A5C", spine: "#0F2440", accent: "#7EB8D8", name: "Marine" },
    { bg: "#2D5016", spine: "#1A3008", accent: "#8FBF6A", name: "Forêt" },
    { bg: "#4A1942", spine: "#2E0F2A", accent: "#C490BF", name: "Prune" },
    { bg: "#5C3A1E", spine: "#3A2410", accent: "#C9A87C", name: "Cuir" },
    { bg: "#1A4A4A", spine: "#0E2E2E", accent: "#6BC4C4", name: "Sarcelle" },
    { bg: "#4A2C2A", spine: "#2E1A18", accent: "#C49A98", name: "Acajou" },
    { bg: "#2A3A5C", spine: "#1A2640", accent: "#8A9FBF", name: "Ardoise" },
];

const SLOTS = [
    { slot: "breakfast", label: "Déjeuner", icon: "🥐", time: "breakfast" },
    { slot: "morning", label: "Matin", icon: "🌅", time: "morning" },
    { slot: "lunch", label: "Dîner", icon: "🥗", time: "lunch" },
    { slot: "afternoon", label: "Après-midi", icon: "☀️", time: "afternoon" },
    { slot: "dinner", label: "Souper", icon: "🍽️", time: "dinner" },
    { slot: "evening", label: "Soirée", icon: "🌙", time: "evening" },
];

const css = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');

@keyframes bookOpen {
  0% { transform: perspective(1200px) rotateY(-5deg) scale(0.85); opacity: 0; }
  60% { transform: perspective(1200px) rotateY(3deg) scale(1.02); }
  100% { transform: perspective(1200px) rotateY(0deg) scale(1); opacity: 1; }
}
@keyframes coverLift {
  0% { transform: perspective(1200px) rotateY(0deg); }
  100% { transform: perspective(1200px) rotateY(-160deg); }
}
@keyframes pageIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes pageOut {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(-20px); }
}
@keyframes goldShimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes floatBookmark {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
.book-page-content::-webkit-scrollbar { width: 4px; }
.book-page-content::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
.book-tab:hover { transform: translateX(4px) !important; }
`;

export default function TravelBook({ guide, region, onClose, onBucketList, onComplete }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(0); // 0 = intro, 1-N = days
    const [pageAnim, setPageAnim] = useState("in");

    const bookColor = useMemo(() => BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)], []);
    const totalPages = (guide?.days?.length || 0) + 1; // intro + days

    const goToPage = (p) => {
        if (p === currentPage || p < 0 || p >= totalPages) return;
        setPageAnim("out");
        setTimeout(() => {
            setCurrentPage(p);
            setPageAnim("in");
        }, 250);
    };

    if (!guide) return null;

    // ═══ COVER (closed) ═══
    if (!isOpen) {
        return (
            <div onClick={e => { if (e.target === e.currentTarget && onClose) onClose(); }}
                style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.6)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <style>{css}</style>
                <div
                    onClick={() => setIsOpen(true)}
                    style={{
                        width: 340, minHeight: 480, borderRadius: "4px 16px 16px 4px", cursor: "pointer",
                        background: `linear-gradient(135deg, ${bookColor.bg}, ${bookColor.spine})`,
                        boxShadow: `8px 8px 30px rgba(0,0,0,0.5), inset -3px 0 8px rgba(0,0,0,0.3), inset 3px 0 8px rgba(255,255,255,0.05)`,
                        position: "relative", overflow: "hidden",
                        animation: "bookOpen 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        padding: "40px 30px",
                    }}
                >
                    {/* Spine effect */}
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 20, background: `linear-gradient(90deg, ${bookColor.spine}, transparent)`, borderRadius: "4px 0 0 4px" }} />

                    {/* Texture overlay */}
                    <div style={{ position: "absolute", inset: 0, background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\"><rect width=\"100\" height=\"100\" fill=\"none\"/><circle cx=\"50\" cy=\"50\" r=\"1\" fill=\"rgba(255,255,255,0.03)\"/></svg>')", opacity: 0.5 }} />

                    {/* Gold border frame */}
                    <div style={{ position: "absolute", inset: 20, border: `2px solid ${bookColor.accent}40`, borderRadius: 8 }} />
                    <div style={{ position: "absolute", inset: 24, border: `1px solid ${bookColor.accent}20`, borderRadius: 6 }} />

                    {/* Corner ornaments */}
                    {[{ top: 16, left: 16 }, { top: 16, right: 16 }, { bottom: 16, left: 16 }, { bottom: 16, right: 16 }].map((pos, i) => (
                        <div key={i} style={{
                            position: "absolute", ...pos, width: 20, height: 20, borderColor: bookColor.accent, borderStyle: "solid", borderWidth: 0,
                            ...(i === 0 ? { borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 4 } : {}),
                            ...(i === 1 ? { borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 4 } : {}),
                            ...(i === 2 ? { borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 4 } : {}),
                            ...(i === 3 ? { borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 4 } : {}),
                            opacity: 0.5
                        }} />
                    ))}

                    {/* Content */}
                    <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
                        <div style={{ fontSize: 36, marginBottom: 16 }}>⚜️</div>
                        <div style={{
                            fontFamily: "'Playfair Display', serif", fontSize: 11, fontWeight: 400,
                            color: bookColor.accent, letterSpacing: 4, textTransform: "uppercase", marginBottom: 12,
                        }}>Carnet de Voyage</div>
                        <h1 style={{
                            fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900,
                            color: "#F5F0E8", margin: "0 0 8px", lineHeight: 1.2,
                            textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        }}>{region}</h1>
                        <div style={{
                            width: 60, height: 2, margin: "12px auto",
                            background: `linear-gradient(90deg, transparent, ${bookColor.accent}, transparent)`,
                        }} />
                        <p style={{
                            fontFamily: "'Crimson Text', serif", fontSize: 14, fontStyle: "italic",
                            color: `${bookColor.accent}CC`, margin: "12px 0 0", lineHeight: 1.5,
                        }}>{guide.summary}</p>
                        <div style={{
                            fontFamily: "'Playfair Display', serif", fontSize: 11, fontWeight: 400,
                            color: bookColor.accent, letterSpacing: 2, textTransform: "uppercase", marginTop: 20, opacity: 0.6,
                        }}>{guide.days?.length || 7} Jours</div>
                    </div>

                    {/* "Open" hint */}
                    <div style={{
                        position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
                        fontFamily: "'Crimson Text', serif", fontSize: 12, color: `${bookColor.accent}80`,
                        animation: "floatBookmark 2s ease-in-out infinite",
                    }}>
                        Ouvrir le carnet →
                    </div>

                    {/* Close button */}
                    {onClose && <button onClick={e => { e.stopPropagation(); onClose(); }} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>✕</button>}
                </div>
            </div>
        );
    }

    // ═══ OPEN BOOK ═══
    const day = currentPage > 0 ? guide.days?.[currentPage - 1] : null;

    return (
        <div onClick={e => { if (e.target === e.currentTarget && onClose) onClose(); }}
            style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.6)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
            <style>{css}</style>
            <div style={{
                width: "100%", maxWidth: 680, maxHeight: "94vh", display: "flex",
                borderRadius: "4px 16px 16px 4px", overflow: "hidden",
                boxShadow: "12px 12px 40px rgba(0,0,0,0.5), -4px 0 12px rgba(0,0,0,0.2)",
                animation: "bookOpen 0.6s ease both",
                position: "relative",
            }}>
                {/* ── Spine ── */}
                <div style={{
                    width: 28, flexShrink: 0,
                    background: `linear-gradient(180deg, ${bookColor.spine}, ${bookColor.bg}80, ${bookColor.spine})`,
                    borderRight: `1px solid ${bookColor.accent}15`,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    boxShadow: "inset -4px 0 8px rgba(0,0,0,0.2)",
                }}>
                    <span style={{
                        writingMode: "vertical-rl", textOrientation: "mixed",
                        fontFamily: "'Playfair Display', serif", fontSize: 10, fontWeight: 700,
                        color: bookColor.accent, letterSpacing: 2, textTransform: "uppercase", opacity: 0.6,
                    }}>{region}</span>
                </div>

                {/* ── Page content ── */}
                <div style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    background: "linear-gradient(135deg, #FAF6F0, #F5EDE3, #FAF6F0)",
                    position: "relative",
                }}>
                    {/* Page texture */}
                    <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.015) 28px, rgba(0,0,0,0.015) 29px)", pointerEvents: "none" }} />

                    {/* Top ornament */}
                    <div style={{ padding: "14px 20px 8px", borderBottom: `1px solid ${bookColor.accent}15`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 10, color: bookColor.bg, opacity: 0.4, letterSpacing: 2, textTransform: "uppercase" }}>⚜️ Carnet de Voyage</span>
                        <span style={{ fontFamily: "'Crimson Text', serif", fontSize: 11, color: "rgba(0,0,0,0.3)" }}>
                            {currentPage === 0 ? "Préface" : `Jour ${day?.day} / ${guide.days?.length}`}
                        </span>
                        {onClose && <button onClick={onClose} style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.3)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>}
                    </div>

                    {/* Scrollable content area */}
                    <div className="book-page-content" style={{
                        flex: 1, overflowY: "auto", padding: "16px 24px 20px",
                        position: "relative", zIndex: 2,
                    }}>
                        {/* ── INTRO PAGE ── */}
                        {currentPage === 0 && (
                            <div key="intro" style={{ animation: pageAnim === "in" ? "pageIn 0.3s ease" : "pageOut 0.25s ease" }}>
                                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: "#1A1008", margin: "0 0 4px", lineHeight: 1.2 }}>{guide.title}</h1>
                                <div style={{ width: 50, height: 2, background: bookColor.bg, margin: "10px 0", opacity: 0.4 }} />
                                <p style={{ fontFamily: "'Crimson Text', serif", fontSize: 15, color: "#4A3A2A", lineHeight: 1.7, fontStyle: "italic" }}>{guide.summary}</p>

                                {guide.accommodation && (
                                    <div style={{ margin: "18px 0", padding: "14px 16px", borderRadius: 10, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)" }}>
                                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 12, fontWeight: 700, color: bookColor.bg, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>🏨 Hébergement</div>
                                        <div style={{ fontFamily: "'Crimson Text', serif", fontSize: 15, fontWeight: 700, color: "#1A1008" }}>{guide.accommodation.name}</div>
                                        <div style={{ fontFamily: "'Crimson Text', serif", fontSize: 13, color: "#6A5A4A" }}>{guide.accommodation.neighborhood} · {guide.accommodation.type}</div>
                                        <div style={{ fontFamily: "'Crimson Text', serif", fontSize: 13, color: bookColor.bg, fontWeight: 700, marginTop: 4 }}>{guide.accommodation.price_per_night}$ / nuit</div>
                                        {guide.accommodation.tip && <div style={{ fontFamily: "'Crimson Text', serif", fontSize: 12, color: "#8A7A6A", fontStyle: "italic", marginTop: 4 }}>💡 {guide.accommodation.tip}</div>}
                                    </div>
                                )}

                                {guide.budget_summary && (
                                    <div style={{ margin: "14px 0", padding: "14px 16px", borderRadius: 10, border: `1px solid ${bookColor.accent}20` }}>
                                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 12, fontWeight: 700, color: bookColor.bg, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>💰 Budget Estimé</div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                            {[
                                                { label: "Total / personne", val: `${guide.budget_summary.total_per_person}$`, bold: true },
                                                { label: "Hébergement", val: `${guide.budget_summary.accommodation_total}$` },
                                                { label: "Nourriture", val: `${guide.budget_summary.food_total}$` },
                                                { label: "Activités", val: `${guide.budget_summary.activities_total}$` },
                                            ].map((b, i) => (
                                                <div key={i}>
                                                    <div style={{ fontFamily: "'Crimson Text', serif", fontSize: 10, color: "#8A7A6A", textTransform: "uppercase" }}>{b.label}</div>
                                                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: b.bold ? 22 : 16, fontWeight: 700, color: b.bold ? bookColor.bg : "#1A1008" }}>{b.val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {guide.highlights && (
                                    <div style={{ margin: "14px 0" }}>
                                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 12, fontWeight: 700, color: bookColor.bg, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>✨ Moments forts</div>
                                        {guide.highlights.map((h, j) => (
                                            <div key={j} style={{ fontFamily: "'Crimson Text', serif", fontSize: 14, color: "#4A3A2A", padding: "4px 0", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>• {h}</div>
                                        ))}
                                    </div>
                                )}

                                {guide.packing_list && (
                                    <div style={{ margin: "14px 0" }}>
                                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 12, fontWeight: 700, color: bookColor.bg, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>🎒 À emporter</div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                            {guide.packing_list.map((it, j) => (
                                                <span key={j} style={{ fontFamily: "'Crimson Text', serif", fontSize: 12, padding: "3px 10px", borderRadius: 100, background: `${bookColor.bg}08`, color: "#4A3A2A" }}>{it}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {guide.region_tips && (
                                    <div style={{ margin: "14px 0", padding: "12px 14px", borderRadius: 10, borderLeft: `3px solid ${bookColor.bg}40`, background: "rgba(0,0,0,0.01)" }}>
                                        <div style={{ fontFamily: "'Crimson Text', serif", fontSize: 13, color: "#4A3A2A", lineHeight: 1.6 }}>{guide.region_tips}</div>
                                    </div>
                                )}

                                <div style={{ textAlign: "center", marginTop: 24 }}>
                                    <button onClick={() => goToPage(1)} style={{
                                        fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700,
                                        padding: "10px 28px", borderRadius: 100, border: `2px solid ${bookColor.bg}`,
                                        background: "transparent", color: bookColor.bg, cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}>
                                        Commencer l'aventure →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── DAY PAGES ── */}
                        {currentPage > 0 && day && (
                            <div key={currentPage} style={{ animation: pageAnim === "in" ? "pageIn 0.3s ease" : "pageOut 0.25s ease" }}>
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 11, color: bookColor.bg, opacity: 0.5, letterSpacing: 2, textTransform: "uppercase" }}>Jour {day.day}</div>
                                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#1A1008", margin: "2px 0 0" }}>{day.theme} {day.title}</h2>
                                    <div style={{ width: 40, height: 2, background: bookColor.bg, margin: "8px 0", opacity: 0.3 }} />
                                    <span style={{ fontFamily: "'Crimson Text', serif", fontSize: 13, color: bookColor.bg, fontWeight: 700 }}>Budget du jour: {day.total_cost}$</span>
                                </div>

                                {SLOTS.map(({ slot, label, icon, time: timeKey }) => {
                                    const data = day[slot];
                                    if (!data) return null;
                                    const nm = data.activity || data.name || "—";
                                    const sched = day.schedule?.[timeKey] || "";
                                    const dir = day[`getting_to_${slot}`];
                                    return (
                                        <div key={slot} style={{ marginBottom: 10 }}>
                                            {dir && (
                                                <div style={{ padding: "3px 0 3px 40px", fontFamily: "'Crimson Text', serif", fontSize: 11, color: "#AA9A8A", display: "flex", gap: 6, alignItems: "center" }}>
                                                    <span>↓</span><span>{dir.mode}</span><span>·</span><span>{dir.duration}</span>
                                                    {dir.distance && <><span>·</span><span>{dir.distance}</span></>}
                                                </div>
                                            )}
                                            <div style={{ display: "flex", gap: 0, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(0,0,0,0.05)" }}>
                                                {/* Time */}
                                                <div style={{ width: 44, flexShrink: 0, background: `${bookColor.bg}08`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 2px", borderRight: `2px solid ${bookColor.bg}12` }}>
                                                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 800, color: bookColor.bg }}>{sched.split(":")[0] || ""}</span>
                                                    <span style={{ fontFamily: "'Crimson Text', serif", fontSize: 9, color: `${bookColor.bg}80` }}>:{sched.split(":")[1] || "00"}</span>
                                                </div>
                                                {/* Content */}
                                                <div style={{ flex: 1, padding: "8px 12px", background: "rgba(255,255,255,0.5)" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 9, fontWeight: 700, color: bookColor.bg, textTransform: "uppercase", letterSpacing: 0.5 }}>{icon} {label} {data.duration ? `· ${data.duration}` : ""}</span>
                                                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 12, fontWeight: 700, color: "#1A1008" }}>{data.cost}$</span>
                                                    </div>
                                                    <div style={{ fontFamily: "'Crimson Text', serif", fontSize: 15, fontWeight: 700, color: "#1A1008", marginTop: 2 }}>{nm}</div>
                                                    <div style={{ fontFamily: "'Crimson Text', serif", fontSize: 12, color: "#6A5A4A" }}>📍 {data.location}</div>
                                                    {data.description && <div style={{ fontFamily: "'Crimson Text', serif", fontSize: 12, color: "#6A5A4A", marginTop: 2 }}>{data.description}</div>}
                                                    {data.tip && <div style={{ fontFamily: "'Crimson Text', serif", fontSize: 11, color: "#8A7A6A", fontStyle: "italic", marginTop: 2 }}>💡 {data.tip}</div>}
                                                    {data.must_try && <div style={{ fontFamily: "'Crimson Text', serif", fontSize: 11, color: bookColor.bg, marginTop: 2 }}>⭐ {data.must_try}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Bottom bar: navigation + bucketlist ── */}
                    <div style={{ padding: "10px 20px 14px", borderTop: "1px solid rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2, background: "rgba(250,246,240,0.95)" }}>
                        <button disabled={currentPage === 0} onClick={() => goToPage(currentPage - 1)} style={{
                            fontFamily: "'Crimson Text', serif", fontSize: 13, padding: "6px 14px", borderRadius: 100,
                            border: "1px solid rgba(0,0,0,0.08)", background: "transparent", color: currentPage === 0 ? "#CCC" : "#4A3A2A",
                            cursor: currentPage === 0 ? "default" : "pointer",
                        }}>← Précédent</button>

                        {/* Bucket list / Complete buttons */}
                        <div style={{ display: "flex", gap: 6 }}>
                            {onBucketList && (
                                <button onClick={onBucketList} style={{
                                    fontFamily: "'Playfair Display', serif", fontSize: 11, fontWeight: 700,
                                    padding: "6px 14px", borderRadius: 100, border: "none",
                                    background: `linear-gradient(135deg, ${bookColor.bg}, ${bookColor.spine})`,
                                    color: "#F5F0E8", cursor: "pointer",
                                }}>🪣 Bucket List</button>
                            )}
                            {onComplete && (
                                <button onClick={onComplete} style={{
                                    fontFamily: "'Playfair Display', serif", fontSize: 11, fontWeight: 700,
                                    padding: "6px 14px", borderRadius: 100, border: `1px solid ${bookColor.bg}30`,
                                    background: "transparent", color: bookColor.bg, cursor: "pointer",
                                }}>✅ Complété</button>
                            )}
                        </div>

                        <button disabled={currentPage >= totalPages - 1} onClick={() => goToPage(currentPage + 1)} style={{
                            fontFamily: "'Crimson Text', serif", fontSize: 13, padding: "6px 14px", borderRadius: 100,
                            border: `1px solid ${bookColor.bg}30`, background: "transparent",
                            color: currentPage >= totalPages - 1 ? "#CCC" : bookColor.bg,
                            cursor: currentPage >= totalPages - 1 ? "default" : "pointer",
                        }}>Suivant →</button>
                    </div>
                </div>

                {/* ── Page tabs (bookmarks) ── */}
                <div style={{
                    position: "absolute", right: -2, top: 50, display: "flex", flexDirection: "column", gap: 3, zIndex: 10,
                }}>
                    <div className="book-tab" onClick={() => goToPage(0)} style={{
                        padding: "5px 10px 5px 8px", borderRadius: "0 6px 6px 0", cursor: "pointer",
                        background: currentPage === 0 ? bookColor.bg : `${bookColor.bg}40`,
                        color: currentPage === 0 ? "#F5F0E8" : bookColor.accent,
                        fontFamily: "'Playfair Display', serif", fontSize: 9, fontWeight: 700,
                        transition: "all 0.2s", boxShadow: "2px 2px 6px rgba(0,0,0,0.15)",
                    }}>📖</div>
                    {guide.days?.map((d, i) => (
                        <div key={i} className="book-tab" onClick={() => goToPage(i + 1)} style={{
                            padding: "4px 10px 4px 8px", borderRadius: "0 6px 6px 0", cursor: "pointer",
                            background: currentPage === i + 1 ? bookColor.bg : `${bookColor.bg}20`,
                            color: currentPage === i + 1 ? "#F5F0E8" : `${bookColor.bg}80`,
                            fontFamily: "'Playfair Display', serif", fontSize: 9, fontWeight: 700,
                            transition: "all 0.2s", boxShadow: "2px 1px 4px rgba(0,0,0,0.1)",
                            animation: `floatBookmark 3s ease-in-out ${i * 0.2}s infinite`,
                        }}>J{d.day}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}
