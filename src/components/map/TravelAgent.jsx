'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════
   CSS
   ═══════════════════════════════════════════════════════ */
const agentCSS = `
@keyframes agentPulse{0%,100%{box-shadow:0 4px 20px rgba(46,125,219,.2)}50%{box-shadow:0 4px 30px rgba(46,125,219,.4)}}
@keyframes agentSlideUp{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes agentFadeIn{from{opacity:0}to{opacity:1}}
@keyframes agentTyping{0%{opacity:.3}50%{opacity:1}100%{opacity:.3}}
@keyframes agentBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.agent-chat::-webkit-scrollbar{width:4px}
.agent-chat::-webkit-scrollbar-thumb{background:rgba(46,125,219,.15);border-radius:4px}
.agent-msg{animation:agentFadeIn .3s ease}
`;

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
}

function estimateWalkTime(km) {
    const minutes = Math.round(km / 0.08); // ~5km/h walking
    if (minutes < 1) return "1 min";
    return `${minutes} min`;
}

function getCurrentSlot() {
    const h = new Date().getHours();
    if (h < 9) return "breakfast";
    if (h < 12) return "morning";
    if (h < 14) return "lunch";
    if (h < 17) return "afternoon";
    if (h < 20) return "dinner";
    return "evening";
}

function getSlotLabel(slot) {
    const labels = { breakfast: "Déjeuner", morning: "Matin", lunch: "Dîner", afternoon: "Après-midi", dinner: "Souper", evening: "Soirée" };
    return labels[slot] || slot;
}

function getNextSlot(slot) {
    const order = ["breakfast", "morning", "lunch", "afternoon", "dinner", "evening"];
    const idx = order.indexOf(slot);
    return idx < order.length - 1 ? order[idx + 1] : null;
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function TravelAgent({ guide, region, guideId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [gpsError, setGpsError] = useState(null);
    const [gpsWatching, setGpsWatching] = useState(false);
    const [currentDay, setCurrentDay] = useState(0);
    const [hasGreeted, setHasGreeted] = useState(false);
    const chatRef = useRef(null);
    const watchRef = useRef(null);

    const g = guide;
    const today = g?.days?.[currentDay];

    // ── Auto-scroll chat ──
    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages, isTyping]);

    // ── Start GPS tracking ──
    const startGPS = useCallback(() => {
        if (!navigator.geolocation) {
            setGpsError("Géolocalisation non supportée par ton navigateur.");
            return;
        }
        setGpsWatching(true);
        watchRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
                setGpsError(null);
            },
            (err) => {
                setGpsError(err.code === 1 ? "Active ta localisation pour que je puisse te guider!" : "Erreur GPS. Réessaie.");
            },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
        );
    }, []);

    const stopGPS = useCallback(() => {
        if (watchRef.current !== null) {
            navigator.geolocation.clearWatch(watchRef.current);
            watchRef.current = null;
        }
        setGpsWatching(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => { return () => stopGPS(); }, [stopGPS]);

    // ── Greet on open ──
    useEffect(() => {
        if (isOpen && !hasGreeted && g) {
            setHasGreeted(true);
            const slot = getCurrentSlot();
            const slotData = today?.[slot];
            const greeting = slotData
                ? `Salut! 👋 Je suis ton agent de voyage IA pour ${region}. On est rendu au ${getSlotLabel(slot).toLowerCase()} — t'as "${slotData.activity || slotData.name}" de prévu à ${slotData.location}. Veux-tu que j'active le GPS pour te guider?`
                : `Salut! 👋 Je suis ton agent voyage pour ${region}. Je connais tout ton itinéraire. Pose-moi n'importe quelle question ou active le GPS pour que je te guide en temps réel!`;
            setMessages([{ role: 'agent', text: greeting, time: new Date() }]);
        }
    }, [isOpen, hasGreeted, g, today, region]);

    // ── Build context for AI ──
    const buildContext = useCallback(() => {
        const slot = getCurrentSlot();
        const nextSlot = getNextSlot(slot);
        const slotData = today?.[slot];
        const nextData = nextSlot ? today?.[nextSlot] : null;
        const now = new Date();
        const timeStr = now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });

        let locationContext = '';
        if (userLocation && slotData?.location) {
            locationContext = `\nPOSITION GPS: ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)} (précision: ${Math.round(userLocation.accuracy)}m)`;
        }

        return `CONTEXTE EN TEMPS RÉEL:
Destination: ${region}
Jour: ${currentDay + 1} / ${g?.days?.length || '?'}
Heure: ${timeStr}
Moment actuel: ${getSlotLabel(slot)}
${slotData ? `Activité en cours: ${slotData.activity || slotData.name} @ ${slotData.location} (${slotData.cost}$)` : 'Pas d\'activité prévue'}
${nextData ? `Prochaine activité: ${getSlotLabel(nextSlot)} — ${nextData.activity || nextData.name} @ ${nextData.location} (${nextData.cost}$)` : ''}
${locationContext}

ITINÉRAIRE COMPLET DU JOUR ${currentDay + 1}:
${today ? JSON.stringify(today, null, 1) : 'Pas de données'}

INFOS GÉNÉRALES:
${g?.accommodation ? `Hébergement: ${g.accommodation.name} @ ${g.accommodation.neighborhood}` : ''}
${g?.region_tips ? `Tips région: ${g.region_tips}` : ''}
Budget du jour: ${today?.total_cost || '?'}$`;
    }, [today, userLocation, currentDay, g, region]);

    // ── Send message to AI ──
    const sendMessage = useCallback(async (userMsg) => {
        if (!userMsg.trim()) return;

        const newMsg = { role: 'user', text: userMsg, time: new Date() };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const res = await fetch('/api/guide/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    context: buildContext(),
                    guide_id: guideId,
                    destination: region,
                    conversation: messages.slice(-8).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
                }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'agent', text: data.reply || "Désolé, j'ai eu un problème. Réessaie!", time: new Date() }]);
        } catch {
            setMessages(prev => [...prev, { role: 'agent', text: "Erreur de connexion. Vérifie ton internet!", time: new Date() }]);
        }
        setIsTyping(false);
    }, [buildContext, guideId, region, messages]);

    // ── Quick actions ──
    const quickActions = [
        { label: "📍 Où aller maintenant?", msg: "C'est quoi ma prochaine activité et comment m'y rendre?" },
        { label: "🍽️ Restos proches", msg: "Quels sont les bons restos proches de ma position actuelle?" },
        { label: "☔ Plan B pluie", msg: "Il pleut! C'est quoi mon plan B pour cette activité?" },
        { label: "💡 Suggestion locale", msg: "Suggère-moi quelque chose de cool à faire proche d'ici que je n'ai pas dans mon itinéraire." },
        { label: "⏰ Prochain move", msg: "À quelle heure je dois partir pour ma prochaine activité?" },
        { label: "💰 Budget restant", msg: "Combien j'ai dépensé aujourd'hui et combien il me reste?" },
    ];

    if (!g) return null;

    // ── FAB Button ──
    if (!isOpen) {
        return (
            <>
                <style>{agentCSS}</style>
                <button onClick={() => { setIsOpen(true); if (!gpsWatching) startGPS(); }}
                    style={{
                        position: 'fixed', bottom: 20, right: 20, width: 56, height: 56,
                        borderRadius: '50%', border: 'none', cursor: 'pointer', zIndex: 1200,
                        background: 'linear-gradient(135deg, #2E7DDB, #1A3A6B)',
                        color: 'white', fontSize: 24,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'agentPulse 3s ease-in-out infinite',
                        transition: 'transform .2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    ⚜️
                </button>
            </>
        );
    }

    // ── Chat Panel ──
    return (
        <>
            <style>{agentCSS}</style>
            <div style={{
                position: 'fixed', bottom: 16, right: 16, width: 370, maxWidth: 'calc(100vw - 32px)',
                height: 520, maxHeight: 'calc(100vh - 32px)',
                borderRadius: 20, overflow: 'hidden', zIndex: 1200,
                background: '#F8FAFF', border: '1px solid rgba(46,125,219,.12)',
                boxShadow: '0 20px 60px rgba(0,0,0,.2)', animation: 'agentSlideUp .3s ease',
                display: 'flex', flexDirection: 'column',
                fontFamily: "'Fredoka', sans-serif",
            }}>

                {/* Header */}
                <div style={{
                    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
                    background: 'linear-gradient(135deg, #2E7DDB, #1A3A6B)', color: 'white',
                }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚜️</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>Agent Geai</div>
                        <div style={{ fontSize: 10, opacity: 0.8 }}>
                            {gpsWatching && userLocation ? '📍 GPS actif' : gpsWatching ? '📡 Localisation...' : '📍 GPS inactif'}
                            {' · '}Jour {currentDay + 1} · {region}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {/* Day selector */}
                        <select value={currentDay} onChange={e => setCurrentDay(Number(e.target.value))}
                            style={{ padding: '4px 6px', borderRadius: 8, border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.15)', color: 'white', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                            {g.days?.map((d, i) => <option key={i} value={i} style={{ color: '#1A1008' }}>J{d.day}</option>)}
                        </select>
                        {/* GPS toggle */}
                        <button onClick={gpsWatching ? stopGPS : startGPS}
                            style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,.3)', background: gpsWatching ? 'rgba(5,150,105,.5)' : 'rgba(255,255,255,.15)', color: 'white', fontSize: 12, cursor: 'pointer' }}>
                            {gpsWatching ? '📍' : '📡'}
                        </button>
                        {/* Close */}
                        <button onClick={() => setIsOpen(false)}
                            style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.15)', color: 'white', fontSize: 12, cursor: 'pointer' }}>✕</button>
                    </div>
                </div>

                {/* GPS Error */}
                {gpsError && (
                    <div style={{ padding: '8px 16px', background: '#FEF3CD', fontSize: 11, color: '#856404', display: 'flex', alignItems: 'center', gap: 6 }}>
                        ⚠️ {gpsError}
                        <button onClick={startGPS} style={{ marginLeft: 'auto', background: '#2E7DDB', color: 'white', border: 'none', borderRadius: 6, padding: '2px 8px', fontSize: 10, cursor: 'pointer' }}>Réessayer</button>
                    </div>
                )}

                {/* Location bar */}
                {userLocation && gpsWatching && (
                    <div style={{ padding: '6px 16px', background: 'rgba(5,150,105,.05)', borderBottom: '1px solid rgba(0,0,0,.04)', fontSize: 10, color: '#059669', fontWeight: 600 }}>
                        📍 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)} · Précision: {Math.round(userLocation.accuracy)}m
                    </div>
                )}

                {/* Messages */}
                <div ref={chatRef} className="agent-chat" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {messages.map((msg, i) => (
                        <div key={i} className="agent-msg" style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                        }}>
                            <div style={{
                                padding: '10px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                background: msg.role === 'user' ? 'linear-gradient(135deg, #2E7DDB, #1A3A6B)' : 'white',
                                color: msg.role === 'user' ? 'white' : '#1A1008',
                                fontSize: 13, lineHeight: 1.5,
                                border: msg.role === 'user' ? 'none' : '1px solid rgba(46,125,219,.08)',
                                boxShadow: '0 2px 8px rgba(0,0,0,.04)',
                                whiteSpace: 'pre-wrap',
                            }}>
                                {msg.text}
                            </div>
                            <div style={{ fontSize: 9, color: '#8A9AB5', marginTop: 2, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                                {msg.time.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                        <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: 'white', border: '1px solid rgba(46,125,219,.08)' }}>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#2E7DDB', animation: `agentTyping 1.4s ease-in-out ${i * 0.2}s infinite` }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick actions */}
                {messages.length <= 2 && (
                    <div style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: 4, borderTop: '1px solid rgba(0,0,0,.04)' }}>
                        {quickActions.slice(0, 4).map((qa, i) => (
                            <button key={i} onClick={() => sendMessage(qa.msg)}
                                style={{ padding: '5px 10px', borderRadius: 100, border: '1px solid rgba(46,125,219,.1)', background: 'white', color: '#2E7DDB', fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(46,125,219,.05)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                {qa.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div style={{ padding: '10px 16px 14px', borderTop: '1px solid rgba(0,0,0,.06)', display: 'flex', gap: 8, background: 'white' }}>
                    <input value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                        placeholder="Demande-moi n'importe quoi..."
                        style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(46,125,219,.1)', fontSize: 13, fontFamily: "'Fredoka', sans-serif", outline: 'none' }}
                    />
                    <button onClick={() => sendMessage(input)} disabled={!input.trim() || isTyping}
                        style={{
                            width: 40, height: 40, borderRadius: '50%', border: 'none',
                            background: input.trim() ? 'linear-gradient(135deg, #2E7DDB, #1A3A6B)' : 'rgba(46,125,219,.1)',
                            color: 'white', fontSize: 16, cursor: input.trim() ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all .2s',
                        }}>
                        ↑
                    </button>
                </div>
            </div>
        </>
    );
}
