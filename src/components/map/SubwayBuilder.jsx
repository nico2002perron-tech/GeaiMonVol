import { SLOTS, FOOD_PREFS, ACTIVITY_CATEGORIES } from "./TravelBookConstants";

export default function SubwayBuilder({ bc, g, builderDay, builderSlot, setBuilderSlot, builderStep, setBuilderStep, builderSuggestions, fetchBuilderSuggestions, confirmBuilder, setBuilderOpen, budgetGoal }) {
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
            onClick={e => { if (e.target === e.currentTarget) setBuilderOpen(false); }}>
            <div style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", background: "#FAF6F0", borderRadius: 20, padding: 0, boxShadow: "0 20px 50px rgba(0,0,0,.25)", animation: "fadeUp .3s ease" }}>

                {/* Header */}
                <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid rgba(0,0,0,.06)", background: `linear-gradient(135deg, ${bc.bg}08, transparent)` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 900, color: "#1A1008", margin: 0 }}>🥖 Build ta journée!</h3>
                            <p style={{ fontFamily: "'Crimson Text',serif", fontSize: 13, color: "#6A5A4A", margin: "4px 0 0" }}>Comme chez Subway — choisis ce que tu mets dans ta journée!</p>
                        </div>
                        <button onClick={() => setBuilderOpen(false)} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.05)", fontSize: 14, cursor: "pointer", color: "#8A7A6A" }}>✕</button>
                    </div>
                    <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 12, color: bc.bg, fontWeight: 600, marginTop: 8 }}>
                        📅 Jour {g.days?.[builderDay]?.day} — {g.days?.[builderDay]?.title}
                    </div>
                </div>

                {/* Select slot */}
                {!builderSlot && (
                    <div style={{ padding: "16px 24px 24px" }}>
                        <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: "#1A1008", marginBottom: 12 }}>Quel moment veux-tu personnaliser?</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {SLOTS.map(({ slot, label, icon, emoji }) => {
                                const data = g.days?.[builderDay]?.[slot];
                                return (
                                    <button key={slot} className="subway-item"
                                        onClick={() => { setBuilderSlot(slot); setBuilderStep("categories"); }}
                                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(0,0,0,.06)", background: "white", cursor: "pointer", textAlign: "left", fontFamily: "'Crimson Text',serif" }}>
                                        <span style={{ fontSize: 24 }}>{emoji}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1008" }}>{icon} {label}</div>
                                            <div style={{ fontSize: 11, color: "#8A7A6A" }}>{data ? `Actuel: ${data.activity || data.name || "—"} (${data.cost || 0}$)` : "Rien de prévu"}</div>
                                        </div>
                                        <span style={{ fontSize: 18, color: bc.bg }}>→</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Category selection */}
                {builderSlot && builderStep === "categories" && (
                    <div style={{ padding: "16px 24px 24px" }}>
                        <button onClick={() => setBuilderSlot(null)} style={{ fontFamily: "'Crimson Text',serif", fontSize: 12, color: bc.bg, background: "none", border: "none", cursor: "pointer", marginBottom: 8, fontWeight: 600 }}>← Retour aux moments</button>
                        <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: "#1A1008", marginBottom: 4 }}>
                            Qu'est-ce qui te tente pour {SLOTS.find(s => s.slot === builderSlot)?.label.toLowerCase()}?
                        </h4>
                        <p style={{ fontFamily: "'Crimson Text',serif", fontSize: 12, color: "#8A7A6A", marginBottom: 12 }}>L'IA va te proposer 3 options parfaites 🤖</p>

                        {SLOTS.find(s => s.slot === builderSlot)?.isMeal ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                                {FOOD_PREFS.map(f => (
                                    <button key={f.v} onClick={() => fetchBuilderSuggestions(builderDay, builderSlot, f.v)}
                                        className="subway-item"
                                        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "14px 8px", borderRadius: 12, border: "1px solid rgba(0,0,0,.06)", background: "white", cursor: "pointer" }}>
                                        <span style={{ fontSize: 24 }}>{f.i}</span>
                                        <span style={{ fontFamily: "'Crimson Text',serif", fontSize: 11, fontWeight: 600, color: "#1A1008" }}>{f.l}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                {ACTIVITY_CATEGORIES.map(cat => (
                                    <button key={cat.id} onClick={() => fetchBuilderSuggestions(builderDay, builderSlot, cat.id)}
                                        className="subway-item"
                                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 12, border: `1px solid ${cat.color}20`, background: `${cat.color}06`, cursor: "pointer", textAlign: "left" }}>
                                        <span style={{ fontSize: 24 }}>{cat.icon}</span>
                                        <span style={{ fontFamily: "'Crimson Text',serif", fontSize: 13, fontWeight: 700, color: "#1A1008" }}>{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Loading */}
                {builderStep === "loading" && (
                    <div style={{ padding: "50px 24px", textAlign: "center" }}>
                        <div style={{ width: 50, height: 50, margin: "0 auto 16px", borderRadius: "50%", border: `3px solid ${bc.bg}20`, borderTopColor: bc.bg, animation: "spin 1s linear infinite" }} />
                        <p style={{ fontFamily: "'Crimson Text',serif", fontSize: 15, color: "#6A5A4A", fontWeight: 600 }}>L'IA prépare tes options... 🤖</p>
                    </div>
                )}

                {/* Suggestions */}
                {builderStep === "suggestions" && (
                    <div style={{ padding: "16px 24px 24px" }}>
                        <button onClick={() => setBuilderStep("categories")} style={{ fontFamily: "'Crimson Text',serif", fontSize: 12, color: bc.bg, background: "none", border: "none", cursor: "pointer", marginBottom: 8, fontWeight: 600 }}>← Autre catégorie</button>
                        <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: "#1A1008", marginBottom: 12 }}>
                            Choisis ton {SLOTS.find(s => s.slot === builderSlot)?.isMeal ? "resto" : "activité"} 🎯
                        </h4>

                        {builderSuggestions.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {builderSuggestions.map((alt, j) => {
                                    const currentCost = g.days?.[builderDay]?.[builderSlot]?.cost || 0;
                                    const costDiff = alt.cost - currentCost;
                                    return (
                                        <button key={j} onClick={() => confirmBuilder(alt)} className="subway-item"
                                            style={{ padding: "16px", borderRadius: 14, border: "1.5px solid rgba(0,0,0,.06)", background: "white", cursor: "pointer", textAlign: "left", fontFamily: "'Crimson Text',serif" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: "#1A1008" }}>{alt.activity || alt.name}</span>
                                                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: bc.bg }}>{alt.cost}$</span>
                                            </div>
                                            <div style={{ fontSize: 12, color: "#6A5A4A", marginTop: 3 }}>📍 {alt.location} {alt.duration ? `· ⏱️ ${alt.duration}` : ""} {alt.rating ? `· ${alt.rating}` : ""}</div>
                                            {alt.description && <div style={{ fontSize: 12, color: "#4A3A2A", marginTop: 4 }}>{alt.description}</div>}
                                            {alt.must_try && <div style={{ fontSize: 11, color: bc.bg, marginTop: 3 }}>⭐ {alt.must_try}</div>}
                                            {alt.why && <div style={{ fontSize: 11, color: "#059669", marginTop: 3, fontWeight: 600 }}>✓ {alt.why}</div>}
                                            {alt.tip && <div style={{ fontSize: 11, color: "#8A7A6A", fontStyle: "italic", marginTop: 2 }}>💡 {alt.tip}</div>}
                                            {budgetGoal && costDiff !== 0 && (
                                                <div style={{ marginTop: 6, padding: "4px 8px", borderRadius: 6, background: costDiff > 0 ? "#E8485508" : "#05966908", fontSize: 10, fontWeight: 600, color: costDiff > 0 ? "#E84855" : "#059669" }}>
                                                    {costDiff > 0 ? `+${costDiff}$ vs actuel` : `−${Math.abs(costDiff)}$ vs actuel 💰`}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                                <button onClick={() => fetchBuilderSuggestions(builderDay, builderSlot, null)}
                                    style={{ display: "block", margin: "6px auto", padding: "8px 20px", borderRadius: 100, border: `1px solid ${bc.bg}30`, background: "transparent", color: bc.bg, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Crimson Text',serif" }}>
                                    🔄 D'autres suggestions
                                </button>
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", padding: 20 }}>
                                <p style={{ fontFamily: "'Crimson Text',serif", fontSize: 14, color: "#6A5A4A" }}>Aucune suggestion trouvée. Essaie une autre catégorie!</p>
                            </div>
                        )}
                        <button onClick={() => setBuilderOpen(false)} style={{ display: "block", margin: "10px auto 0", padding: "6px 16px", borderRadius: 100, border: "none", background: "rgba(0,0,0,.03)", color: "#8A7A6A", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Crimson Text',serif" }}>Garder l'original</button>
                    </div>
                )}
            </div>
        </div>
    );
}
