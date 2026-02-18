'use client';
import React from 'react';

const STORIES = [
    {
        id: 1,
        author: 'Marc-Antoine S.',
        avatar: 'https://i.pravatar.cc/150?u=marc',
        destination: 'Lisbonne, Portugal',
        price: 385,
        rating: 5,
        title: 'Explosion de saveurs et de couleurs',
        excerpt: 'Grâce à l\'alerte GeaiMonVol, j\'ai pu m\'envoler pour Lisbonne à un prix dérisoire. Une ville magnifique où chaque ruelle cache une surprise...',
        likes: 124,
        comments: 12,
    },
    {
        id: 2,
        author: 'Sophie L.',
        avatar: 'https://i.pravatar.cc/150?u=sophie',
        destination: 'Tokyo, Japon',
        price: 642,
        rating: 5,
        title: 'Un rêve devenu réalité',
        excerpt: 'Le Japon me paraissait inaccessible. L\'IA de Geai a détecté une erreur de prix, j\'ai réservé en 5 minutes. Une expérience inoubliable !',
        likes: 256,
        comments: 48,
    },
    {
        id: 3,
        author: 'Julien T.',
        avatar: 'https://i.pravatar.cc/150?u=julien',
        destination: 'Cancún, Mexique',
        price: 298,
        rating: 4.5,
        title: 'Le repos total au meilleur prix',
        excerpt: 'Pas besoin de chercher pendant des heures. Le Deal de la semaine était parfait pour nos vacances en famille.',
        likes: 89,
        comments: 7,
    }
];

export default function RecitsSection() {
    return (
        <section style={{
            padding: '80px 24px',
            background: 'linear-gradient(180deg, #F4F8FB 0%, #FFFFFF 100%)',
            borderTop: '1px solid rgba(26,43,66,0.06)',
        }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 50 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 16px', borderRadius: 100, background: 'rgba(124,58,237,0.06)',
                        border: '1px solid rgba(124,58,237,0.12)', color: '#7C3AED',
                        fontSize: 12, fontWeight: 700, marginBottom: 16,
                        textTransform: 'uppercase', letterSpacing: 0.5
                    }}>
                        ✈️ Partagez l'aventure
                    </div>
                    <h2 style={{
                        fontFamily: "'Fredoka', sans-serif", fontSize: 32,
                        fontWeight: 700, color: '#1A2B42', marginBottom: 12
                    }}>
                        Récits de nos voyageurs
                    </h2>
                    <p style={{
                        maxWidth: 600, margin: '0 auto', fontSize: 16,
                        color: '#5A7089', lineHeight: 1.6
                    }}>
                        Découvrez comment nos membres parcourent le monde sans se ruiner.
                        Chaque voyage aide notre IA à trouver de meilleurs deals.
                    </p>
                </div>

                <div style={{
                    display: 'flex', gap: 24, overflowX: 'auto',
                    paddingBottom: 20, scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                }}>
                    {STORIES.map(story => (
                        <div key={story.id} style={{
                            flex: '0 0 340px', background: 'white', borderRadius: 20,
                            padding: 24, boxShadow: '0 4px 20px rgba(26,43,66,0.05)',
                            border: '1px solid rgba(26,43,66,0.06)',
                            display: 'flex', flexDirection: 'column', gap: 16,
                            transition: 'transform 0.3s ease', cursor: 'pointer'
                        }} className="story-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <img src={story.avatar} alt={story.author} style={{
                                    width: 44, height: 44, borderRadius: '50%', objectFit: 'cover',
                                    border: '2px solid #F4F8FB'
                                }} />
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2B42' }}>{story.author}</div>
                                    <div style={{ fontSize: 12, color: '#8FA3B8' }}>{story.destination}</div>
                                </div>
                                <div style={{
                                    marginLeft: 'auto', background: '#ecfdf5', color: '#16a34a',
                                    fontSize: 14, fontWeight: 800, padding: '4px 10px', borderRadius: 8
                                }}>
                                    {story.price}$
                                </div>
                            </div>

                            <h3 style={{
                                fontSize: 18, fontWeight: 700, color: '#1A2B42',
                                margin: 0, lineHeight: 1.3
                            }}>{story.title}</h3>

                            <p style={{
                                fontSize: 14, color: '#5A7089', lineHeight: 1.5,
                                margin: 0, display: '-webkit-box', WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical', overflow: 'hidden'
                            }}>{story.excerpt}</p>

                            <div style={{
                                marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #F4F8FB',
                                display: 'flex', alignItems: 'center', gap: 16
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8FA3B8' }}>
                                    <span style={{ fontSize: 12 }}>❤️</span>
                                    <span style={{ fontSize: 12, fontWeight: 600 }}>{story.likes}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8FA3B8' }}>
                                    <span style={{ fontSize: 12 }}>💬</span>
                                    <span style={{ fontSize: 12, fontWeight: 600 }}>{story.comments}</span>
                                </div>
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} style={{
                                            fontSize: 10,
                                            color: i < Math.floor(story.rating) ? '#F59E0B' : '#D1D5DB'
                                        }}>★</span>
                                    ))}
                                </div>
                            </div>

                            {/* Badge IA pour l'esthétique */}
                            <div style={{
                                position: 'absolute', top: -10, right: 24,
                                background: 'linear-gradient(135deg, #1A2B42, #2E4A6E)',
                                color: 'white', fontSize: 9, fontWeight: 800,
                                padding: '4px 10px', borderRadius: 100,
                                transform: 'rotate(2deg)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }}>
                                ENTRAÎNE L'IA 🤖
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: 40 }}>
                    <button style={{
                        padding: '12px 32px', borderRadius: 100, border: 'none',
                        background: '#1A2B42', color: 'white', fontSize: 14,
                        fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(26,43,66,0.15)'
                    }}>
                        Raconter mon voyage
                    </button>
                </div>
            </div>
        </section>
    );
}
