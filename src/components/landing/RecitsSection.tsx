'use client';
import { useState } from 'react';

const RECITS = [
    {
        id: 1,
        user: "Sophie T.",
        city: "Paris",
        price: 342,
        content: "Grâce à l'alerte GeaiMonVol, j'ai pu réserver un vol direct pour Paris pile au moment où le prix a chuté. Une économie de 400$ !",
        img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400",
        date: "Il y a 2 jours"
    },
    {
        id: 2,
        user: "Marc-André L.",
        city: "Tokyo",
        price: 789,
        content: "Je surveillais le Japon depuis des mois. Le radar m'a prévenu d'un 'Prix record'. J'ai sauté sur l'occasion, un voyage de rêve enfin possible.",
        img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400",
        date: "Il y a 1 semaine"
    },
    {
        id: 3,
        user: "Julie R.",
        city: "Lisbonne",
        price: 315,
        content: "Incroyable interface. On voit tout de suite où sont les aubaines. Lisbonne à ce prix là, c'était immanquable !",
        img: "https://images.unsplash.com/photo-1585211777166-73269c464104?w=400",
        date: "Il y a 3 jours"
    }
];

export default function RecitsSection() {
    return (
        <section id="recits" style={{
            padding: '80px 24px',
            background: 'white',
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 50 }}>
                    <h2 style={{
                        fontFamily: "'Fredoka', sans-serif", fontSize: 32,
                        fontWeight: 700, color: '#1A2B42', marginBottom: 16
                    }}>
                        Récits de voyageurs ✈️
                    </h2>
                    <p style={{
                        fontSize: 16, color: '#5A7089', maxWidth: 600, margin: '0 auto',
                        fontFamily: "'Outfit', sans-serif"
                    }}>
                        Découvrez comment notre communauté profite des prix records pour explorer le monde.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 30
                }}>
                    {RECITS.map((recit) => (
                        <div key={recit.id} style={{
                            background: '#F4F8FB',
                            borderRadius: 20,
                            overflow: 'hidden',
                            border: '1px solid rgba(26,43,66,0.06)',
                            transition: 'transform 0.3s ease',
                            cursor: 'default'
                        }}>
                            <img src={recit.img} alt={recit.city} style={{
                                width: '100%', height: 180, objectFit: 'cover'
                            }} />
                            <div style={{ padding: 24 }}>
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center', marginBottom: 16
                                }}>
                                    <span style={{
                                        fontSize: 12, fontWeight: 700, color: '#2E7DDB',
                                        background: 'rgba(46,125,219,0.08)', padding: '4px 12px',
                                        borderRadius: 100
                                    }}>
                                        {recit.city} à {recit.price}$
                                    </span>
                                    <span style={{ fontSize: 11, color: '#8FA3B8' }}>{recit.date}</span>
                                </div>
                                <p style={{
                                    fontSize: 14, color: '#1A2B42', lineHeight: 1.6,
                                    fontFamily: "'Outfit', sans-serif", fontStyle: 'italic',
                                    marginBottom: 16
                                }}>
                                    "{recit.content}"
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%',
                                        background: '#2E7DDB', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontWeight: 700, fontSize: 13
                                    }}>
                                        {recit.user.charAt(0)}
                                    </div>
                                    <span style={{
                                        fontSize: 13, fontWeight: 600, color: '#1A2B42',
                                        fontFamily: "'Outfit', sans-serif"
                                    }}>
                                        {recit.user}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: 40 }}>
                    <a href="/recits" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: '#1A2B42', color: 'white', padding: '12px 30px',
                        borderRadius: 100, textDecoration: 'none', fontWeight: 600,
                        fontFamily: "'Outfit', sans-serif", fontSize: 14,
                        transition: 'all 0.2s ease'
                    }}>
                        Voir plus de récits →
                    </a>
                </div>
            </div>
        </section>
    );
}
