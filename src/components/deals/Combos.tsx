export default function Combos() {
    return (
        <section className="section">
            <div className="section-header">
                <div className="tag">
                    <span className="icon icon-sm">
                        <svg>
                            <use href="#i-sparkles" />
                        </svg>
                    </span>{" "}
                    Forfaits
                </div>
                <h2>Tout-inclus, un seul prix</h2>
            </div>
            <div className="combos">
                <div className="combo">
                    <div
                        className="combo-hero-img"
                        style={{
                            backgroundImage:
                                "url('https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&q=80')",
                        }}
                    ></div>
                    <div className="combo-body">
                        <div className="combo-dest">Paris</div>
                        <div className="combo-info">7 nuits · Mars 2026</div>
                        <div className="combo-row">
                            <span className="l">Vol aller-retour</span>
                            <span className="v">195$</span>
                        </div>
                        <div className="combo-row">
                            <span className="l">Hôtel Le Marais (4★)</span>
                            <span className="v">476$</span>
                        </div>
                        <div className="combo-row">
                            <span className="l">3 activités</span>
                            <span className="v">122$</span>
                        </div>
                        <div className="combo-line"></div>
                        <div className="combo-total">
                            <span className="l">Total</span>
                            <span className="v">793$</span>
                        </div>
                    </div>
                </div>
                <div className="combo">
                    <div
                        className="combo-hero-img"
                        style={{
                            backgroundImage:
                                "url('https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=500&q=80')",
                        }}
                    ></div>
                    <div className="combo-body">
                        <div className="combo-dest">Cancún</div>
                        <div className="combo-info">7 nuits · Février 2026</div>
                        <div className="combo-row">
                            <span className="l">Vol aller-retour</span>
                            <span className="v">220$</span>
                        </div>
                        <div className="combo-row">
                            <span className="l">Playa del Sol (4★)</span>
                            <span className="v">315$</span>
                        </div>
                        <div className="combo-row">
                            <span className="l">3 activités</span>
                            <span className="v">160$</span>
                        </div>
                        <div className="combo-line"></div>
                        <div className="combo-total">
                            <span className="l">Total</span>
                            <span className="v">695$</span>
                        </div>
                    </div>
                </div>
                <div className="combo">
                    <div
                        className="combo-hero-img"
                        style={{
                            backgroundImage:
                                "url('https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=500&q=80')",
                        }}
                    ></div>
                    <div className="combo-body">
                        <div className="combo-dest">Tokyo</div>
                        <div className="combo-info">10 nuits · Mai 2026</div>
                        <div className="combo-row">
                            <span className="l">Vol aller-retour</span>
                            <span className="v">712$</span>
                        </div>
                        <div className="combo-row">
                            <span className="l">Shinjuku Inn (4.6★)</span>
                            <span className="v">480$</span>
                        </div>
                        <div className="combo-row">
                            <span className="l">3 activités</span>
                            <span className="v">39$</span>
                        </div>
                        <div className="combo-line"></div>
                        <div className="combo-total">
                            <span className="l">Total</span>
                            <span className="v">1 231$</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
