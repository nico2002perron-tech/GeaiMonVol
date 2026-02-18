'use client';

export default function TransparenceSection() {
    return (
        <section id="transparence" style={{
            padding: '80px 24px',
            background: '#F4F8FB',
        }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                <div style={{
                    background: 'white',
                    borderRadius: 30,
                    padding: '40px 60px',
                    border: '1px solid rgba(26,43,66,0.06)',
                    boxShadow: '0 10px 40px rgba(26,43,66,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 40
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '6px 16px', borderRadius: 100,
                            background: 'rgba(22,163,74,0.08)', color: '#16A34A',
                            fontSize: 12, fontWeight: 700, marginBottom: 16
                        }}>
                            <span style={{ fontSize: 16 }}>🛡️</span> Engagement Transparence
                        </div>
                        <h2 style={{
                            fontFamily: "'Fredoka', sans-serif", fontSize: 28,
                            fontWeight: 700, color: '#1A2B42', margin: 0
                        }}>
                            Vos données sont en sécurité
                        </h2>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: 30
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ fontSize: 24 }}>🚫</div>
                            <h3 style={{
                                fontFamily: "'Fredoka', sans-serif", fontSize: 18,
                                fontWeight: 600, color: '#1A2B42', margin: 0
                            }}>
                                Pas de vente de données
                            </h3>
                            <p style={{
                                fontSize: 14, color: '#5A7089', lineHeight: 1.6,
                                margin: 0, fontFamily: "'Outfit', sans-serif"
                            }}>
                                Nous ne vendons jamais vos données personnelles ou vos habitudes de recherche à des tiers. Jamais.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ fontSize: 24 }}>⚡</div>
                            <h3 style={{
                                fontFamily: "'Fredoka', sans-serif", fontSize: 18,
                                fontWeight: 600, color: '#1A2B42', margin: 0
                            }}>
                                IA Éthique
                            </h3>
                            <p style={{
                                fontSize: 14, color: '#5A7089', lineHeight: 1.6,
                                margin: 0, fontFamily: "'Outfit', sans-serif"
                            }}>
                                Nos algorithmes d'IA sont conçus pour une seule chose : vous trouver le prix le plus bas, sans biais commercial.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ fontSize: 24 }}>🔒</div>
                            <h3 style={{
                                fontFamily: "'Fredoka', sans-serif", fontSize: 18,
                                fontWeight: 600, color: '#1A2B42', margin: 0
                            }}>
                                Confidentialité Totale
                            </h3>
                            <p style={{
                                fontSize: 14, color: '#5A7089', lineHeight: 1.6,
                                margin: 0, fontFamily: "'Outfit', sans-serif"
                            }}>
                                Vos alertes et votre liste de surveillance sont privées et protégées par des standards de sécurité bancaires.
                            </p>
                        </div>
                    </div>

                    <div style={{
                        padding: '24px',
                        background: 'rgba(46,125,219,0.03)',
                        borderRadius: 20,
                        border: '1px dashed rgba(46,125,219,0.2)',
                        textAlign: 'center'
                    }}>
                        <p style={{
                            fontSize: 13, color: '#2E7DDB', fontWeight: 600,
                            margin: 0, fontFamily: "'Outfit', sans-serif"
                        }}>
                            Besoin d'en savoir plus ? <a href="/transparence" style={{ color: '#2E7DDB', textDecoration: 'underline' }}>Consultez notre manifeste complet →</a>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
