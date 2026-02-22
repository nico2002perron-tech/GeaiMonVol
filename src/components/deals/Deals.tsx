export default function Deals() {
    return (
        <section className="section" id="deals">
            <div className="section-header">
                <div className="tag orange">
                    <span className="icon icon-sm">
                        <svg>
                            <use href="#i-zap" />
                        </svg>
                    </span>{" "}
                    En ce moment
                </div>
                <h2>Aubaines du moment</h2>
            </div>
            <div className="deals-grid">
                <div className="deal">
                    <div
                        className="deal-img"
                        style={{
                            backgroundImage:
                                "url('https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80')",
                        }}
                    >
                        <div className="deal-badge hot">Expire bientôt</div>
                        <div className="deal-verify">
                            <span className="dot"></span> Vérifié
                        </div>
                    </div>
                    <div className="deal-body">
                        <div className="deal-route">
                            Montréal <span className="arr">→</span> Paris
                        </div>
                        <div className="deal-meta">
                            Mars – Avril 2026 · Aller-retour · Direct
                        </div>
                        <div className="deal-price-row">
                            <div className="deal-price">195$</div>
                            <div className="deal-old">850$</div>
                            <div className="deal-save">-77%</div>
                        </div>
                        <div className="deal-extras">
                            <div className="deal-hotel-mini">
                                <div
                                    className="thumb"
                                    style={{
                                        backgroundImage:
                                            "url('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=100&q=80')",
                                    }}
                                ></div>
                                <div className="info">
                                    <strong>Hôtel Le Marais</strong> <span>· 7 nuits</span>
                                </div>
                                <div className="rate">68$/n</div>
                            </div>
                        </div>
                        <div className="deal-acts">
                            <span className="act-tag">Louvre</span>
                            <span className="act-tag">Tour Eiffel</span>
                            <span className="act-tag">Food tour</span>
                        </div>
                    </div>
                </div>
                {/* Repeating similar structure for other deals, keeping it concise for now */}
                <div className="deal">
                    <div
                        className="deal-img"
                        style={{
                            backgroundImage:
                                "url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80')",
                        }}
                    >
                        <div className="deal-badge pop">Populaire</div>
                        <div className="deal-verify">
                            <span className="dot"></span> Vérifié
                        </div>
                    </div>
                    <div className="deal-body">
                        <div className="deal-route">
                            Montréal <span className="arr">→</span> Bangkok
                        </div>
                        <div className="deal-meta">
                            Avril – Mai 2026 · Aller-retour · 1 escale
                        </div>
                        <div className="deal-price-row">
                            <div className="deal-price">659$</div>
                            <div className="deal-old">1 600$</div>
                            <div className="deal-save">-59%</div>
                        </div>
                        <div className="deal-extras">
                            <div className="deal-hotel-mini">
                                <div
                                    className="thumb"
                                    style={{
                                        backgroundImage:
                                            "url('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=100&q=80')",
                                    }}
                                ></div>
                                <div className="info">
                                    <strong>Riverside Boutique</strong> <span>· 10 nuits</span>
                                </div>
                                <div className="rate">22$/n</div>
                            </div>
                        </div>
                        <div className="deal-acts">
                            <span className="act-tag">Temples</span>
                            <span className="act-tag">Street food</span>
                            <span className="act-tag">Îles</span>
                        </div>
                    </div>
                </div>

                {/* Deal 3 */}
                <div className="deal">
                    <div
                        className="deal-img"
                        style={{
                            backgroundImage:
                                "url('https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=600&q=80')",
                        }}
                    >
                        <div className="deal-badge hot">Expire bientôt</div>
                        <div className="deal-verify">
                            <span className="dot"></span> Vérifié
                        </div>
                    </div>
                    <div className="deal-body">
                        <div className="deal-route">
                            Montréal <span className="arr">→</span> Cancún
                        </div>
                        <div className="deal-meta">
                            Fév – Mars 2026 · Aller-retour · Direct
                        </div>
                        <div className="deal-price-row">
                            <div className="deal-price">220$</div>
                            <div className="deal-old">600$</div>
                            <div className="deal-save">-63%</div>
                        </div>
                        <div className="deal-extras">
                            <div className="deal-hotel-mini">
                                <div
                                    className="thumb"
                                    style={{
                                        backgroundImage:
                                            "url('https://images.unsplash.com/photo-1582719508461-905c673771fd?w=100&q=80')",
                                    }}
                                ></div>
                                <div className="info">
                                    <strong>Playa del Sol</strong> <span>· 7 nuits</span>
                                </div>
                                <div className="rate">45$/n</div>
                            </div>
                        </div>
                        <div className="deal-acts">
                            <span className="act-tag">Cenotes</span>
                            <span className="act-tag">Chichén Itzá</span>
                            <span className="act-tag">Plongée</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
