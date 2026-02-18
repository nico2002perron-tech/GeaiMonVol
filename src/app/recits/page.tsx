'use client';
import { useState } from 'react';
import Link from 'next/link';

const RECITS = [
    {
        id: 1,
        user: "Sophie T.",
        city: "Paris",
        price: 342,
        content: "Grâce à l'alerte GeaiMonVol, j'ai pu réserver un vol direct pour Paris pile au moment où le prix a chuté. Une économie de 400$ ! J'ai pu m'offrir deux dîners gastronomiques supplémentaires.",
        img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
        date: "Il y a 2 jours",
        tags: ["Europe", "Paris", "Prix Record"]
    },
    {
        id: 2,
        user: "Marc-André L.",
        city: "Tokyo",
        price: 789,
        content: "Je surveillais le Japon depuis des mois. Le radar m'a prévenu d'un 'Prix record'. J'ai sauté sur l'occasion, un voyage de rêve enfin possible. L'IA m'a même suggéré les meilleures dates pour éviter la foule.",
        img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
        date: "Il y a 1 semaine",
        tags: ["Asie", "Tokyo", "Alerte Perso"]
    },
    {
        id: 3,
        user: "Julie R.",
        city: "Lisbonne",
        price: 315,
        content: "Incroyable interface. On voit tout de suite où sont les aubaines. Lisbonne à ce prix là, c'était immanquable ! Merci GeaiMonVol.",
        img: "https://images.unsplash.com/photo-1585211777166-73269c464104?w=800",
        date: "Il y a 3 jours",
        tags: ["Europe", "Portugal", "Aubaine"]
    }
];

export default function RecitsPage() {
    const [selectedTag, setSelectedTag] = useState<string>('Tous');
    const tags = ['Tous', 'Europe', 'Asie', 'Amérique', 'Prix Record', 'Alerte Perso'];

    const filteredRecits = selectedTag === 'Tous'
        ? RECITS
        : RECITS.filter(r => r.tags.includes(selectedTag));

    return (
        <div style={{ background: '#F4F8FB', minHeight: '100vh', paddingBottom: 100 }}>
            {/* Header / Nav */}
            <div style={{
                background: 'white',
                padding: '20px 40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(26,43,66,0.06)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <Link href="/" style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    textDecoration: 'none', color: '#1A2B42',
                    fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 700
                }}>
                    <div style={{
                        width: 32, height: 32, background: '#2E7DDB',
                        borderRadius: 10, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'white'
                    }}>🐦</div>
                    GeaiMonVol
                </Link>
                <Link href="/" style={{
                    fontSize: 14, fontWeight: 600, color: '#5A7089',
                    textDecoration: 'none', fontFamily: "'Outfit', sans-serif"
                }}>
                    ← Retour à la carte
                </Link>
            </div>

            {/* Hero Section */}
            <div style={{
                padding: '60px 24px',
                textAlign: 'center',
                maxWidth: 800,
                margin: '0 auto'
            }}>
                <h1 style={{
                    fontFamily: "'Fredoka', sans-serif", fontSize: 42,
                    fontWeight: 700, color: '#1A2B42', marginBottom: 20
                }}>
                    Histoires de <span style={{ color: '#2E7DDB' }}>succès</span>
                </h1>
                <p style={{
                    fontSize: 18, color: '#5A7089', lineHeight: 1.6,
                    fontFamily: "'Outfit', sans-serif"
                }}>
                    Comment GeaiMonVol aide des milliers de voyageurs à voir le monde
                    sans vider leur compte de banque.
                </p>
            </div>

            {/* Main Content */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                {/* Filters */}
                <div style={{
                    display: 'flex', gap: 10, overflowX: 'auto',
                    paddingBottom: 30, scrollbarWidth: 'none'
                }}>
                    {tags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            style={{
                                padding: '10px 24px',
                                borderRadius: 100,
                                border: 'none',
                                background: selectedTag === tag ? '#2E7DDB' : 'white',
                                color: selectedTag === tag ? 'white' : '#5A7089',
                                fontWeight: 700,
                                fontSize: 13,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* Recits Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: 30
                }}>
                    {filteredRecits.map(recit => (
                        <div key={recit.id} style={{
                            background: 'white',
                            borderRadius: 24,
                            overflow: 'hidden',
                            boxShadow: '0 10px 30px rgba(26,43,66,0.04)',
                            border: '1px solid rgba(26,43,66,0.06)'
                        }}>
                            <div style={{ height: 240, position: 'relative' }}>
                                <img src={recit.img} alt={recit.city} style={{
                                    width: '100%', height: '100%', objectFit: 'cover'
                                }} />
                                <div style={{
                                    position: 'absolute', bottom: 16, left: 16,
                                    background: 'rgba(255,255,255,0.95)',
                                    padding: '6px 16px', borderRadius: 100,
                                    fontSize: 14, fontWeight: 700, color: '#2E7DDB',
                                    backdropFilter: 'blur(4px)'
                                }}>
                                    {recit.city} — {recit.price}$
                                </div>
                            </div>
                            <div style={{ padding: 24 }}>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                    {recit.tags.map(t => (
                                        <span key={t} style={{
                                            fontSize: 10, fontWeight: 800, color: '#8FA3B8',
                                            textTransform: 'uppercase', letterSpacing: 0.5
                                        }}>#{t}</span>
                                    ))}
                                </div>
                                <p style={{
                                    fontSize: 15, color: '#1A2B42', lineHeight: 1.7,
                                    fontFamily: "'Outfit', sans-serif", marginBottom: 20
                                }}>
                                    "{recit.content}"
                                </p>
                                <div style={{
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderTop: '1px solid rgba(26,43,66,0.04)',
                                    paddingTop: 16
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '50%',
                                            background: '#F4F8FB', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            fontSize: 14, fontWeight: 700, color: '#2E7DDB'
                                        }}>
                                            {recit.user.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2B42' }}>
                                                {recit.user}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#8FA3B8' }}>{recit.date}</div>
                                        </div>
                                    </div>
                                    <button style={{
                                        background: 'none', border: 'none', color: '#2E7DDB',
                                        fontSize: 20, cursor: 'pointer'
                                    }}>💬</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Transparency Summary - Nouveau en V2 */}
                <div style={{
                    marginTop: 80,
                    padding: 40,
                    background: 'linear-gradient(135deg, #1A2B42 0%, #2E4A6E 100%)',
                    borderRadius: 30,
                    color: 'white',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 40,
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{
                            fontFamily: "'Fredoka', sans-serif", fontSize: 24,
                            fontWeight: 700, marginBottom: 16
                        }}>
                            Transparence GeaiMonVol 🐦
                        </h2>
                        <p style={{
                            fontSize: 14, color: 'rgba(255,255,255,0.7)',
                            lineHeight: 1.6, marginBottom: 20
                        }}>
                            Tous les récits sont vérifiés par notre intelligence artificielle.
                            Nous garantissons que ces prix étaient réels et disponibles
                            au moment de la publication.
                        </p>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 20, fontWeight: 800 }}>98%</div>
                                <div style={{ fontSize: 10, opacity: 0.6 }}>PRÉCISION IA</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 20, fontWeight: 800 }}>8.5k</div>
                                <div style={{ fontSize: 10, opacity: 0.6 }}>MEMBRES</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 20, fontWeight: 800 }}>1.2M$</div>
                                <div style={{ fontSize: 10, opacity: 0.6 }}>ÉCONOMISÉS</div>
                            </div>
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: 30,
                        borderRadius: 20,
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                            Partagez votre succès
                        </h3>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
                            Réservez un vol via GeaiMonVol et partagez votre récit pour
                            gagner 3 mois de Premium gratuit.
                        </p>
                        <button style={{
                            width: '100%', padding: '12px', borderRadius: 100,
                            border: 'none', background: '#2E7DDB', color: 'white',
                            fontWeight: 700, fontSize: 13, cursor: 'pointer'
                        }}>
                            Soumettre mon récit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
