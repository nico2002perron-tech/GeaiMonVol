import Link from 'next/link';

export default function MapPreview() {
    return (
        <section className="section" style={{ paddingTop: 40, paddingBottom: 40 }}>
            <div className="section-header">
                <div className="tag">
                    <span className="icon icon-sm">
                        <svg><use href="#i-zap" /></svg>
                    </span>{' '}
                    En temps réel
                </div>
                <h2>Carte des deals en direct</h2>
                <p>Notre algorithme surveille les prix 24/7. Explorez les deals sur la carte interactive.</p>
            </div>

            <Link href="/map" style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                    position: 'relative',
                    borderRadius: 20,
                    overflow: 'hidden',
                    border: '1px solid var(--border-light)',
                    boxShadow: 'var(--sh-lg)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    maxWidth: 900,
                    margin: '0 auto',
                }}>
                    {/* Static map background */}
                    <div style={{
                        width: '100%',
                        height: 340,
                        background: 'linear-gradient(135deg, #EDF3FB 0%, #DCE8F8 100%)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {/* World map silhouette SVG */}
                        <svg viewBox="0 0 800 400" style={{ width: '90%', height: '80%', opacity: 0.15 }}>
                            <path d="M80,80 L180,60 L220,80 L240,120 L230,160 L200,180 L180,200 L150,210 L120,190 L90,200 L70,180 L60,140 L70,100 Z" fill="#3c83d5" />
                            <path d="M150,250 L180,240 L210,260 L230,300 L220,350 L200,380 L170,400 L150,380 L140,340 L130,300 L140,270 Z" fill="#3c83d5" />
                            <path d="M380,70 L420,60 L460,70 L470,90 L460,110 L440,120 L420,130 L400,120 L380,110 L370,90 Z" fill="#3c83d5" />
                            <path d="M380,140 L420,130 L460,140 L480,180 L490,220 L480,270 L460,310 L430,330 L400,320 L380,290 L370,250 L360,200 L370,170 Z" fill="#3c83d5" />
                            <path d="M470,60 L550,50 L620,60 L680,80 L700,110 L690,140 L660,160 L620,170 L580,160 L540,140 L500,120 L480,100 L470,80 Z" fill="#3c83d5" />
                            <path d="M640,300 L700,290 L740,300 L750,330 L730,360 L690,370 L650,360 L630,340 L630,320 Z" fill="#3c83d5" />
                        </svg>

                        {/* Fake pins */}
                        {[
                            { left: '22%', top: '28%', label: '-77%', hot: true },
                            { left: '52%', top: '30%', label: '-57%', hot: true },
                            { left: '48%', top: '42%', label: '-53%', hot: false },
                            { left: '78%', top: '35%', label: '-50%', hot: false },
                            { left: '18%', top: '50%', label: '-63%', hot: true },
                            { left: '72%', top: '50%', label: '-59%', hot: false },
                        ].map((pin, i) => (
                            <div key={i} style={{
                                position: 'absolute',
                                left: pin.left,
                                top: pin.top,
                                padding: '4px 10px',
                                borderRadius: 100,
                                background: 'white',
                                border: pin.hot ? '1.5px solid #E8466A' : '1.5px solid #2E7DDB',
                                fontSize: 12,
                                fontWeight: 700,
                                color: pin.hot ? '#E8466A' : '#2E7DDB',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                animation: `pinFloat 3s ease-in-out infinite ${i * 0.5}s`,
                                whiteSpace: 'nowrap',
                            }}>
                                {pin.hot && (
                                    <span style={{
                                        display: 'inline-block',
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: '#E8466A',
                                        marginRight: 4,
                                        verticalAlign: 'middle',
                                    }} />
                                )}
                                {pin.label}
                            </div>
                        ))}

                        {/* Overlay gradient */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(180deg, transparent 60%, rgba(246,249,253,0.9) 100%)',
                        }} />
                    </div>

                    {/* Bottom CTA bar */}
                    <div style={{
                        padding: '20px 28px',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <div>
                            <div style={{
                                fontSize: 17,
                                fontWeight: 800,
                                color: 'var(--navy)',
                            }}>
                                10 destinations à prix cassés
                            </div>
                            <div style={{
                                fontSize: 13,
                                color: 'var(--text-3)',
                                marginTop: 2,
                            }}>
                                Depuis Montréal (YUL) · Mis à jour en temps réel
                            </div>
                        </div>
                        <div style={{
                            padding: '10px 24px',
                            background: 'var(--blue)',
                            color: '#fff',
                            borderRadius: 50,
                            fontWeight: 800,
                            fontSize: 14,
                            boxShadow: 'var(--sh-blue)',
                            whiteSpace: 'nowrap',
                        }}>
                            Explorer la carte →
                        </div>
                    </div>
                </div>
            </Link>
        </section>
    );
}
