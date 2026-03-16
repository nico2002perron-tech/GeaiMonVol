'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getDifficultyLabel, getDifficultyColor, getTagStyle } from '@/features/expeditions/expedition.service';

interface ExpeditionCardProps {
    expedition: {
        slug: string;
        title: string;
        destinationCode: string;
        totalNights: number;
        difficulty: 'easy' | 'moderate' | 'adventurous';
        tags: string[];
        coverImage: string;
        descriptionFr: string;
    };
    flightPrice: number | null;
    locked: boolean;
}

const DIFFICULTY_ICONS: Record<string, string> = {
    easy: '\u{1F33F}',
    moderate: '\u{1F3D4}\uFE0F',
    adventurous: '\u{1F9D7}',
};

export default function ExpeditionCard({ expedition, flightPrice, locked }: ExpeditionCardProps) {
    const [hovered, setHovered] = useState(false);
    const diffLabel = getDifficultyLabel(expedition.difficulty);
    const diffColor = getDifficultyColor(expedition.difficulty);
    const diffIcon = DIFFICULTY_ICONS[expedition.difficulty] || '';
    const pricePerNight = flightPrice && expedition.totalNights > 0
        ? Math.round(flightPrice / expedition.totalNights)
        : null;

    return (
        <Link
            href={`/expeditions/${expedition.slug}`}
            style={{
                display: 'block',
                borderRadius: 20,
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textDecoration: 'none',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                transform: hovered ? 'scale(1.02)' : 'scale(1)',
                boxShadow: hovered
                    ? '0 12px 40px rgba(0, 212, 255, 0.15)'
                    : '0 4px 20px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(12px)',
                position: 'relative',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Cover image area — 240px tall */}
            <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
                <img
                    src={expedition.coverImage}
                    alt={expedition.title}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease',
                        transform: hovered ? 'scale(1.05)' : 'scale(1)',
                    }}
                />
                {/* Gradient overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(2, 8, 16, 0.85) 0%, rgba(2, 8, 16, 0.2) 40%, transparent 70%)',
                }} />

                {/* Lock overlay */}
                {locked && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(2, 8, 16, 0.5)',
                        backdropFilter: 'blur(2px)',
                    }}>
                        <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            background: 'rgba(0, 0, 0, 0.6)',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* Difficulty badge — top right */}
                <div style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    padding: '5px 14px',
                    borderRadius: 100,
                    background: diffColor,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                    boxShadow: `0 2px 10px ${diffColor}66`,
                }}>
                    {diffIcon} {diffLabel}
                </div>

                {/* Duration badge — top left */}
                <div style={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    padding: '5px 12px',
                    borderRadius: 100,
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "'Outfit', sans-serif",
                }}>
                    {expedition.totalNights} nuits
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '16px 18px 18px' }}>
                {/* Title */}
                <div style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    fontFamily: "'Fredoka', sans-serif",
                    marginBottom: 6,
                }}>
                    {expedition.title}
                </div>

                {/* Description — truncated to 2 lines */}
                <p style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontFamily: "'Outfit', sans-serif",
                    lineHeight: 1.5,
                    margin: '0 0 12px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}>
                    {expedition.descriptionFr}
                </p>

                {/* Tags row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {expedition.tags.slice(0, 4).map((tag) => {
                        const ts = getTagStyle(tag);
                        return (
                            <span key={tag} style={{
                                padding: '3px 10px',
                                borderRadius: 100,
                                background: ts.bg,
                                color: ts.color,
                                fontSize: 10,
                                fontWeight: 600,
                                fontFamily: "'Outfit', sans-serif",
                                border: `1px solid ${ts.color}33`,
                            }}>
                                {tag}
                            </span>
                        );
                    })}
                </div>

                {/* Bottom: pricing row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 14,
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}>
                    {flightPrice ? (
                        <>
                            <div>
                                <div style={{
                                    fontSize: 10,
                                    color: 'rgba(255, 255, 255, 0.45)',
                                    fontFamily: "'Outfit', sans-serif",
                                    marginBottom: 2,
                                }}>
                                    Vol aller-retour
                                </div>
                                <span style={{
                                    fontSize: 22,
                                    fontWeight: 800,
                                    color: '#00D4FF',
                                    fontFamily: "'Fredoka', sans-serif",
                                }}>
                                    {flightPrice} $
                                </span>
                            </div>
                            {pricePerNight && (
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        fontSize: 10,
                                        color: 'rgba(255, 255, 255, 0.45)',
                                        fontFamily: "'Outfit', sans-serif",
                                        marginBottom: 2,
                                    }}>
                                        a partir de
                                    </div>
                                    <span style={{
                                        fontSize: 16,
                                        fontWeight: 700,
                                        color: 'rgba(255, 255, 255, 0.85)',
                                        fontFamily: "'Fredoka', sans-serif",
                                    }}>
                                        {pricePerNight}$/nuit
                                    </span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{
                            fontSize: 13,
                            color: 'rgba(255, 255, 255, 0.35)',
                            fontFamily: "'Outfit', sans-serif",
                        }}>
                            Prix en chargement...
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
