'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';

const POPULAR_DESTINATIONS = [
    { label: '🇲🇽 Cancún', value: 'CUN' },
    { label: '🇩🇴 Punta Cana', value: 'PUJ' },
    { label: '🇨🇺 Varadero', value: 'VRA' },
    { label: '🇫🇷 Paris', value: 'CDG' },
    { label: '🇪🇸 Barcelone', value: 'BCN' },
    { label: '🇵🇹 Lisbonne', value: 'LIS' },
    { label: '🇮🇹 Rome', value: 'FCO' },
    { label: '🇬🇧 Londres', value: 'LHR' },
    { label: '🇺🇸 New York', value: 'JFK' },
    { label: '🇺🇸 Miami', value: 'MIA' },
    { label: '🇺🇸 Las Vegas', value: 'LAS' },
    { label: '🇨🇷 Costa Rica', value: 'SJO' },
    { label: '🇨🇴 Bogota', value: 'BOG' },
    { label: '🇯🇲 Jamaïque', value: 'MBJ' },
    { label: '🇬🇷 Grèce', value: 'ATH' },
    { label: '🇳🇱 Amsterdam', value: 'AMS' },
    { label: '🇹🇭 Bangkok', value: 'BKK' },
    { label: '🇯🇵 Tokyo', value: 'NRT' },
    { label: '🇮🇩 Bali', value: 'DPS' },
    { label: '🇮🇸 Islande', value: 'KEF' },
];

const TRAVEL_STYLES = [
    { label: '🏖️ Plage & Farniente', value: 'plage' },
    { label: '🏛️ Culture & Histoire', value: 'culture' },
    { label: '🥾 Aventure & Nature', value: 'aventure' },
    { label: '🍽️ Gastronomie', value: 'gastronomie' },
    { label: '🎉 Nightlife & Fêtes', value: 'nightlife' },
    { label: '🧘 Bien-être & Détente', value: 'bienetre' },
    { label: '🏔️ Tout-inclus', value: 'toutinclus' },
    { label: '🎒 Backpacking', value: 'backpacking' },
];

const TRAVEL_MONTHS = [
    { label: 'Jan', value: 'janvier' },
    { label: 'Fév', value: 'février' },
    { label: 'Mar', value: 'mars' },
    { label: 'Avr', value: 'avril' },
    { label: 'Mai', value: 'mai' },
    { label: 'Jun', value: 'juin' },
    { label: 'Jul', value: 'juillet' },
    { label: 'Aoû', value: 'août' },
    { label: 'Sep', value: 'septembre' },
    { label: 'Oct', value: 'octobre' },
    { label: 'Nov', value: 'novembre' },
    { label: 'Déc', value: 'décembre' },
];

const BUDGET_OPTIONS = [
    { label: '300$ – 500$', value: 500 },
    { label: '500$ – 800$', value: 800 },
    { label: '800$ – 1200$', value: 1200 },
    { label: '1200$+', value: 2000 },
    { label: 'Pas de limite', value: 0 },
];

export default function OnboardingPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);

    const [destinations, setDestinations] = useState<string[]>([]);
    const [styles, setStyles] = useState<string[]>([]);
    const [months, setMonths] = useState<string[]>([]);
    const [budget, setBudget] = useState<number | null>(null);
    const [emailAlerts, setEmailAlerts] = useState(true);

    const toggleItem = (arr: string[], setArr: (v: string[]) => void, val: string) => {
        setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
    };

    const handleFinish = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    preferred_destinations: destinations,
                    travel_style: styles,
                    travel_months: months,
                    budget_max: budget === 0 ? null : budget,
                    email_notifications: emailAlerts,
                    questionnaire_completed: true,
                }),
            });
            router.push('/');
        } catch {
            router.push('/');
        }
    };

    const handleSkip = async () => {
        if (!user) { router.push('/'); return; }
        setSaving(true);
        try {
            await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionnaire_completed: true }),
            });
        } catch {}
        router.push('/');
    };

    const cardStyle: React.CSSProperties = {
        background: 'white', borderRadius: 24, padding: '36px 28px',
        maxWidth: 520, width: '100%', margin: '0 16px',
        boxShadow: '0 8px 40px rgba(0,119,182,0.1)',
    };

    const chipStyle = (active: boolean): React.CSSProperties => ({
        padding: '8px 16px', borderRadius: 100, border: 'none',
        fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
        cursor: 'pointer', transition: 'all 0.2s',
        background: active ? 'linear-gradient(135deg, #00B4D8, #0077B6)' : '#F1F5F9',
        color: active ? '#fff' : '#475569',
        boxShadow: active ? '0 2px 8px rgba(0,119,182,0.25)' : 'none',
    });

    const btnPrimary: React.CSSProperties = {
        width: '100%', padding: '14px', borderRadius: 14, border: 'none',
        background: 'linear-gradient(135deg, #00B4D8, #0077B6)',
        color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
        cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,119,182,0.25)',
    };

    const steps = [
        // Step 0 — Destinations
        <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🌍</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Fredoka', sans-serif", color: '#0F172A', margin: 0 }}>
                    Où rêves-tu d'aller?
                </h1>
                <p style={{ fontSize: 13, color: '#64748B', fontFamily: "'Outfit', sans-serif", marginTop: 6 }}>
                    Choisis tes destinations préférées pour recevoir les meilleurs deals
                </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
                {POPULAR_DESTINATIONS.map(d => (
                    <button key={d.value} onClick={() => toggleItem(destinations, setDestinations, d.value)} style={chipStyle(destinations.includes(d.value))}>
                        {d.label}
                    </button>
                ))}
            </div>
            <button onClick={() => setStep(1)} style={btnPrimary}>
                Continuer {destinations.length > 0 && `(${destinations.length} sélectionnées)`}
            </button>
        </>,

        // Step 1 — Style + Budget
        <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✈️</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Fredoka', sans-serif", color: '#0F172A', margin: 0 }}>
                    Ton style de voyage
                </h1>
                <p style={{ fontSize: 13, color: '#64748B', fontFamily: "'Outfit', sans-serif", marginTop: 6 }}>
                    On personnalise tes alertes selon tes préférences
                </p>
            </div>

            <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginBottom: 10 }}>
                    Type de voyage
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {TRAVEL_STYLES.map(s => (
                        <button key={s.value} onClick={() => toggleItem(styles, setStyles, s.value)} style={chipStyle(styles.includes(s.value))}>
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginBottom: 10 }}>
                    Budget max par vol (aller-retour)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {BUDGET_OPTIONS.map(b => (
                        <button key={b.value} onClick={() => setBudget(b.value)} style={chipStyle(budget === b.value)}>
                            {b.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(0)} style={{ ...btnPrimary, background: '#F1F5F9', color: '#475569', boxShadow: 'none', flex: '0 0 auto', width: 'auto', padding: '14px 20px' }}>
                    ← Retour
                </button>
                <button onClick={() => setStep(2)} style={{ ...btnPrimary, flex: 1 }}>
                    Continuer
                </button>
            </div>
        </>,

        // Step 2 — Months + Alerts
        <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Fredoka', sans-serif", color: '#0F172A', margin: 0 }}>
                    Quand veux-tu partir?
                </h1>
                <p style={{ fontSize: 13, color: '#64748B', fontFamily: "'Outfit', sans-serif", marginTop: 6 }}>
                    Sélectionne les mois où tu serais disponible pour voyager
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
                {TRAVEL_MONTHS.map(m => (
                    <button key={m.value} onClick={() => toggleItem(months, setMonths, m.value)} style={{
                        ...chipStyle(months.includes(m.value)),
                        padding: '12px 8px', borderRadius: 12, textAlign: 'center',
                    }}>
                        {m.label}
                    </button>
                ))}
            </div>

            <div style={{
                padding: '14px 16px', borderRadius: 14, background: '#F0F9FF',
                border: '1.5px solid #BAE6FD', marginBottom: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                        📬 Alertes par email
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                        Reçois les meilleurs deals directement dans ta boîte
                    </div>
                </div>
                <button onClick={() => setEmailAlerts(!emailAlerts)} style={{
                    width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                    background: emailAlerts ? '#00B4D8' : '#CBD5E1', position: 'relative',
                    transition: 'background 0.2s',
                }}>
                    <div style={{
                        width: 22, height: 22, borderRadius: 11, background: '#fff',
                        position: 'absolute', top: 3,
                        left: emailAlerts ? 23 : 3,
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    }} />
                </button>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ ...btnPrimary, background: '#F1F5F9', color: '#475569', boxShadow: 'none', flex: '0 0 auto', width: 'auto', padding: '14px 20px' }}>
                    ← Retour
                </button>
                <button onClick={handleFinish} disabled={saving} style={{ ...btnPrimary, flex: 1, opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Sauvegarde...' : 'C\'est parti! 🚀'}
                </button>
            </div>
        </>,
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #F0F9FF 0%, #F8FAFC 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Outfit', sans-serif",
        }}>
            {/* Progress */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{
                        width: i === step ? 32 : 10, height: 6, borderRadius: 3,
                        background: i <= step ? '#00B4D8' : '#CBD5E1',
                        transition: 'all 0.3s',
                    }} />
                ))}
            </div>

            <div style={cardStyle}>
                {steps[step]}
            </div>

            {/* Skip */}
            <button onClick={handleSkip} disabled={saving} style={{
                marginTop: 16, background: 'none', border: 'none',
                fontSize: 13, color: '#94A3B8', fontFamily: "'Outfit', sans-serif",
                cursor: 'pointer', fontWeight: 500,
            }}>
                Passer pour l'instant
            </button>
        </div>
    );
}
