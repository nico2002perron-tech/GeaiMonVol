import { SLOTS } from "./TravelBookConstants";

export function BudgetPanel({ bc, budget, g, budgetGoal, setBudgetGoal, tempBudgetGoal, setTempBudgetGoal, budgetAdvice, onClose }) {
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: bc.bg, margin: 0 }}>💰 Conseiller Budget</h4>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#8A7A6A", cursor: "pointer", fontSize: 12 }}>✕ Fermer</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                {[
                    { l: "Bouffe", v: budget.food, c: "#E84855" },
                    { l: "Activités", v: budget.activities, c: "#7C3AED" },
                    { l: "Héberg.", v: budget.accommodation, c: "#059669" },
                    { l: "TOTAL", v: budget.total, c: bc.bg, bold: true },
                ].map((x, i) => (
                    <div key={i} style={{ textAlign: "center", padding: "6px 4px", borderRadius: 8, background: `${x.c}08`, border: `1px solid ${x.c}15` }}>
                        <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 9, color: "#8A7A6A", textTransform: "uppercase" }}>{x.l}</div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: x.bold ? 18 : 14, fontWeight: 700, color: x.c }}>{Math.round(x.v)}$</div>
                    </div>
                ))}
            </div>
            {g.days?.length > 0 && (
                <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 12, color: "#6A5A4A", marginBottom: 8 }}>
                    📊 Moyenne/jour: <strong>{Math.round(budget.total / g.days.length)}$</strong> (Bouffe: {Math.round(budget.food / g.days.length)}$ · Activités: {Math.round(budget.activities / g.days.length)}$)
                </div>
            )}
            {!budgetGoal ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontFamily: "'Crimson Text',serif", fontSize: 12, color: "#6A5A4A" }}>🎯 Budget max:</span>
                    <input type="number" placeholder="Ex: 1500" value={tempBudgetGoal} onChange={e => setTempBudgetGoal(e.target.value)}
                        style={{ width: 80, padding: "4px 8px", borderRadius: 8, border: "1px solid rgba(0,0,0,.1)", fontSize: 12, fontFamily: "'Crimson Text',serif" }} />
                    <button onClick={() => { if (tempBudgetGoal) { setBudgetGoal(tempBudgetGoal); setTempBudgetGoal(""); } }}
                        style={{ padding: "4px 12px", borderRadius: 8, border: "none", background: bc.bg, color: "#F5F0E8", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>OK</button>
                </div>
            ) : (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontFamily: "'Crimson Text',serif", fontSize: 12, color: "#6A5A4A" }}>🎯 Budget: {budgetGoal}$</span>
                    <button onClick={() => setBudgetGoal(null)} style={{ fontSize: 10, color: "#8A7A6A", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Modifier</button>
                </div>
            )}
            {budgetAdvice?.suggestions && (
                <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: `${budgetAdvice.color}08`, border: `1px solid ${budgetAdvice.color}20` }}>
                    <p style={{ fontFamily: "'Crimson Text',serif", fontSize: 11, color: budgetAdvice.color, margin: 0 }}>🔎 {budgetAdvice.suggestions}</p>
                </div>
            )}
            <p style={{ fontFamily: "'Crimson Text',serif", fontSize: 10, color: "#AA9A8A", marginTop: 6, fontStyle: "italic" }}>
                💡 Clique sur n'importe quel prix dans l'itinéraire pour le modifier. Le budget se recalcule en temps réel!
            </p>
        </div>
    );
}

export function NotesPanel({ curPage, day, dayNotes, setDayNotes, onClose }) {
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: "#4A3A2A", margin: 0 }}>📝 Notes de voyage</h4>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#8A7A6A", cursor: "pointer", fontSize: 12 }}>✕ Fermer</button>
            </div>
            {curPage > 0 ? (
                <textarea placeholder={`Notes pour Jour ${day?.day}... (réservations, adresses, rappels)`}
                    value={dayNotes[curPage - 1] || ""} onChange={e => setDayNotes(p => ({ ...p, [curPage - 1]: e.target.value }))}
                    style={{ width: "100%", minHeight: 80, padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,.08)", fontFamily: "'Crimson Text',serif", fontSize: 13, resize: "vertical", background: "white", boxSizing: "border-box" }} />
            ) : (
                <textarea placeholder="Notes générales (numéro de vol, contacts, adresse hébergement)"
                    value={dayNotes.general || ""} onChange={e => setDayNotes(p => ({ ...p, general: e.target.value }))}
                    style={{ width: "100%", minHeight: 80, padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,.08)", fontFamily: "'Crimson Text',serif", fontSize: 13, resize: "vertical", background: "white", boxSizing: "border-box" }} />
            )}
        </div>
    );
}

export function ChecklistPanel({ bc, checklist, setChecklist, newCheckItem, setNewCheckItem, onClose }) {
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: "#4A3A2A", margin: 0 }}>✅ Ma checklist ({checklist.filter(c => c.done).length}/{checklist.length})</h4>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#8A7A6A", cursor: "pointer", fontSize: 12 }}>✕ Fermer</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {checklist.map((item, i) => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                        <input type="checkbox" checked={item.done}
                            onChange={() => setChecklist(p => p.map((c, j) => j === i ? { ...c, done: !c.done } : c))}
                            style={{ accentColor: bc.bg, width: 16, height: 16, cursor: "pointer" }} />
                        <span style={{ fontFamily: "'Crimson Text',serif", fontSize: 13, color: item.done ? "#AA9A8A" : "#4A3A2A", textDecoration: item.done ? "line-through" : "none", flex: 1 }}>{item.text}</span>
                        <button onClick={() => setChecklist(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#CCC", cursor: "pointer", fontSize: 10 }}>✕</button>
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input type="text" placeholder="Ajouter un item..." value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && newCheckItem.trim()) { setChecklist(p => [...p, { id: Date.now(), text: newCheckItem.trim(), done: false }]); setNewCheckItem(""); } }}
                    style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,.08)", fontFamily: "'Crimson Text',serif", fontSize: 12 }} />
                <button onClick={() => { if (newCheckItem.trim()) { setChecklist(p => [...p, { id: Date.now(), text: newCheckItem.trim(), done: false }]); setNewCheckItem(""); } }}
                    style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: bc.bg, color: "#F5F0E8", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+</button>
            </div>
        </div>
    );
}
