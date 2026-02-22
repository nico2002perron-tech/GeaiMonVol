'use client';
import { useState, useEffect } from 'react';

const EVENTS = [
    { name: "Marie L.", city: "Québec", action: "vient de réserver", dest: "Paris", price: "195$", ago: "il y a 3 min", emoji: "🇫🇷" },
    { name: "Jean-Philippe", city: "Montréal", action: "a ajouté à sa watchlist", dest: "Tokyo", price: "699$", ago: "il y a 5 min", emoji: "🇯🇵" },
    { name: "Camille R.", city: "Laval", action: "vient de réserver", dest: "Barcelone", price: "295$", ago: "il y a 8 min", emoji: "🇪🇸" },
    { name: "Alex T.", city: "Gatineau", action: "a reçu une alerte pour", dest: "Cancún", price: "220$", ago: "il y a 12 min", emoji: "🇲🇽" },
    { name: "Sophie M.", city: "Sherbrooke", action: "vient de réserver", dest: "Lisbonne", price: "329$", ago: "il y a 15 min", emoji: "🇵🇹" },
    { name: "David K.", city: "Trois-Rivières", action: "a téléchargé le guide IA pour", dest: "Rome", price: "345$", ago: "il y a 18 min", emoji: "🇮🇹" },
    { name: "Émilie B.", city: "Longueuil", action: "vient de réserver", dest: "New York", price: "149$", ago: "il y a 22 min", emoji: "🇺🇸" },
    { name: "Marc-Antoine", city: "Montréal", action: "a reçu une alerte pour", dest: "Bangkok", price: "659$", ago: "il y a 25 min", emoji: "🇹🇭" },
];

export default function SocialTicker() {
    const [current, setCurrent] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setCurrent((prev) => (prev + 1) % EVENTS.length);
                setVisible(true);
            }, 500);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const ev = EVENTS[current];

    return (
        <div style={{
            position: 'absolute',
            bottom: 252,
            left: 28,
            zIndex: 90,
            pointerEvents: 'none',
        }}>
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 16px 8px 10px',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(12px)',
                borderRadius: 12,
                boxShadow: '0 4px 20px rgba(26,43,66,0.1)',
                border: '1px solid rgba(46,125,219,0.08)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(6px)',
                transition: 'all 0.4s cubic-bezier(.22, 1, .36, 1)',
                maxWidth: 380,
            }}>
                <span style={{ fontSize: 20 }}>{ev.emoji}</span>
                <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 700, color: '#1A2B42' }}>{ev.name}</span>
                    <span style={{ color: '#8FA3B8' }}> de {ev.city} </span>
                    <span style={{ color: '#5A7089' }}>{ev.action} </span>
                    <span style={{ fontWeight: 700, color: '#2E7DDB' }}>{ev.dest}</span>
                    <span style={{ color: '#16A34A', fontWeight: 700 }}> à {ev.price}</span>
                    <div style={{ fontSize: 10, color: '#8FA3B8', marginTop: 1 }}>{ev.ago}</div>
                </div>
            </div>
        </div>
    );
}
