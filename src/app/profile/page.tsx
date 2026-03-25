'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { usePremium } from '@/lib/hooks/usePremium';
import Navbar from '@/components/layout/Navbar';

interface WatchlistItem {
    id: string;
    destination: string;
    destination_code?: string;
    target_price?: number;
    created_at: string;
}

interface SubscriptionInfo {
    plan: string;
    subscription_status: string;
    current_period_end: string | null;
}

export default function ProfilePage() {
    const { user, profile, loading: authLoading, signOut } = useAuth();
    const { isPremium, guideCount, guidesRemaining, watchlistLimit } = usePremium();

    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [watchlistLoading, setWatchlistLoading] = useState(false);
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [managingBilling, setManagingBilling] = useState(false);

    // Fetch watchlist
    useEffect(() => {
        if (!user) return;
        setWatchlistLoading(true);
        fetch('/api/watchlist')
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setWatchlist(data); })
            .catch(() => {})
            .finally(() => setWatchlistLoading(false));
    }, [user]);

    // Fetch subscription info
    useEffect(() => {
        if (!user) return;
        fetch('/api/subscription')
            .then(r => r.json())
            .then(data => { if (data.plan) setSubscription(data); })
            .catch(() => {});
    }, [user]);

    const handleManageBilling = async () => {
        setManagingBilling(true);
        try {
            const res = await fetch('/api/subscription', { method: 'POST' });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch {
            alert('Erreur lors de l\'ouverture du portail de facturation.');
        } finally {
            setManagingBilling(false);
        }
    };

    const handleRemoveWatchlist = async (destination: string) => {
        try {
            await fetch('/api/watchlist', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destination }),
            });
            setWatchlist(prev => prev.filter(w => w.destination !== destination));
        } catch {}
    };

    if (authLoading) {
        return (
            <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
                <Navbar dark />
                <div style={{ maxWidth: 600, margin: '0 auto', padding: '120px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>Chargement...</div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
                <Navbar dark />
                <div style={{ maxWidth: 500, margin: '0 auto', padding: '120px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Fredoka', sans-serif", color: '#0F172A', marginBottom: 8 }}>
                        Connexion requise
                    </h1>
                    <p style={{ fontSize: 14, color: '#64748B', fontFamily: "'Outfit', sans-serif", marginBottom: 24 }}>
                        Connecte-toi pour accéder à ton profil, ta watchlist et tes paramètres.
                    </p>
                    <a href="/auth" style={{
                        display: 'inline-block', padding: '12px 28px', borderRadius: 12,
                        background: 'linear-gradient(135deg, #00B4D8, #0077B6)',
                        color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: "'Fredoka', sans-serif",
                        textDecoration: 'none', boxShadow: '0 4px 14px rgba(0,119,182,0.25)',
                    }}>Se connecter</a>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
            <Navbar dark />

            <main style={{ maxWidth: 650, margin: '0 auto', padding: '90px 16px 40px' }}>
                {/* Header */}
                <div style={{
                    background: '#fff', borderRadius: 20, border: '2px solid #E0F2FE',
                    boxShadow: '0 4px 20px rgba(0,119,182,0.06)', overflow: 'hidden', marginBottom: 20,
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #00B4D8, #0077B6, #023E8A)',
                        padding: '28px 24px', color: '#fff',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: 16,
                                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 26, border: '2px solid rgba(255,255,255,0.2)',
                            }}>
                                {isPremium ? '👑' : '✈️'}
                            </div>
                            <div>
                                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Fredoka', sans-serif" }}>
                                    {profile?.full_name || user.email?.split('@')[0] || 'Voyageur'}
                                </div>
                                <div style={{ fontSize: 12, opacity: 0.8, fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                                    {user.email}
                                </div>
                                <div style={{
                                    display: 'inline-block', marginTop: 8,
                                    padding: '3px 10px', borderRadius: 6,
                                    background: isPremium ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.15)',
                                    fontSize: 11, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                    letterSpacing: 0.5,
                                }}>{isPremium ? '✨ PREMIUM' : 'GRATUIT'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
                        {[
                            { label: 'Guides créés', value: guideCount, icon: '📖' },
                            { label: 'Watchlist', value: watchlist.length, icon: '👁️' },
                            { label: 'Plan', value: isPremium ? 'Premium' : 'Gratuit', icon: isPremium ? '👑' : '🆓' },
                        ].map((stat, i) => (
                            <div key={i} style={{
                                padding: '16px', textAlign: 'center',
                                borderRight: i < 2 ? '1px solid #F1F5F9' : 'none',
                            }}>
                                <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', fontFamily: "'Fredoka', sans-serif" }}>
                                    {stat.value}
                                </div>
                                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Abonnement */}
                <div style={{
                    background: '#fff', borderRadius: 16, border: '2px solid #E0F2FE',
                    boxShadow: '0 2px 10px rgba(0,119,182,0.04)', padding: '20px', marginBottom: 20,
                }}>
                    <div style={{
                        fontSize: 14, fontWeight: 800, color: '#0F172A', fontFamily: "'Fredoka', sans-serif",
                        marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <span>💳</span> Abonnement
                    </div>

                    {isPremium ? (
                        <div>
                            <div style={{
                                padding: '14px 16px', borderRadius: 12,
                                background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
                                border: '1.5px solid #6EE7B7', marginBottom: 12,
                            }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#059669', fontFamily: "'Outfit', sans-serif" }}>
                                    ✅ Abonnement Premium actif
                                </div>
                                {subscription?.current_period_end && (
                                    <div style={{ fontSize: 11, color: '#065F46', fontFamily: "'Outfit', sans-serif", marginTop: 4 }}>
                                        Prochain renouvellement : {new Date(subscription.current_period_end).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                )}
                            </div>
                            <button onClick={handleManageBilling} disabled={managingBilling} style={{
                                width: '100%', padding: '10px', borderRadius: 10,
                                background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                                color: '#475569', fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                                cursor: 'pointer',
                            }}>
                                {managingBilling ? 'Ouverture...' : 'Gérer la facturation'}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div style={{
                                padding: '14px 16px', borderRadius: 12,
                                background: '#F8FAFC', border: '1.5px solid #E2E8F0', marginBottom: 12,
                            }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', fontFamily: "'Outfit', sans-serif" }}>
                                    Plan gratuit — {guidesRemaining} guide{guidesRemaining !== 1 ? 's' : ''} restant{guidesRemaining !== 1 ? 's' : ''}
                                </div>
                            </div>
                            <a href="/pricing" style={{
                                display: 'block', textAlign: 'center', padding: '12px', borderRadius: 10,
                                background: 'linear-gradient(135deg, #00B4D8, #0077B6)',
                                color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                                textDecoration: 'none', boxShadow: '0 3px 12px rgba(0,119,182,0.2)',
                            }}>
                                Passer Premium ✨
                            </a>
                        </div>
                    )}
                </div>

                {/* Watchlist */}
                <div style={{
                    background: '#fff', borderRadius: 16, border: '2px solid #E0F2FE',
                    boxShadow: '0 2px 10px rgba(0,119,182,0.04)', padding: '20px', marginBottom: 20,
                }}>
                    <div style={{
                        fontSize: 14, fontWeight: 800, color: '#0F172A', fontFamily: "'Fredoka', sans-serif",
                        marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>👁️</span> Ma Watchlist
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>
                            {watchlist.length}/{isPremium ? '∞' : watchlistLimit}
                        </span>
                    </div>

                    {watchlistLoading ? (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: '#94A3B8', fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>Chargement...</div>
                    ) : watchlist.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '24px 16px', borderRadius: 12,
                            background: '#F8FAFC', border: '1.5px dashed #CBD5E1',
                        }}>
                            <div style={{ fontSize: 28, marginBottom: 8 }}>🌍</div>
                            <div style={{ fontSize: 13, color: '#64748B', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                                Aucune destination suivie
                            </div>
                            <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: "'Outfit', sans-serif", marginTop: 4 }}>
                                Ajoute des destinations depuis les pages deals pour recevoir des alertes
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {watchlist.map(item => (
                                <div key={item.id || item.destination} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 14px', borderRadius: 12,
                                    background: '#F8FAFC', border: '1px solid #E2E8F0',
                                }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                                            ✈️ {item.destination}
                                        </div>
                                        {item.target_price && (
                                            <div style={{ fontSize: 11, color: '#059669', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                                                Cible : {item.target_price}$
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => handleRemoveWatchlist(item.destination)} style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontSize: 16, color: '#94A3B8', padding: '4px 8px',
                                    }}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Déconnexion */}
                <button onClick={signOut} style={{
                    width: '100%', padding: '12px', borderRadius: 12,
                    background: '#fff', border: '1.5px solid #FCA5A5',
                    color: '#DC2626', fontSize: 13, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                    cursor: 'pointer', marginBottom: 20,
                }}>
                    Se déconnecter
                </button>
            </main>

            <footer style={{ textAlign: 'center', padding: '24px 16px', borderTop: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>
                    GeaiMonVol — Deals de vols depuis Montréal
                </span>
            </footer>
        </div>
    );
}
