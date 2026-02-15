export default function Pricing() {
    return (
        <section className="section" id="pricing">
            <div className="section-header">
                <div className="tag">Forfaits</div>
                <h2>Choisissez votre plan</h2>
            </div>
            <div className="plans">
                <div className="plan">
                    <div className="plan-name">Découverte</div>
                    <div className="plan-price">
                        0$<span>/mois</span>
                    </div>
                    <div className="plan-desc">Pour explorer la plateforme</div>
                    <ul className="plan-list">
                        <li>
                            <span className="ck icon icon-sm">
                                <svg>
                                    <use href="#i-check" />
                                </svg>
                            </span>{" "}
                            30% des offres
                        </li>
                        <li>
                            <span className="ck icon icon-sm">
                                <svg>
                                    <use href="#i-check" />
                                </svg>
                            </span>{" "}
                            Alertes courriel
                        </li>
                        <li>
                            <span className="ck icon icon-sm">
                                <svg>
                                    <use href="#i-check" />
                                </svg>
                            </span>{" "}
                            Hôtels de base
                        </li>
                        <li>
                            <span className="ck icon icon-sm">
                                <svg>
                                    <use href="#i-check" />
                                </svg>
                            </span>{" "}
                            1 aéroport
                        </li>
                    </ul>
                    <a href="#signup" className="plan-btn outline">
                        Commencer
                    </a>
                </div>
                <div className="plan pro">
                    <div className="plan-name">Premium</div>
                    <div className="plan-price">
                        5$<span>/mois</span>
                    </div>
                    <div className="plan-desc">Tout, sans compromis</div>
                    <ul className="plan-list">
                        <li>
                            <span className="ck icon icon-sm">
                                <svg>
                                    <use href="#i-check" />
                                </svg>
                            </span>{" "}
                            100% des offres
                        </li>
                        <li>
                            <span className="ck icon icon-sm">
                                <svg>
                                    <use href="#i-check" />
                                </svg>
                            </span>{" "}
                            Courriel + SMS
                        </li>
                        <li>
                            <span className="ck icon icon-sm">
                                <svg>
                                    <use href="#i-check" />
                                </svg>
                            </span>{" "}
                            Vol + Hôtel + Activités
                        </li>
                        <li>
                            <span className="ck icon icon-sm">
                                <svg>
                                    <use href="#i-check" />
                                </svg>
                            </span>{" "}
                            Tous les aéroports
                        </li>
                        <li>
                            <span className="ck icon icon-sm">
                                <svg>
                                    <use href="#i-check" />
                                </svg>
                            </span>{" "}
                            Erreurs de prix en 1er
                        </li>
                        <li>
                            <span className="ck icon icon-sm">
                                <svg>
                                    <use href="#i-check" />
                                </svg>
                            </span>{" "}
                            Garanti 30 jours
                        </li>
                    </ul>
                    <a href="#signup" className="plan-btn fill">
                        Passer Premium
                    </a>
                </div>
            </div>
        </section>
    );
}
