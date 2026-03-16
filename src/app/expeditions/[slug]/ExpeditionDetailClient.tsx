'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ItineraryTimeline from '@/components/expedition/ItineraryTimeline';
import PriceBreakdown from '@/components/expedition/PriceBreakdown';
import { usePremiumGate } from '@/lib/hooks/usePremiumGate';
import { EXPEDITIONS } from '@/data/expeditions-seed';
import { getDifficultyLabel, getDifficultyColor, getTagStyle } from '@/features/expeditions/expedition.service';
import { calculateExpeditionPricing } from '@/features/expeditions/expedition.service';

interface ExpeditionDetailClientProps {
    slug: string;
}

export default function ExpeditionDetailClient({ slug }: ExpeditionDetailClientProps) {
    const { isPremium } = usePremiumGate('expeditions');

    const exp = EXPEDITIONS.find((e) => e.slug === slug);

    const [flightPrice, setFlightPrice] = useState<number | null>(null);

    useEffect(() => {
        if (!exp) return;
        fetch(`/api/prices/destination?code=${exp.destinationCode}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.deals?.[0]?.price) setFlightPrice(Math.round(data.deals[0].price));
            })
            .catch(() => {});
    }, [exp?.destinationCode]);

    if (!exp) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#020810',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 16,
            }}>
                <Navbar dark />
                <div style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#fff',
                    fontFamily: "'Fredoka', sans-serif",
                }}>
                    Expédition introuvable
                </div>
                <Link href="/expeditions" style={{
                    fontSize: 14,
                    color: '#00D4FF',
                    textDecoration: 'none',
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 600,
                }}>
                    &larr; Retour aux expéditions
                </Link>
            </div>
        );
    }

    const diffLabel = getDifficultyLabel(exp.difficulty);
    const diffColor = getDifficultyColor(exp.difficulty);
    const totalNights = exp.totalNights;
    const routeString = 'YUL → ' + exp.stops.map((s) => s.city).join(' → ');

    // Build pricing from seed data
    const pricing = calculateExpeditionPricing(
        {
            id: '', slug: exp.slug, title: exp.title,
            destination_code: exp.destinationCode,
            total_nights: exp.totalNights,
            difficulty: exp.difficulty,
            tags: exp.tags,
            cover_image: exp.coverImage,
            description_fr: exp.descriptionFr,
            created_at: '',
            stops: exp.stops.map((s) => ({
                id: '', expedition_id: '', stop_order: s.stopOrder,
                city: s.city, country: s.country, nights: s.nights,
                description_fr: s.descriptionFr, highlights: s.highlights,
                accommodation_type: s.accommodationType,
                lat: s.lat, lng: s.lng,
                accommodations: [],
            })),
        },
        flightPrice
    );

    const locked = !isPremium;

    return (
        <div style={{ minHeight: '100vh', background: '#020810' }}>
            <Navbar dark />

            <main style={{
                maxWidth: 840,
                margin: '0 auto',
                padding: '90px 16px 40px',
            }}>
                {/* Back link */}
                <Link
                    href="/expeditions"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.5)',
                        textDecoration: 'none',
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 500,
                        marginBottom: 16,
                    }}
                >
                    &larr; Toutes les expéditions
                </Link>

                {/* Hero with cover image */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: 300,
                    borderRadius: 24,
                    overflow: 'hidden',
                    marginBottom: 28,
                }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${exp.coverImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }} />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(2,8,16,0.85) 0%, rgba(2,8,16,0.3) 50%, transparent 100%)',
                    }} />

                    <div style={{
                        position: 'relative',
                        zIndex: 1,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: '28px 24px',
                    }}>
                        {/* Badges */}
                        <div style={{
                            position: 'absolute',
                            top: 18,
                            left: 18,
                            display: 'flex',
                            gap: 8,
                            flexWrap: 'wrap',
                        }}>
                            <span style={{
                                padding: '5px 14px',
                                borderRadius: 100,
                                background: diffColor,
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 700,
                                fontFamily: "'Outfit', sans-serif",
                            }}>
                                {diffLabel}
                            </span>
                            {exp.tags.map((tag) => (
                                <span key={tag} style={{
                                    padding: '5px 12px',
                                    borderRadius: 100,
                                    background: 'rgba(255,255,255,0.15)',
                                    backdropFilter: 'blur(8px)',
                                    color: '#fff',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <h1 style={{
                            fontSize: 34,
                            fontWeight: 800,
                            color: '#fff',
                            fontFamily: "'Fredoka', sans-serif",
                            margin: '0 0 4px',
                            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                        }}>
                            {exp.title}
                        </h1>
                        <div style={{
                            fontSize: 14,
                            color: 'rgba(255,255,255,0.75)',
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 500,
                        }}>
                            {totalNights} nuits · {exp.stops.length} étapes
                        </div>
                    </div>
                </div>

                {/* Route summary */}
                <div style={{
                    background: 'rgba(0,212,255,0.06)',
                    border: '1px solid rgba(0,212,255,0.15)',
                    borderRadius: 14,
                    padding: '14px 20px',
                    marginBottom: 24,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                }}>
                    <span style={{ fontSize: 18 }}>✈️</span>
                    <span style={{
                        fontSize: 13,
                        color: '#00D4FF',
                        fontWeight: 600,
                        fontFamily: "'Outfit', sans-serif",
                    }}>
                        {routeString}
                    </span>
                    <span style={{
                        marginLeft: 'auto',
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.45)',
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 500,
                    }}>
                        {totalNights} nuits au total
                    </span>
                </div>

                {/* Description */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    padding: '20px 22px',
                    marginBottom: 28,
                }}>
                    <p style={{
                        fontSize: 15,
                        color: 'rgba(255,255,255,0.7)',
                        margin: 0,
                        fontFamily: "'Outfit', sans-serif",
                        lineHeight: 1.7,
                    }}>
                        {exp.descriptionFr}
                    </p>
                </div>

                {/* Itinerary Timeline */}
                <div style={{
                    marginBottom: 32,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 20,
                    padding: '24px 22px',
                }}>
                    <ItineraryTimeline stops={exp.stops} locked={locked} />
                </div>

                {/* Price Breakdown */}
                <div style={{
                    marginBottom: 32,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 20,
                    padding: '24px 22px',
                }}>
                    <PriceBreakdown pricing={pricing} locked={locked} />
                </div>

                {/* Premium upsell CTA */}
                {locked && (
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,212,255,0.02))',
                        border: '1px solid rgba(0,212,255,0.2)',
                        borderRadius: 24,
                        padding: '36px 28px',
                        textAlign: 'center',
                        marginBottom: 32,
                    }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>🔓</div>
                        <h3 style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: '#fff',
                            fontFamily: "'Fredoka', sans-serif",
                            margin: '0 0 8px',
                        }}>
                            Débloque cette expédition
                        </h3>
                        <p style={{
                            fontSize: 14,
                            color: 'rgba(255,255,255,0.5)',
                            fontFamily: "'Outfit', sans-serif",
                            maxWidth: 400,
                            margin: '0 auto 20px',
                            lineHeight: 1.6,
                        }}>
                            Accède aux hébergements curated, aux prix détaillés et aux liens de réservation pour chaque étape.
                        </p>
                        <Link href="/pricing" style={{
                            display: 'inline-block',
                            padding: '14px 32px',
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

            <footer style={{
                textAlign: 'center',
                padding: '24px 16px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                marginTop: 40,
            }}>
                <span style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.3)',
                    fontFamily: "'Outfit', sans-serif",
                }}>
                    GeaiMonVol — Deals de vols depuis Montréal
                </span>
            </footer>
        </div>
    );
}
