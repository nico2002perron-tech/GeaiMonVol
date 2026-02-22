'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthProvider';

const STEPS = [
    {
        title: "Quel type de voyageur es-tu?",
        subtitle: "Sélectionne tout ce qui s'applique",
        field: 'travel_style',
        type: 'multi',
        options: [
            { value: 'beach', label: '🏖️ Plage & Farniente' },
            { value: 'culture', label: '🏛️ Culture & Histoire' },
            { value: 'adventure', label: '🧗 Aventure & Nature' },
            { value: 'city', label: '🌆 Grandes villes' },
            { value: 'food', label: '🍽️ Gastronomie' },
            { value: 'party', label: '🎉 Nightlife & Fête' },
            { value: 'family', label: '👨👩👧 Familial' },
            { value: 'romantic', label: '💑 Romantique' },
        ],
    },
    {
        title: "Quelles destinations te font rêver?",
        subtitle: "On surveillera les prix pour toi",
        field: 'preferred_destinations',
        type: 'multi',
        options: [
            { value: 'Paris', label: '🇫🇷 Paris' },
            { value: 'Cancún', label: '🇲🇽 Cancún' },
            { value: 'Barcelone', label: '🇪🇸 Barcelone' },
            { value: 'Tokyo', label: '🇯🇵 Tokyo' },
            { value: 'New York', label: '🇺🇸 New York' },
            { value: 'Rome', label: '🇮🇹 Rome' },
            { value: 'Bangkok', label: '🇹🇭 Bangkok' },
            { value: 'Lisbonne', label: '🇵🇹 Lisbonne' },
            { value: 'Bali', label: '🇮🇩 Bali' },
            { value: 'Marrakech', label: '🇲🇦 Marrakech' },
            { value: 'Londres', label: '🇬🇧 Londres' },
            { value: 'Cuba', label: '🇨🇺 Cuba' },
        ],
    },
    {
        title: "Quel est ton budget par personne?",
        subtitle: "Pour un aller-retour depuis Montréal",
        field: 'budget',
        type: 'budget',
        options: [],
    },
    {
        title: "Tu pars quand d'habitude?",
        subtitle: "Sélectionne tes mois préférés",
        field: 'travel_months',
        type: 'multi',
        options: [
            { value: 'jan', label: 'Janvier' },
            { value: 'fev', label: 'Février' },
            { value: 'mar', label: 'Mars' },
            { value: 'avr', label: 'Avril' },
            { value: 'mai', label: 'Mai' },
            { value: 'jun', label: 'Juin' },
            { value: 'jul', label: 'Juillet' },
            { value: 'aou', label: 'Août' },
            { value: 'sep', label: 'Septembre' },
            { value: 'oct', label: 'Octobre' },
            { value: 'nov', label: 'Novembre' },
            { value: 'dec', label: 'Décembre' },
        ],
    },
    {
        title: "Qu'est-ce qui t'intéresse en voyage?",
        subtitle: "On personnalisera tes guides d'activités",
        field: 'interests',
        type: 'multi',
        options: [
            { value: 'museums', label: '🎨 Musées & Art' },
            { value: 'restaurants', label: '🍜 Restaurants locaux' },
            { value: 'hiking', label: '🥾 Randonnée' },
            { value: 'beaches', label: '🌊 Plages' },
            { value: 'nightlife', label: '🍸 Bars & Clubs' },
            { value: 'shopping', label: '🛍️ Shopping' },
            { value: 'landmarks', label: '📸 Monuments' },
            { value: 'spa', label: '🧖 Spa & Wellness' },
            { value: 'sports', label: '⚽ Sports & Stades' },
            { value: 'markets', label: '🏪 Marchés locaux' },
        ],
    },
];

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({
        travel_style: [],
        preferred_destinations: [],
        budget_min: 200,
        budget_max: 800,
        travel_months: [],
        interests: [],
    });
    const [saving, setSaving] = useState(false);
    const router = useRouter();
    const supabase = createClient();
    const { user, refreshProfile } = useAuth();

    const current = STEPS[step];
    const isLast = step === STEPS.length - 1;

    const toggleOption = (field: string, value: string) => {
        setAnswers(prev => {
            const arr = prev[field] || [];
            return {
                ...prev,
                [field]: arr.includes(value)
                    ? arr.filter((v: string) => v !== value)
                    : [...arr, value],
            };
        });
    };

    const handleFinish = async () => {
        if (!user) return;
        setSaving(true);

        const { error } = await supabase
            .from('profiles')
            .update({
                travel_style: answers.travel_style,
                preferred_destinations: answers.preferred_destinations,
                budget_min: answers.budget_min,
                budget_max: answers.budget_max,
                travel_months: answers.travel_months,
                interests: answers.interests,
                questionnaire_completed: true,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (!error) {
            // Add preferred destinations to watchlist
            for (const dest of answers.preferred_destinations) {
                await supabase.from('watchlist').upsert({
                    user_id: user.id,
                    destination: dest,
                    target_price: answers.budget_max,
                }, { onConflict: 'user_id,destination' });
            }
            await refreshProfile();
            router.push('/');
        }
        setSaving(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F4F8FB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Outfit', sans-serif",
            padding: 16,
        }}>
            <div style={{
                background: 'white',
                borderRadius: 24,
                padding: '36px 32px',
                maxWidth: 520,
                width: '100%',
                boxShadow: '0 4px 24px rgba(26,43,66,0.08)',
            }}>
                {/* Progress bar */}
                <div style={{
                    display: 'flex',
                    gap: 4,
                    marginBottom: 28,
                }}>
                    {STEPS.map((_, i) => (
                        <div key={i} style={{
                            flex: 1,
                            height: 3,
                            borderRadius: 2,
                            background: i <= step ? '#2E7DDB' : 'rgba(26,43,66,0.06)',
                            transition: 'background 0.3s',
                        }} />
                    ))}
                </div>

                {/* Step content */}
                <h2 style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#1A2B42',
                    marginBottom: 4,
                }}>
                    {current.title}
                </h2>
                <p style={{
                    fontSize: 13,
                    color: '#8FA3B8',
                    marginBottom: 24,
                }}>
                    {current.subtitle}
                </p>

                {/* Multi-select options */}
                {current.type === 'multi' && (
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                    }}>
                        {current.options.map((opt) => {
                            const selected = (answers[current.field] || []).includes(opt.value);
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => toggleOption(current.field, opt.value)}
                                    style={{
                                        padding: '9px 16px',
                                        borderRadius: 100,
                                        border: selected
                                            ? '1.5px solid #2E7DDB'
                                            : '1.5px solid rgba(26,43,66,0.08)',
                                        background: selected
                                            ? 'rgba(46,125,219,0.06)'
                                            : 'white',
                                        color: selected ? '#2E7DDB' : '#5A7089',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontFamily: "'Outfit', sans-serif",
                                    }}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Budget slider */}
                {current.type === 'budget' && (
                    <div style={{ padding: '10px 0' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 16,
                        }}>
                            <div>
                                <div style={{ fontSize: 11, color: '#8FA3B8', marginBottom: 2 }}>Minimum</div>
                                <div style={{
                                    fontFamily: "'Fredoka', sans-serif",
                                    fontSize: 24,
                                    fontWeight: 700,
                                    color: '#1A2B42',
                                }}>
                                    {answers.budget_min} $
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 11, color: '#8FA3B8', marginBottom: 2 }}>Maximum</div>
                                <div style={{
                                    fontFamily: "'Fredoka', sans-serif",
                                    fontSize: 24,
                                    fontWeight: 700,
                                    color: '#2E7DDB',
                                }}>
                                    {answers.budget_max} $
                                </div>
                            </div>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 11, color: '#8FA3B8' }}>Budget min</label>
                            <input
                                type="range"
                                min={100}
                                max={1500}
                                step={50}
                                value={answers.budget_min}
                                onChange={(e) => setAnswers(prev => ({
                                    ...prev,
                                    budget_min: parseInt(e.target.value),
                                }))}
                                style={{ width: '100%', accentColor: '#2E7DDB' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: '#8FA3B8' }}>Budget max</label>
                            <input
                                type="range"
                                min={200}
                                max={3000}
                                step={50}
                                value={answers.budget_max}
                                onChange={(e) => setAnswers(prev => ({
                                    ...prev,
                                    budget_max: parseInt(e.target.value),
                                }))}
                                style={{ width: '100%', accentColor: '#2E7DDB' }}
                            />
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 28,
                }}>
                    <button
                        onClick={() => step > 0 ? setStep(step - 1) : router.push('/')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: 100,
                            background: 'none',
                            border: '1px solid rgba(26,43,66,0.08)',
                            color: '#5A7089',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                        }}
                    >
                        {step > 0 ? '← Retour' : 'Passer'}
                    </button>
                    <button
                        onClick={() => isLast ? handleFinish() : setStep(step + 1)}
                        disabled={saving}
                        style={{
                            padding: '10px 24px',
                            borderRadius: 100,
                            border: 'none',
                            background: 'linear-gradient(135deg, #2E7DDB, #1E5FA8)',
                            color: 'white',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: "'Fredoka', sans-serif",
                            boxShadow: '0 4px 16px rgba(46,125,219,0.25)',
                        }}
                    >
                        {saving ? 'Sauvegarde...' : isLast ? 'Terminer ✓' : 'Suivant →'}
                    </button>
                </div>

                {/* Skip all */}
                {!isLast && (
                    <div style={{
                        textAlign: 'center',
                        marginTop: 16,
                    }}>
                        <button
                            onClick={() => {
                                handleFinish();
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#8FA3B8',
                                fontSize: 12,
                                cursor: 'pointer',
                            }}
                        >
                            Passer le questionnaire
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
