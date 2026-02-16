'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmSent, setConfirmSent] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName },
                    },
                });
                if (error) throw error;
                setConfirmSent(true);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/');
            }
        } catch (err: any) {
            setError(
                err.message === 'Invalid login credentials'
                    ? 'Email ou mot de passe incorrect'
                    : err.message === 'User already registered'
                        ? 'Un compte existe déjà avec cet email'
                        : err.message
            );
        } finally {
            setLoading(false);
        }
    };

    if (confirmSent) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#F4F8FB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Outfit', sans-serif",
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: 20,
                    padding: '40px 36px',
                    maxWidth: 420,
                    width: '100%',
                    margin: '0 16px',
                    textAlign: 'center',
                    boxShadow: '0 4px 24px rgba(26,43,66,0.08)',
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
                    <h2 style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontSize: 22,
                        fontWeight: 700,
                        color: '#1A2B42',
                        marginBottom: 8,
                    }}>
                        Vérifie tes emails
                    </h2>
                    <p style={{
                        fontSize: 14,
                        color: '#5A7089',
                        lineHeight: 1.6,
                    }}>
                        On t'a envoyé un lien de confirmation à <strong>{email}</strong>.
                        Clique dessus pour activer ton compte, puis reviens ici.
                    </p>
                    <button
                        onClick={() => router.push('/auth')}
                        style={{
                            marginTop: 20,
                            padding: '10px 24px',
                            borderRadius: 100,
                            background: 'none',
                            border: '1px solid rgba(46,125,219,0.2)',
                            color: '#2E7DDB',
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: 'pointer',
                        }}
                    >
                        Retour au login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F4F8FB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Outfit', sans-serif",
        }}>
            <div style={{
                background: 'white',
                borderRadius: 20,
                padding: '40px 36px',
                maxWidth: 420,
                width: '100%',
                margin: '0 16px',
                boxShadow: '0 4px 24px rgba(26,43,66,0.08)',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontSize: 24,
                        fontWeight: 700,
                        color: '#1A2B42',
                    }}>
                        Geai<span style={{ color: '#2E7DDB' }}>Mon</span>Vol
                    </div>
                    <p style={{
                        fontSize: 13,
                        color: '#8FA3B8',
                        marginTop: 6,
                    }}>
                        {mode === 'login'
                            ? 'Connecte-toi pour accéder à tes deals'
                            : 'Crée ton compte pour sauvegarder tes destinations'
                        }
                    </p>
                </div>

                {/* Toggle login / signup */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(26,43,66,0.04)',
                    borderRadius: 100,
                    padding: 3,
                    marginBottom: 24,
                }}>
                    <button
                        onClick={() => { setMode('login'); setError(''); }}
                        style={{
                            flex: 1,
                            padding: '9px 0',
                            borderRadius: 100,
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: "'Outfit', sans-serif",
                            background: mode === 'login' ? 'white' : 'none',
                            color: mode === 'login' ? '#1A2B42' : '#8FA3B8',
                            boxShadow: mode === 'login' ? '0 1px 4px rgba(26,43,66,0.08)' : 'none',
                        }}
                    >
                        Connexion
                    </button>
                    <button
                        onClick={() => { setMode('signup'); setError(''); }}
                        style={{
                            flex: 1,
                            padding: '9px 0',
                            borderRadius: 100,
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: "'Outfit', sans-serif",
                            background: mode === 'signup' ? 'white' : 'none',
                            color: mode === 'signup' ? '#1A2B42' : '#8FA3B8',
                            boxShadow: mode === 'signup' ? '0 1px 4px rgba(26,43,66,0.08)' : 'none',
                        }}
                    >
                        Inscription
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        fontSize: 13,
                        color: '#DC2626',
                        marginBottom: 16,
                    }}>
                        {error}
                    </div>
                )}

                {/* Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {mode === 'signup' && (
                        <div>
                            <label style={{
                                fontSize: 12, fontWeight: 600, color: '#5A7089',
                                display: 'block', marginBottom: 5,
                            }}>
                                Nom complet
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Jean Tremblay"
                                style={{
                                    width: '100%',
                                    padding: '11px 14px',
                                    borderRadius: 10,
                                    border: '1px solid rgba(26,43,66,0.1)',
                                    fontSize: 14,
                                    fontFamily: "'Outfit', sans-serif",
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    background: '#FAFBFC',
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#2E7DDB'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(26,43,66,0.1)'}
                            />
                        </div>
                    )}

                    <div>
                        <label style={{
                            fontSize: 12, fontWeight: 600, color: '#5A7089',
                            display: 'block', marginBottom: 5,
                        }}>
                            Adresse email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="jean@email.com"
                            style={{
                                width: '100%',
                                padding: '11px 14px',
                                borderRadius: 10,
                                border: '1px solid rgba(26,43,66,0.1)',
                                fontSize: 14,
                                fontFamily: "'Outfit', sans-serif",
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                background: '#FAFBFC',
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#2E7DDB'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(26,43,66,0.1)'}
                        />
                    </div>

                    <div>
                        <label style={{
                            fontSize: 12, fontWeight: 600, color: '#5A7089',
                            display: 'block', marginBottom: 5,
                        }}>
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={mode === 'signup' ? 'Minimum 6 caractères' : '••••••••'}
                            style={{
                                width: '100%',
                                padding: '11px 14px',
                                borderRadius: 10,
                                border: '1px solid rgba(26,43,66,0.1)',
                                fontSize: 14,
                                fontFamily: "'Outfit', sans-serif",
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                background: '#FAFBFC',
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#2E7DDB'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(26,43,66,0.1)'}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !email || !password}
                        style={{
                            width: '100%',
                            padding: '12px 0',
                            borderRadius: 100,
                            border: 'none',
                            background: loading ? '#8FA3B8' : 'linear-gradient(135deg, #2E7DDB, #1E5FA8)',
                            color: 'white',
                            fontFamily: "'Fredoka', sans-serif",
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: loading ? 'wait' : 'pointer',
                            boxShadow: '0 4px 16px rgba(46,125,219,0.25)',
                            transition: 'all 0.2s',
                            marginTop: 4,
                        }}
                    >
                        {loading
                            ? 'Chargement...'
                            : mode === 'login'
                                ? 'Se connecter'
                                : 'Créer mon compte'
                        }
                    </button>
                </div>

                {/* Footer */}
                <div style={{
                    textAlign: 'center',
                    marginTop: 20,
                    fontSize: 12,
                    color: '#8FA3B8',
                }}>
                    <a href="/" style={{ color: '#2E7DDB', textDecoration: 'none', fontWeight: 600 }}>
                        ← Retour à la carte
                    </a>
                </div>
            </div>
        </div>
    );
}
