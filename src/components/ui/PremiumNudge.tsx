'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';

/**
 * Slim banner between homepage sections — highlights premium value.
 * Only shown to free users.
 */
export function HomePremiumBanner() {
    const { profile } = useAuth();
    if (profile?.plan === 'premium') return null;

    return (
        <div style={{
            background: 'linear-gradient(135deg, #0F172A, #1E293B)',
            padding: '20px 24px',
            margin: '0 0 0',
        }}>
            <div style={{
                maxWidth: 900,
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                flexWrap: 'wrap',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flex: 1,
                    minWidth: 240,
                }}>
                    <span style={{ fontSize: 24 }}>&#9889;</span>
                    <div>
                        <div style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#FFD700',
                            fontFamily: "'Fredoka', sans-serif",
                        }}>
                            Passe Premium — Trouve le deal parfait
                        </div>
                        <div style={{
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.55)',
                            fontFamily: "'Outfit', sans-serif",
                            marginTop: 2,
                        }}>
                            Pack Builder vol + h&ocirc;tel &middot; Calendrier des prix &middot; Alertes prioritaires
                        </div>
                    </div>
                </div>
                <Link href="/pricing" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 24px',
                    borderRadius: 100,
                    background: 'linear-gradient(135deg, #FFB800, #FFD700)',
                    color: '#5C4A00',
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "'Fredoka', sans-serif",
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,184,0,0.4)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                    4,99$/mois &#8594;
                </Link>
            </div>
        </div>
    );
}

/**
 * Contextual nudge after the free AI analysis on destination page.
 * "L'IA a parlé — va plus loin avec le Pack Builder"
 */
export function PostAnalysisNudge({ city }: { city: string }) {
    const { profile } = useAuth();
    if (profile?.plan === 'premium') return null;

    return (
        <div style={{
            background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
            border: '1px solid #FDE68A',
            borderRadius: 16,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
        }}>
            <span style={{ fontSize: 22 }}>&#128161;</span>
            <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#92400E',
                    fontFamily: "'Outfit', sans-serif",
                }}>
                    Va plus loin avec le Pack Builder
                </div>
                <div style={{
                    fontSize: 12,
                    color: '#A16207',
                    fontFamily: "'Outfit', sans-serif",
                    marginTop: 2,
                    lineHeight: 1.4,
                }}>
                    Combine vol + h&ocirc;tel pour {city} et laisse l&apos;IA analyser ton pack complet.
                </div>
            </div>
            <Link href="/pricing" style={{
                padding: '8px 18px',
                borderRadius: 100,
                background: '#92400E',
                color: '#FEF3C7',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'Outfit', sans-serif",
                textDecoration: 'none',
                whiteSpace: 'nowrap',
            }}>
                D&eacute;bloquer
            </Link>
        </div>
    );
}

/**
 * Sticky bottom bar — appears after scrolling 600px.
 * Gentle, non-intrusive reminder for free users.
 */
export function StickyPremiumBar() {
    const { user, profile } = useAuth();
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (profile?.plan === 'premium' || dismissed) return;

        function onScroll() {
            setVisible(window.scrollY > 600);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [profile, dismissed]);

    if (profile?.plan === 'premium' || dismissed || !visible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 900,
            background: 'linear-gradient(135deg, #0F172A, #1E293B)',
            borderTop: '1px solid rgba(255,215,0,0.2)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            flexWrap: 'wrap',
            animation: 'slideUpBar 0.3s ease-out',
        }}>
            <style>{`
                @keyframes slideUpBar {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
            <span style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.8)',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 500,
            }}>
                &#9733; <strong style={{ color: '#FFD700' }}>Premium</strong> — Pack Builder + Calendrier des prix + Alertes prioritaires
            </span>
            <Link href={user ? '/pricing' : '/auth?redirect=/pricing'} style={{
                padding: '7px 18px',
                borderRadius: 100,
                background: 'linear-gradient(135deg, #FFB800, #FFD700)',
                color: '#5C4A00',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'Fredoka', sans-serif",
                textDecoration: 'none',
                whiteSpace: 'nowrap',
            }}>
                Essayer
            </Link>
            <button
                onClick={() => setDismissed(true)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 18,
                    cursor: 'pointer',
                    padding: '0 4px',
                    lineHeight: 1,
                }}
                aria-label="Fermer"
            >
                &times;
            </button>
        </div>
    );
}
