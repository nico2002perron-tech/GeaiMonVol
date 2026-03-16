'use client';

import Navbar from '@/components/layout/Navbar';
import ExpeditionCard from '@/components/expedition/ExpeditionCard';
import { useAuth } from '@/lib/auth/AuthProvider';
import { usePremiumGate } from '@/lib/hooks/usePremiumGate';
import { EXPEDITIONS } from '@/data/expeditions-seed';
import Link from 'next/link';

export default function ExpeditionsPage() {
    const { user } = useAuth();
    const { isPremium } = usePremiumGate('expeditions');

    return (
        <div style={{ minHeight: '100vh', background: '#020810' }}>
            <Navbar dark />

            <main style={{
                maxWidth: 1100,
                margin: '0 auto',
                padding: '100px 16px 60px',
            }}>
                {/* Hero section */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#00D4FF',
                        fontFamily: "'Outfit', sans-serif",
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        marginBottom: 10,
                    }}>
                        Packs Multi-Etapes
                    </div>
                    <h1 style={{
                        fontSize: 38,
                        fontWeight: 800,
                        color: '#fff',
                        fontFamily: "'Fredoka', sans-serif",
                        margin: '0 0 12px',
                    }}>
                        Expeditions Nomades
                    </h1>
                    <p style={{
                        fontSize: 16,
                        color: 'rgba(255,255,255,0.6)',
                        fontFamily: "'Outfit', sans-serif",
                        maxWidth: 540,
                        margin: '0 auto',
                        lineHeight: 1.6,
                    }}>
                        Des itineraires multi-etapes de 10 a 14 jours avec vol + hebergements sequentiels. Change de ville, explore en profondeur.
                    </p>
                </div>

                {/* Premium banner for free users */}
                {!isPremium && (
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,212,255,0.03))',
                        border: '1px solid rgba(0,212,255,0.2)',
                        borderRadius: 16,
                        padding: '16px 24px',
                        marginBottom: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                    }}>
                        <span style={{ fontSize: 20 }}>🔒</span>
                        <span style={{
                            fontSize: 14,
                            color: 'rgba(255,255,255,0.85)',
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 600,
                        }}>
                            Feature Premium — Debloque les prix et hebergements
                        </span>
                        <Link href="/pricing" style={{
                            padding: '8px 20px',
                            background: '#00D4FF',
                            color: '#020810',
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: 13,
                            textDecoration: 'none',
                            fontFamily: "'Outfit', sans-serif",
                        }}>
                            Voir les plans
                        </Link>
                    </div>
                )}

                {/* Expedition grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 24,
                }}>
                    {EXPEDITIONS.map((exp) => (
                        <ExpeditionCard
                            key={exp.slug}
                            expedition={exp}
                            flightPrice={null}
                            locked={!isPremium}
                        />
                    ))}
                </div>

                {/* Upsell CTA for free users */}
                {!isPremium && (
                    <div style={{
                        marginTop: 48,
                        background: 'linear-gradient(135deg, rgba(0,212,255,0.06), rgba(0,212,255,0.02))',
                        border: '1px solid rgba(0,212,255,0.15)',
                        borderRadius: 24,
                        padding: '40px 28px',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 14 }}>🗺️</div>
                        <h2 style={{
                            fontSize: 24,
                            fontWeight: 800,
                            color: '#fff',
                            fontFamily: "'Fredoka', sans-serif",
                            marginBottom: 8,
                        }}>
                            Debloque les Packs Expedition
                        </h2>
                        <p style={{
                            fontSize: 14,
                            color: 'rgba(255,255,255,0.55)',
                            fontFamily: "'Outfit', sans-serif",
                            maxWidth: 440,
                            margin: '0 auto 24px',
                            lineHeight: 1.6,
                        }}>
                            Accede aux itineraires complets avec hebergements curated, estimation des couts et liens de reservation.
                        </p>
                        <Link href="/pricing" style={{
                            display: 'inline-block',
                            padding: '14px 36px',
                            background: '#00D4FF',
                            color: '#020810',
                            borderRadius: 14,
                            fontWeight: 700,
                            fontSize: 15,
                            textDecoration: 'none',
                            fontFamily: "'Outfit', sans-serif",
                        }}>
                            Passer Premium — 4,99$/mois
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
