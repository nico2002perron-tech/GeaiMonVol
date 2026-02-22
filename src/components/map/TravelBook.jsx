import { useState, useMemo, useCallback, useEffect } from "react";
import { BOOK_COLORS, SLOTS, FOOD_PREFS, SWAP_REASONS, BOOK_CSS, calcDayBudget, calcTotalBudget } from "./TravelBookConstants";
import SubwayBuilder from "./SubwayBuilder";
import { BudgetPanel, NotesPanel, ChecklistPanel } from "./ToolPanels";

export default function TravelBook({ guide, region, guideId, onClose, onBucketList, onComplete }) {
    const [isOpen, setIsOpen] = useState(false);
    const [curPage, setCurPage] = useState(0);
    const [pgAnim, setPgAnim] = useState("in");
    const [swapModal, setSwapModal] = useState(null);
    const [swapAlts, setSwapAlts] = useState(null);
    const [swapLoad, setSwapLoad] = useState(false);
    const [localGuide, setLocalGuide] = useState(null);

    // Subway builder
    const [builderOpen, setBuilderOpen] = useState(false);
    const [builderDay, setBuilderDay] = useState(null);
    const [builderSlot, setBuilderSlot] = useState(null);
    const [builderStep, setBuilderStep] = useState("categories");
    const [builderSuggestions, setBuilderSuggestions] = useState([]);

    // Budget & tools
    const [editingCost, setEditingCost] = useState(null);
    const [tempCost, setTempCost] = useState("");
    const [activePanel, setActivePanel] = useState(null);
    const [checklist, setChecklist] = useState([]);
    const [newCheckItem, setNewCheckItem] = useState("");
    const [dayNotes, setDayNotes] = useState({});
    const [budgetGoal, setBudgetGoal] = useState(null);
    const [tempBudgetGoal, setTempBudgetGoal] = useState("");

    const g = localGuide || guide;
    const bc = useMemo(() => BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)], []);
    const totalP = (g?.days?.length || 0) + 1;
    const budget = useMemo(() => calcTotalBudget(g), [g]);

    useEffect(() => {
        if (guide?.packing_list && checklist.length === 0) {
            setChecklist(guide.packing_list.map((item, i) => ({ id: i, text: item, done: false })));
        }
    }, [guide]);

    const goTo = (p) => {
        if (p === curPage || p < 0 || p >= totalP) return;
        setPgAnim("out");
        setTimeout(() => { setCurPage(p); setPgAnim("in"); }, 250);
    };

    /* ── Swap ── */
    const doSwap = (dayIdx, slot, reason, foodPref) => {
        setSwapLoad(true);
        const body = { guide_id: guideId, destination: region, country: "Canada (Québec)", day_number: dayIdx + 1, slot, reason: reason || "pas_genre", original_activity: g.days[dayIdx][slot], budget_style: "moderate" };
        if (foodPref) body.food_preference = foodPref;
        fetch("/api/guide/swap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
            .then(r => r.json()).then(d => { setSwapAlts(d.alternatives || []); setSwapLoad(false); })
            .catch(() => { setSwapAlts([{ activity: "Erreur — réessaie", location: region, cost: 0 }]); setSwapLoad(false); });
    };
    const confirmSwap = (alt) => {
        const u = JSON.parse(JSON.stringify(g));
        u.days[swapModal.dayIdx][swapModal.slot] = alt;
        u.days[swapModal.dayIdx].total_cost = calcDayBudget(u.days[swapModal.dayIdx]);
        setLocalGuide(u); setSwapModal(null); setSwapAlts(null);
    };

    /* ── Builder ── */
    const fetchBuilderSuggestions = useCallback(async (dayIdx, slot, category) => {
        setBuilderStep("loading");
        const isMeal = SLOTS.find(s => s.slot === slot)?.isMeal;
        try {
            const res = await fetch("/api/guide/swap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guide_id: guideId, destination: region, country: "Canada (Québec)", day_number: dayIdx + 1, slot, reason: "pas_genre", original_activity: g.days[dayIdx]?.[slot] || { activity: "Rien", location: region, cost: 0 }, budget_style: "moderate", food_preference: isMeal ? category : undefined }) });
            const data = await res.json();
            setBuilderSuggestions(data.alternatives || []);
        } catch { setBuilderSuggestions([]); }
        setBuilderStep("suggestions");
    }, [guideId, region, g]);

    const confirmBuilder = (alt) => {
        if (builderDay === null || !builderSlot) return;
        const u = JSON.parse(JSON.stringify(g));
        u.days[builderDay][builderSlot] = alt;
        u.days[builderDay].total_cost = calcDayBudget(u.days[builderDay]);
        setLocalGuide(u); setBuilderOpen(false); setBuilderSuggestions([]); setBuilderStep("categories");
    };

    /* ── Cost edit ── */
    const updateCost = (dayIdx, slot, newCost) => {
        const u = JSON.parse(JSON.stringify(g));
        if (u.days[dayIdx]?.[slot]) { u.days[dayIdx][slot].cost = Number(newCost) || 0; u.days[dayIdx].total_cost = calcDayBudget(u.days[dayIdx]); }
        setLocalGuide(u); setEditingCost(null);
    };

    /* ── Budget advice ── */
    const getBudgetAdvice = useCallback(() => {
        if (!budgetGoal || !g?.days) return null;
        const goal = Number(budgetGoal), current = budget.total, diff = current - goal;
        const perDay = g.days.length > 0 ? diff / g.days.length : 0;
        if (diff <= 0) return { status: "good", message: `Dans ton budget! ${Math.abs(Math.round(diff))}$ de marge.`, color: "#059669" };
        if (diff < 50) return { status: "warning", message: `+${Math.round(diff)}$. Coupe ~${Math.round(perDay)}$/jour.`, color: "#F59E0B" };
        const expensive = [];
        g.days.forEach((day, di) => { SLOTS.forEach(({ slot }) => { const d = day[slot]; if (d?.cost && d.cost > 40) expensive.push({ day: di + 1, name: d.activity || d.name, cost: d.cost }); }); });
        expensive.sort((a, b) => b.cost - a.cost);
        return { status: "over", message: `+${Math.round(diff)}$! Réduis ~${Math.round(perDay)}$/jour.`, suggestions: expensive.length > 0 ? `Top dépenses: ${expensive.slice(0, 3).map(e => `${e.name} (${e.cost}$, J${e.day})`).join(", ")}` : null, color: "#E84855" };
    }, [budgetGoal, budget, g]);

    if (!g) return null;

    /* ═══ COVER ═══ */
    if (!isOpen) {
        return (
            <div onClick={e => { if (e.target === e.currentTarget && onClose) onClose(); }}
                style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.6)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <style>{BOOK_CSS}</style>
                <div onClick={() => setIsOpen(true)} style={{
                    width: 340, minHeight: 480, borderRadius: "4px 16px 16px 4px", cursor: "pointer",
                    background: `linear-gradient(135deg, ${bc.bg}, ${bc.spine})`,
                    boxShadow: `8px 8px 30px rgba(0,0,0,.5), inset -3px 0 8px rgba(0,0,0,.3)`,
                    position: "relative", overflow: "hidden", animation: "bookOpen .8s cubic-bezier(.34,1.56,.64,1) both",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 30px",
                }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 20, background: `linear-gradient(90deg, ${bc.spine}, transparent)` }} />
                    <div style={{ position: "absolute", inset: 20, border: `2px solid ${bc.accent}40`, borderRadius: 8 }} />
                    <div style={{ position: "absolute", inset: 24, border: `1px solid ${bc.accent}20`, borderRadius: 6 }} />
                    <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
                        <div style={{ fontSize: 36, marginBottom: 16 }}>⚜️</div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 11, color: bc.accent, letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>Carnet de Voyage</div>
                        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, color: "#F5F0E8", margin: "0 0 8px", lineHeight: 1.2, textShadow: "0 2px 8px rgba(0,0,0,.3)" }}>{region}</h1>
                        <div style={{ width: 60, height: 2, margin: "12px auto", background: `linear-gradient(90deg, transparent, ${bc.accent}, transparent)` }} />
                        <p style={{ fontFamily: "'Crimson Text',serif", fontSize: 14, fontStyle: "italic", color: `${bc.accent}CC`, margin: "12px 0 0", lineHeight: 1.5 }}>{g.summary}</p>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 11, color: bc.accent, letterSpacing: 2, textTransform: "uppercase", marginTop: 20, opacity: 0.6 }}>{g.days?.length || 7} Jours</div>
                    </div>
                    <div style={{ position: "absolute", bottom: 20, fontFamily: "'Crimson Text',serif", fontSize: 12, color: `${bc.accent}80`, animation: "floatBM 2s ease-in-out infinite" }}>Ouvrir le carnet →</div>
                    {onClose && <button onClick={e => { e.stopPropagation(); onClose(); }} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.3)", color: "rgba(255,255,255,.5)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>✕</button>}
                </div>
            </div>
        );
    }

    /* ═══ OPEN BOOK ═══ */
    const day = curPage > 0 ? g.days?.[curPage - 1] : null;
    const dayBudget = day ? calcDayBudget(day) : 0;
    const budgetAdvice = getBudgetAdvice();
    const budgetPct = budgetGoal ? Math.min(120, (budget.total / Number(budgetGoal)) * 100) : 0;

    return (
        <div onClick={e => { if (e.target === e.currentTarget && onClose) onClose(); }}
            style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.6)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
            <style>{BOOK_CSS}</style>
            <div style={{ width: "100%", maxWidth: 740, maxHeight: "94vh", display: "flex", borderRadius: "4px 16px 16px 4px", overflow: "hidden", boxShadow: "12px 12px 40px rgba(0,0,0,.5)", animation: "bookOpen .6s ease both", position: "relative" }}>

                {/* Spine */}
                <div style={{ width: 28, flexShrink: 0, background: `linear-gradient(180deg, ${bc.spine}, ${bc.bg}80, ${bc.spine})`, borderRight: `1px solid ${bc.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset -4px 0 8px rgba(0,0,0,.2)" }}>
                    <span style={{ writingMode: "vertical-rl", fontFamily: "'Playfair Display',serif", fontSize: 10, fontWeight: 700, color: bc.accent, letterSpacing: 2, textTransform: "uppercase", opacity: 0.6 }}>{region}</span>
                </div>

                {/* Page */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "linear-gradient(135deg, #FAF6F0, #F5EDE3, #FAF6F0)", position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,.015) 28px, rgba(0,0,0,.015) 29px)", pointerEvents: "none" }} />

                    {/* Top bar with tools */}
                    <div style={{ padding: "10px 20px 6px", borderBottom: `1px solid ${bc.accent}15`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
                        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 10, color: bc.bg, opacity: 0.4, letterSpacing: 2, textTransform: "uppercase" }}>⚜️ Carnet de Voyage</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontFamily: "'Crimson Text',serif", fontSize: 11, color: "rgba(0,0,0,.3)" }}>{curPage === 0 ? "Préface" : `Jour ${day?.day} / ${g.days?.length}`}</span>
                            {["💰", "📝", "✅"].map((icon, idx) => {
                                const panels = ["budget", "notes", "checklist"];
                                return (<button key={idx} onClick={() => setActivePanel(activePanel === panels[idx] ? null : panels[idx])} className="tool-btn" style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: activePanel === panels[idx] ? `${bc.bg}15` : "transparent", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</button>);
                            })}
                        </div>
                        {onClose && <button onClick={onClose} style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.04)", color: "rgba(0,0,0,.3)", fontSize: 13, cursor: "pointer" }}>✕</button>}
                    </div>

                    {/* Budget bar */}
                    {budgetGoal && (
                        <div style={{ padding: "5px 20px", background: `${budgetAdvice?.color || bc.bg}08`, borderBottom: "1px solid rgba(0,0,0,.04)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                <span style={{ fontSize: 11, fontFamily: "'Crimson Text',serif", color: budgetAdvice?.color || "#4A3A2A", fontWeight: 700 }}>
                                    {budgetAdvice?.status === "good" ? "✅" : budgetAdvice?.status === "warning" ? "⚠️" : "🚨"} {Math.round(budget.total)}$ / {budgetGoal}$
                                </span>
                                <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(0,0,0,.06)", overflow: "hidden" }}>
                                    <div className="budget-bar" style={{ width: `${Math.min(100, budgetPct)}%`, height: "100%", borderRadius: 3, background: budgetPct > 100 ? "#E84855" : budgetPct > 85 ? "#F59E0B" : "#059669" }} />
                                </div>
                            </div>
                            {budgetAdvice?.message && <p style={{ fontFamily: "'Crimson Text',serif", fontSize: 10, color: budgetAdvice.color, margin: 0 }}>💡 {budgetAdvice.message}</p>}
                        </div>
                    )}

                    {/* Tool panels */}
                    {activePanel && (
                        <div style={{ padding: "12px 20px", background: "rgba(250,246,240,.98)", borderBottom: "1px solid rgba(0,0,0,.06)", maxHeight: 200, overflowY: "auto", animation: "slideUp .2s ease", position: "relative", zIndex: 5 }}>
                            {activePanel === "budget" && <BudgetPanel bc={bc} budget={budget} g={g} budgetGoal={budgetGoal} setBudgetGoal={setBudgetGoal} tempBudgetGoal={tempBudgetGoal} setTempBudgetGoal={setTempBudgetGoal} budgetAdvice={budgetAdvice} onClose={() => setActivePanel(null)} />}
                            {activePanel === "notes" && <NotesPanel curPage={curPage} day={day} dayNotes={dayNotes} setDayNotes={setDayNotes} onClose={() => setActivePanel(null)} />}
                            {activePanel === "checklist" && <ChecklistPanel bc={bc} checklist={checklist} setChecklist={setChecklist} newCheckItem={newCheckItem} setNewCheckItem={setNewCheckItem} onClose={() => setActivePanel(null)} />}
                        </div>
                    )}

                    {/* Content */}
                    <div className="bk-page" style={{ flex: 1, overflowY: "auto", padding: "14px 20px 16px", position: "relative", zIndex: 2 }}>

                        {/* ═══ INTRO PAGE ═══ */}
                        {curPage === 0 && (
                            <div key="intro" style={{ animation: pgAnim === "in" ? "pageIn .3s ease" : "pageOut .25s ease" }}>
                                <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, color: "#1A1008", margin: "0 0 4px" }}>{g.title}</h1>
                                <div style={{ width: 50, height: 2, background: bc.bg, margin: "8px 0", opacity: 0.4 }} />
                                <p style={{ fontFamily: "'Crimson Text',serif", fontSize: 14, color: "#4A3A2A", lineHeight: 1.7, fontStyle: "italic" }}>{g.summary}</p>

                                {g.accommodation && (
                                    <div style={{ margin: "12px 0", padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,.6)", border: `1px solid ${bc.accent}20` }}>
                                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 12, fontWeight: 700, color: bc.bg, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>🏨 Hébergement</div>
                                        <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 15, fontWeight: 700, color: "#1A1008" }}>{g.accommodation.name}</div>
                                        <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 13, color: "#6A5A4A" }}>{g.accommodation.neighborhood} · {g.accommodation.type}</div>
                                        <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 13, color: bc.bg, fontWeight: 700, marginTop: 4 }}>{g.accommodation.price_per_night}$ / nuit</div>
                                    </div>
                                )}

                                {g.budget_summary && (
                                    <div style={{ margin: "12px 0", padding: "14px 16px", borderRadius: 12, border: `1px solid ${bc.accent}20`, background: "rgba(255,255,255,.4)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 12, fontWeight: 700, color: bc.bg, textTransform: "uppercase", letterSpacing: 1 }}>💰 Budget</div>
                                            <button onClick={() => setActivePanel("budget")} style={{ fontFamily: "'Crimson Text',serif", fontSize: 10, padding: "3px 10px", borderRadius: 100, border: `1px solid ${bc.bg}30`, background: "transparent", color: bc.bg, cursor: "pointer", fontWeight: 600 }}>🎯 Définir mon budget →</button>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                            {[{ l: "Total/pers", v: `${g.budget_summary.total_per_person || Math.round(budget.total)}$`, b: true }, { l: "Héberg.", v: `${g.budget_summary.accommodation_total || Math.round(budget.accommodation)}$` }, { l: "Bouffe", v: `${g.budget_summary.food_total || Math.round(budget.food)}$` }, { l: "Activités", v: `${g.budget_summary.activities_total || Math.round(budget.activities)}$` }].map((x, i) => (
                                                <div key={i}><div style={{ fontFamily: "'Crimson Text',serif", fontSize: 10, color: "#8A7A6A", textTransform: "uppercase" }}>{x.l}</div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: x.b ? 22 : 16, fontWeight: 700, color: x.b ? bc.bg : "#1A1008" }}>{x.v}</div></div>
                                            ))}
                                        </div>
                                        <p style={{ fontFamily: "'Crimson Text',serif", fontSize: 11, color: "#AA9A8A", marginTop: 8, fontStyle: "italic" }}>💡 Tous les prix sont modifiables! Clique sur un montant pour l'ajuster.</p>
                                    </div>
                                )}

                                {g.highlights && <div style={{ margin: "12px 0" }}>
                                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 12, fontWeight: 700, color: bc.bg, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>✨ Moments forts</div>
                                    {g.highlights.map((h, j) => <div key={j} style={{ fontFamily: "'Crimson Text',serif", fontSize: 14, color: "#4A3A2A", padding: "4px 0", borderBottom: "1px solid rgba(0,0,0,.03)" }}>• {h}</div>)}
                                </div>}

                                {g.packing_list && <div style={{ margin: "12px 0" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 12, fontWeight: 700, color: bc.bg, textTransform: "uppercase", letterSpacing: 1 }}>🎒 À emporter</div>
                                        <button onClick={() => setActivePanel("checklist")} style={{ fontFamily: "'Crimson Text',serif", fontSize: 10, color: bc.bg, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Voir checklist →</button>
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{g.packing_list.map((it, j) => <span key={j} style={{ fontFamily: "'Crimson Text',serif", fontSize: 12, padding: "3px 10px", borderRadius: 100, background: `${bc.bg}08`, color: "#4A3A2A" }}>{it}</span>)}</div>
                                </div>}

                                {g.region_tips && <div style={{ margin: "12px 0", padding: "12px 14px", borderRadius: 10, borderLeft: `3px solid ${bc.bg}40`, background: "rgba(0,0,0,.01)" }}>
                                    <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 13, color: "#4A3A2A", lineHeight: 1.6 }}>{g.region_tips}</div>
                                </div>}

                                <div style={{ textAlign: "center", marginTop: 20 }}>
                                    <button onClick={() => goTo(1)} style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, padding: "10px 28px", borderRadius: 100, border: `2px solid ${bc.bg}`, background: "transparent", color: bc.bg, cursor: "pointer" }}>Commencer l'aventure →</button>
                                </div>
                            </div>
                        )}

                        {/* ═══ DAY PAGES ═══ */}
                        {curPage > 0 && day && (
                            <div key={curPage} style={{ animation: pgAnim === "in" ? "pageIn .3s ease" : "pageOut .25s ease" }}>
                                <div style={{ marginBottom: 10 }}>
                                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 11, color: bc.bg, opacity: 0.5, letterSpacing: 2, textTransform: "uppercase" }}>Jour {day.day}</div>
                                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 900, color: "#1A1008", margin: "2px 0 0" }}>{day.theme} {day.title}</h2>
                                    <div style={{ width: 40, height: 2, background: bc.bg, margin: "6px 0", opacity: 0.3 }} />
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontFamily: "'Crimson Text',serif", fontSize: 13, color: bc.bg, fontWeight: 700 }}>Budget: {dayBudget}$</span>
                                        {budgetGoal && g.days?.length > 0 && (
                                            <span style={{ fontFamily: "'Crimson Text',serif", fontSize: 10, color: dayBudget > (Number(budgetGoal) / g.days.length) * 1.2 ? "#E84855" : "#059669", fontWeight: 600 }}>
                                                (idéal: ~{Math.round(Number(budgetGoal) / g.days.length)}$/jour)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* ═══ CUSTOMIZE BUTTON ═══ */}
                                <button onClick={() => { setBuilderDay(curPage - 1); setBuilderOpen(true); setBuilderSlot(null); setBuilderStep("categories"); }}
                                    style={{ width: "100%", padding: "14px 20px", marginBottom: 12, borderRadius: 14, border: `2px dashed ${bc.bg}40`, background: `linear-gradient(135deg, ${bc.bg}08, ${bc.bg}04)`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: bc.bg, transition: "all .3s", animation: "glow 3s ease-in-out infinite" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = `${bc.bg}12`; e.currentTarget.style.borderColor = bc.bg; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${bc.bg}08, ${bc.bg}04)`; e.currentTarget.style.borderColor = `${bc.bg}40`; }}>
                                    <span style={{ fontSize: 22 }}>🥖</span>
                                    Customize ton horaire à ton goût!
                                    <span style={{ fontSize: 22 }}>🎨</span>
                                </button>

                                {/* ═══ SLOTS ═══ */}
                                {SLOTS.map(({ slot, label, icon, isMeal }) => {
                                    const data = day[slot]; if (!data) return null;
                                    const nm = data.activity || data.name || "—";
                                    const sched = day.schedule?.[slot] || "";
                                    const dir = day[`getting_to_${slot}`];
                                    const isEditing = editingCost?.dayIdx === curPage - 1 && editingCost?.slot === slot;
                                    return (
                                        <div key={slot} style={{ marginBottom: 6 }}>
                                            {dir && <div style={{ padding: "2px 0 2px 48px", fontFamily: "'Crimson Text',serif", fontSize: 10, color: "#AA9A8A" }}>↓ {dir.mode} · {dir.duration}{dir.distance ? ` · ${dir.distance}` : ""}</div>}
                                            <div style={{ display: "flex", gap: 0, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(0,0,0,.05)" }}>
                                                {sched && <div style={{ width: 42, flexShrink: 0, background: `${bc.bg}08`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6px 2px", borderRight: `2px solid ${bc.bg}12` }}>
                                                    <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 800, color: bc.bg }}>{sched.split(":")[0]}</span>
                                                    <span style={{ fontFamily: "'Crimson Text',serif", fontSize: 9, color: `${bc.bg}80` }}>:{sched.split(":")[1] || "00"}</span>
                                                </div>}
                                                <div style={{ flex: 1, padding: "7px 10px", background: "rgba(255,255,255,.5)" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 9, fontWeight: 700, color: bc.bg, textTransform: "uppercase", letterSpacing: .5 }}>{icon} {label} {data.duration ? `· ${data.duration}` : ""}</span>
                                                        {isEditing ? (
                                                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                                <input type="number" autoFocus value={tempCost} onChange={e => setTempCost(e.target.value)}
                                                                    onKeyDown={e => { if (e.key === "Enter") updateCost(curPage - 1, slot, tempCost); if (e.key === "Escape") setEditingCost(null); }}
                                                                    style={{ width: 50, padding: "2px 4px", borderRadius: 6, border: `1px solid ${bc.bg}`, fontSize: 12, fontFamily: "'Playfair Display',serif", textAlign: "right" }} />
                                                                <button onClick={() => updateCost(curPage - 1, slot, tempCost)} style={{ fontSize: 10, background: bc.bg, color: "#F5F0E8", border: "none", borderRadius: 4, padding: "2px 6px", cursor: "pointer" }}>✓</button>
                                                                <span style={{ fontSize: 11, color: "#8A7A6A" }}>$</span>
                                                            </div>
                                                        ) : (
                                                            <span className="cost-edit" onClick={() => { setEditingCost({ dayIdx: curPage - 1, slot }); setTempCost(String(data.cost || 0)); }}
                                                                style={{ fontFamily: "'Playfair Display',serif", fontSize: 12, fontWeight: 700, color: "#1A1008", cursor: "pointer", padding: "1px 6px", borderRadius: 6, border: "1px solid transparent", transition: "all .2s" }}
                                                                title="Clique pour modifier le prix">{data.cost}$ ✏️</span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 14, fontWeight: 700, color: "#1A1008", marginTop: 1 }}>{nm}</div>
                                                    <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 11, color: "#6A5A4A" }}>📍 {data.location}</div>
                                                    {data.description && <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 11, color: "#6A5A4A", marginTop: 2 }}>{data.description}</div>}
                                                    {data.tip && <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 10, color: "#8A7A6A", fontStyle: "italic", marginTop: 2 }}>💡 {data.tip}</div>}
                                                    {data.must_try && <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 10, color: bc.bg, marginTop: 2 }}>⭐ {data.must_try}</div>}
                                                    <button onClick={() => { setSwapModal({ dayIdx: curPage - 1, slot, type: isMeal ? "meal" : "activity", step: isMeal ? "food_pref" : "reason" }); setSwapAlts(null); }}
                                                        style={{ marginTop: 4, padding: "3px 10px", borderRadius: 100, border: `1px solid ${bc.bg}20`, background: "transparent", color: bc.bg, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Crimson Text',serif" }}>
                                                        🔄 {isMeal ? "Autre resto" : "Changer"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {dayNotes[curPage - 1] && (
                                    <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: `${bc.bg}06`, border: `1px dashed ${bc.bg}20` }}>
                                        <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 11, color: "#6A5A4A" }}>📝 {dayNotes[curPage - 1]}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom bar */}
                    <div style={{ padding: "8px 16px 10px", borderTop: "1px solid rgba(0,0,0,.05)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2, background: "rgba(250,246,240,.95)" }}>
                        <button disabled={curPage === 0} onClick={() => goTo(curPage - 1)} style={{ fontFamily: "'Crimson Text',serif", fontSize: 12, padding: "5px 12px", borderRadius: 100, border: "1px solid rgba(0,0,0,.08)", background: "transparent", color: curPage === 0 ? "#CCC" : "#4A3A2A", cursor: curPage === 0 ? "default" : "pointer" }}>← Précédent</button>
                        <div style={{ display: "flex", gap: 5 }}>
                            {onBucketList && <button onClick={onBucketList} style={{ fontFamily: "'Playfair Display',serif", fontSize: 10, fontWeight: 700, padding: "5px 12px", borderRadius: 100, border: "none", background: `linear-gradient(135deg, ${bc.bg}, ${bc.spine})`, color: "#F5F0E8", cursor: "pointer" }}>🪣 Bucket List</button>}
                            {onComplete && <button onClick={onComplete} style={{ fontFamily: "'Playfair Display',serif", fontSize: 10, fontWeight: 700, padding: "5px 12px", borderRadius: 100, border: `1px solid ${bc.bg}30`, background: "transparent", color: bc.bg, cursor: "pointer" }}>✅ Complété</button>}
                        </div>
                        <button disabled={curPage >= totalP - 1} onClick={() => goTo(curPage + 1)} style={{ fontFamily: "'Crimson Text',serif", fontSize: 12, padding: "5px 12px", borderRadius: 100, border: `1px solid ${bc.bg}30`, background: "transparent", color: curPage >= totalP - 1 ? "#CCC" : bc.bg, cursor: curPage >= totalP - 1 ? "default" : "pointer" }}>Suivant →</button>
                    </div>
                </div>

                {/* Bookmarks */}
                <div style={{ position: "absolute", right: -2, top: 50, display: "flex", flexDirection: "column", gap: 3, zIndex: 10 }}>
                    <div className="bk-tab" onClick={() => goTo(0)} style={{ padding: "5px 10px 5px 8px", borderRadius: "0 6px 6px 0", cursor: "pointer", background: curPage === 0 ? bc.bg : `${bc.bg}40`, color: curPage === 0 ? "#F5F0E8" : bc.accent, fontFamily: "'Playfair Display',serif", fontSize: 9, fontWeight: 700, transition: "all .2s", boxShadow: "2px 2px 6px rgba(0,0,0,.15)" }}>📖</div>
                    {g.days?.map((d, i) => (
                        <div key={i} className="bk-tab" onClick={() => goTo(i + 1)} style={{ padding: "4px 10px 4px 8px", borderRadius: "0 6px 6px 0", cursor: "pointer", background: curPage === i + 1 ? bc.bg : `${bc.bg}20`, color: curPage === i + 1 ? "#F5F0E8" : `${bc.bg}80`, fontFamily: "'Playfair Display',serif", fontSize: 9, fontWeight: 700, transition: "all .2s", boxShadow: "2px 1px 4px rgba(0,0,0,.1)", animation: `floatBM 3s ease-in-out ${i * .2}s infinite` }}>J{d.day}</div>
                    ))}
                </div>
            </div>

            {/* ═══ SUBWAY BUILDER ═══ */}
            {builderOpen && <SubwayBuilder bc={bc} g={g} builderDay={builderDay} builderSlot={builderSlot} setBuilderSlot={setBuilderSlot} builderStep={builderStep} setBuilderStep={setBuilderStep} builderSuggestions={builderSuggestions} fetchBuilderSuggestions={fetchBuilderSuggestions} confirmBuilder={confirmBuilder} setBuilderOpen={setBuilderOpen} budgetGoal={budgetGoal} />}

            {/* ═══ SWAP MODAL ═══ */}
            {swapModal && (
                <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
                    onClick={e => { if (e.target === e.currentTarget) { setSwapModal(null); setSwapAlts(null); } }}>
                    <div style={{ width: "100%", maxWidth: 420, background: "#FAF6F0", borderRadius: 20, padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,.2)", animation: "fadeUp .3s ease", fontFamily: "'Crimson Text',serif" }}>
                        {swapModal.step === "food_pref" && <>
                            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: "#1A1008", textAlign: "center", marginBottom: 4 }}>Qu'est-ce qui te tente?</h3>
                            <p style={{ fontSize: 13, color: "#8A7A6A", textAlign: "center", marginBottom: 14 }}>Choisis un type de cuisine</p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                                {FOOD_PREFS.map(f => (
                                    <button key={f.v} onClick={() => { setSwapModal(p => ({ ...p, step: "loading", foodPref: f.v })); doSwap(swapModal.dayIdx, swapModal.slot, "pas_genre", f.v); }}
                                        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 8px", borderRadius: 12, border: "1px solid rgba(0,0,0,.06)", background: "white", cursor: "pointer", fontFamily: "'Crimson Text',serif", transition: "all .15s" }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = bc.bg} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(0,0,0,.06)"}>
                                        <span style={{ fontSize: 22 }}>{f.i}</span>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: "#1A1008" }}>{f.l}</span>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setSwapModal(null)} style={{ display: "block", margin: "14px auto 0", padding: "5px 14px", borderRadius: 100, border: "none", background: "rgba(0,0,0,.03)", color: "#8A7A6A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
                        </>}
                        {swapModal.step === "reason" && <>
                            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: "#1A1008", textAlign: "center", marginBottom: 14 }}>Pourquoi changer?</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                                {SWAP_REASONS.map(r => (
                                    <button key={r.v} onClick={() => { setSwapModal(p => ({ ...p, step: "loading" })); doSwap(swapModal.dayIdx, swapModal.slot, r.v); }}
                                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(0,0,0,.06)", background: "white", cursor: "pointer", fontFamily: "'Crimson Text',serif", fontSize: 14, fontWeight: 600, color: "#1A1008" }}>
                                        <span style={{ fontSize: 18 }}>{r.i}</span>{r.l}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setSwapModal(null)} style={{ display: "block", margin: "14px auto 0", padding: "5px 14px", borderRadius: 100, border: "none", background: "rgba(0,0,0,.03)", color: "#8A7A6A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
                        </>}
                        {swapModal.step === "loading" && swapLoad && (
                            <div style={{ textAlign: "center", padding: "30px 0" }}>
                                <div style={{ width: 40, height: 40, margin: "0 auto 14px", borderRadius: "50%", border: `3px solid ${bc.bg}20`, borderTopColor: bc.bg, animation: "spin 1s linear infinite" }} />
                                <p style={{ fontSize: 14, color: "#6A5A4A" }}>L'IA cherche des alternatives...</p>
                            </div>
                        )}
                        {swapAlts && swapAlts.length > 0 && <>
                            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: "#1A1008", textAlign: "center", marginBottom: 12 }}>3 alternatives</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {swapAlts.map((a, j) => {
                                    const currentCost = g.days?.[swapModal.dayIdx]?.[swapModal.slot]?.cost || 0;
                                    const costDiff = a.cost - currentCost;
                                    return (
                                        <button key={j} onClick={() => confirmSwap(a)}
                                            style={{ padding: "13px 14px", borderRadius: 14, border: "1.5px solid rgba(0,0,0,.06)", background: "white", cursor: "pointer", textAlign: "left", fontFamily: "'Crimson Text',serif", transition: "all .2s" }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = bc.bg} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(0,0,0,.06)"}>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1008" }}>{a.activity || a.name}</span>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: bc.bg }}>{a.cost}$</span>
                                            </div>
                                            <div style={{ fontSize: 12, color: "#6A5A4A", marginTop: 2 }}>📍 {a.location} {a.duration ? `· ${a.duration}` : ""} {a.rating ? `· ${a.rating}` : ""}</div>
                                            {a.must_try && <div style={{ fontSize: 11, color: bc.bg, marginTop: 2 }}>⭐ {a.must_try}</div>}
                                            {a.why && <div style={{ fontSize: 11, color: "#059669", marginTop: 2 }}>✓ {a.why}</div>}
                                            {budgetGoal && costDiff !== 0 && (
                                                <div style={{ marginTop: 4, fontSize: 10, fontWeight: 600, color: costDiff > 0 ? "#E84855" : "#059669" }}>
                                                    {costDiff > 0 ? `⚠️ +${costDiff}$ vs actuel` : `💰 −${Math.abs(costDiff)}$ vs actuel`}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <button onClick={() => { setSwapModal(null); setSwapAlts(null); }} style={{ display: "block", margin: "14px auto 0", padding: "5px 14px", borderRadius: 100, border: "none", background: "rgba(0,0,0,.03)", color: "#8A7A6A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Garder l'original</button>
                        </>}
                    </div>
                </div>
            )}
        </div>
    );
}
