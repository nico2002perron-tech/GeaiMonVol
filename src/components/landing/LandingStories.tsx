'use client';

import React from 'react';

const STORIES = [
    {
        name: 'Nicolas',
        location: 'Paris',
        price: '380$',
        text: 'Jamais je n\'aurais cru voir Paris à ce prix. GeaiMonVol a changé ma façon de voyager !',
        img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=100&h=100&fit=crop',
    },
    {
        name: 'Sophie',
        location: 'Cancún',
        price: '295$',
        text: 'Direct et pas cher. Parfait pour un coup de tête au soleil !',
        img: 'https://images.unsplash.com/photo-1520116468414-046603d3d63b?w=100&h=100&fit=crop',
    },
    {
        name: 'Marc',
        location: 'Lisbonne',
        price: '410$',
        text: 'Alerté à 2h du matin, réservé à 2h05. Merci le Geai !',
        img: 'https://images.unsplash.com/photo-1585211777166-73269c464104?w=100&h=100&fit=crop',
    },
];

export default function LandingStories() {
    return (
        <section style={{ padding: '60px 24px', background: '#F4F8FB' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <h2 style={{
                        fontFamily: "'Fredoka', sans-serif", fontSize: 28,
                        fontWeight: 700, color: '#1A2B42', marginBottom: 12
                    }}>
                        Histoires de voyageurs
                    </h2>
                    <p style={{
                        maxWidth: 600, margin: '0 auto', color: '#5A7089',
                        fontSize: 16, lineHeight: 1.6
                    }}>
                        Ils ont fait confiance au Geai pour leurs vacances. Voici ce qu'ils ont trouvé.
                    </p>
                </div>

                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 24
                }}>
                    {STORIES.map((s, i) => (
                        <div key={i} style={{
                            background: 'white', padding: 24, borderRadius: 20,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                            border: '1px solid rgba(26,43,66,0.05)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                                <img src={s.img} alt={s.name} style={{
                                    width: 48, height: 48, borderRadius: '50%', objectFit: 'cover'
                                }} />
                                <div>
                                    <div style={{ fontWeight: 700, color: '#1A2B42' }}>{s.name}</div>
                                    <div style={{ fontSize: 13, color: '#2E7DDB', fontWeight: 600 }}>
                                        YUL → {s.location} pour {s.price}
                                    </div>
                                </div>
                            </div>
                            <p style={{
                                fontStyle: 'italic', color: '#4A5568', fontSize: 14,
                                lineHeight: 1.6, margin: 0
                            }}>
                                "{s.text}"
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
