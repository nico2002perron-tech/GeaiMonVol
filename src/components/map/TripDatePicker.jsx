'use client';
import { useState, useMemo } from 'react';

const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function TripDatePicker({ guide, region, guideId, tripDays, onSave, onSkip, onClose }) {
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate calendar days for current view
    const calendarDays = useMemo(() => {
        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const days = [];

        // Empty slots before first day
        for (let i = 0; i < firstDay; i++) days.push(null);
        // Actual days
        for (let i = 1; i <= daysInMonth; i++) days.push(i);

        return days;
    }, [viewMonth, viewYear]);

    const isDatePast = (day) => {
        if (!day) return false;
        const date = new Date(viewYear, viewMonth, day);
        return date < today;
    };

    const isSelected = (day) => {
        if (!day || !selectedDate) return false;
        return selectedDate.getDate() === day && selectedDate.getMonth() === viewMonth && selectedDate.getFullYear() === viewYear;
    };

    const endDate = useMemo(() => {
        if (!selectedDate || !tripDays) return null;
        const end = new Date(selectedDate);
        end.setDate(end.getDate() + (tripDays - 1));
        return end;
    }, [selectedDate, tripDays]);

    const isInRange = (day) => {
        if (!day || !selectedDate || !endDate) return false;
        const date = new Date(viewYear, viewMonth, day);
        return date > selectedDate && date <= endDate;
    };

    const handleSave = async () => {
        if (!selectedDate) return;
        setSaving(true);
        try {
            const res = await fetch("/api/guide/bucketlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    guide_id: guideId,
                    action: "add",
                    trip_date: selectedDate.toISOString().split('T')[0],
                    trip_end_date: endDate?.toISOString().split('T')[0] || null,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSaved(true);
                setTimeout(() => { if (onSave) onSave(selectedDate); }, 1500);
            }
        } catch (err) {
            alert("Erreur de sauvegarde. Réessaie!");
        }
        setSaving(false);
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    // Success state
    if (saved) {
        return (
            <div style={{ padding: "40px 30px", textAlign: "center", animation: "qF .4s ease", fontFamily: "'Fredoka', sans-serif" }}>
                <div style={{ fontSize: 56, marginBottom: 16, animation: "qFl 2s ease-in-out infinite" }}>🪣✈️</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: "#0F1D2F", margin: "0 0 8px" }}>Voyage enregistré!</h3>
                <p style={{ fontSize: 14, color: "#5A6B80", margin: "0 0 4px" }}>
                    <strong>{region}</strong> — {selectedDate?.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {endDate && (
                    <p style={{ fontSize: 12, color: "#8A9AB5", margin: "0 0 16px" }}>
                        au {endDate.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })} ({tripDays} jours)
                    </p>
                )}
                <div style={{ padding: "14px 20px", borderRadius: 14, background: "rgba(46,125,219,.04)", border: "1px solid rgba(46,125,219,.1)", margin: "0 auto", maxWidth: 320 }}>
                    <p style={{ fontSize: 13, color: "#2E7DDB", fontWeight: 600, margin: 0 }}>
                        📬 Tu recevras un courriel la veille de ton départ!
                    </p>
                    <p style={{ fontSize: 11, color: "#5A6B80", margin: "6px 0 0" }}>
                        L'Agent Geai ⚜️ s'activera automatiquement le jour J.
                    </p>
                </div>
                <p style={{ fontSize: 11, color: "#8A9AB5", marginTop: 16 }}>
                    Retrouve ton voyage dans Profil → Mes futurs voyages
                </p>
            </div>
        );
    }

    return (
        <div style={{ padding: "24px 24px 20px", fontFamily: "'Fredoka', sans-serif", animation: "qF .4s ease" }}>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0F1D2F", margin: "0 0 4px" }}>Quand veux-tu partir?</h3>
                <p style={{ fontSize: 13, color: "#5A6B80", margin: 0 }}>
                    Choisis ta date de départ pour <strong>{region}</strong> ({tripDays} jours)
                </p>
            </div>

            {/* Calendar */}
            <div style={{ maxWidth: 340, margin: "0 auto", background: "white", borderRadius: 16, padding: "16px", border: "1px solid rgba(46,125,219,.06)", boxShadow: "0 4px 20px rgba(0,0,0,.04)" }}>

                {/* Month navigation */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(46,125,219,.05)", color: "#2E7DDB", fontSize: 14, cursor: "pointer", fontWeight: 700 }}>←</button>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#0F1D2F" }}>
                        {MONTHS_FR[viewMonth]} {viewYear}
                    </span>
                    <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(46,125,219,.05)", color: "#2E7DDB", fontSize: 14, cursor: "pointer", fontWeight: 700 }}>→</button>
                </div>

                {/* Day headers */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
                    {DAYS_FR.map(d => (
                        <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "#8A9AB5", padding: "4px 0" }}>{d}</div>
                    ))}
                </div>

                {/* Days grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                    {calendarDays.map((day, i) => {
                        if (!day) return <div key={`empty-${i}`} />;
                        const past = isDatePast(day);
                        const sel = isSelected(day);
                        const inRange = isInRange(day);
                        return (
                            <button key={day} disabled={past}
                                onClick={() => setSelectedDate(new Date(viewYear, viewMonth, day))}
                                style={{
                                    width: "100%", aspectRatio: "1", borderRadius: sel ? "50%" : inRange ? 8 : "50%",
                                    border: "none", fontSize: 13, fontWeight: sel ? 700 : 500, cursor: past ? "default" : "pointer",
                                    background: sel ? "linear-gradient(135deg, #2E7DDB, #1A3A6B)" : inRange ? "rgba(46,125,219,.1)" : "transparent",
                                    color: sel ? "white" : past ? "#CCC" : inRange ? "#2E7DDB" : "#0F1D2F",
                                    transition: "all .15s",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                                onMouseEnter={e => { if (!past && !sel) e.currentTarget.style.background = "rgba(46,125,219,.06)"; }}
                                onMouseLeave={e => { if (!past && !sel && !inRange) e.currentTarget.style.background = "transparent"; else if (inRange && !sel) e.currentTarget.style.background = "rgba(46,125,219,.1)"; }}>
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected date info */}
            {selectedDate && (
                <div style={{ textAlign: "center", marginTop: 14, animation: "qF .2s ease" }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#2E7DDB", margin: "0 0 2px" }}>
                        ✈️ {selectedDate.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    {endDate && (
                        <p style={{ fontSize: 12, color: "#5A6B80", margin: 0 }}>
                            → Retour: {endDate.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })} ({tripDays} jours)
                        </p>
                    )}
                    {/* Countdown */}
                    {(() => {
                        const diff = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));
                        if (diff > 0) return <p style={{ fontSize: 11, color: "#8A9AB5", margin: "4px 0 0" }}>⏳ Dans {diff} jour{diff > 1 ? 's' : ''}!</p>;
                        return null;
                    })()}
                </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
                <button onClick={handleSave} disabled={!selectedDate || saving}
                    style={{
                        padding: "12px 24px", borderRadius: 100, border: "none",
                        background: selectedDate ? "linear-gradient(135deg, #2E7DDB, #1A3A6B)" : "rgba(46,125,219,.1)",
                        color: selectedDate ? "white" : "#8A9AB5",
                        fontSize: 14, fontWeight: 700, cursor: selectedDate ? "pointer" : "default",
                        display: "flex", alignItems: "center", gap: 6,
                        transition: "all .2s",
                        opacity: saving ? 0.7 : 1,
                    }}>
                    {saving ? "⏳ Sauvegarde..." : "🪣 Enregistrer vers Bucket List"}
                </button>
            </div>

            {/* Skip option */}
            <div style={{ textAlign: "center", marginTop: 10 }}>
                <button onClick={onSkip || onClose}
                    style={{ padding: "5px 14px", borderRadius: 100, border: "none", background: "transparent", color: "#8A9AB5", fontSize: 11, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
                    Je veux juste voir l'itinéraire pour l'instant
                </button>
            </div>
        </div>
    );
}
