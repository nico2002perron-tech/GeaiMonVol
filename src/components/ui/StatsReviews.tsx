export default function StatsReviews() {
    return (
        <section className="section">
            <div className="stats-bar">
                <div className="stat">
                    <div className="stat-n">850K+</div>
                    <div className="stat-l">Voyageurs inscrits</div>
                </div>
                <div className="stat">
                    <div className="stat-n">90%</div>
                    <div className="stat-l">D'économie max</div>
                </div>
                <div className="stat">
                    <div className="stat-n">120+</div>
                    <div className="stat-l">Sources analysées</div>
                </div>
                <div className="stat">
                    <div className="stat-n">15 min</div>
                    <div className="stat-l">Vérification</div>
                </div>
            </div>
            <div className="section-header">
                <div className="tag">
                    <span className="icon icon-sm">
                        <svg>
                            <use href="#i-heart" />
                        </svg>
                    </span>{" "}
                    Avis
                </div>
                <h2>Nos voyageurs parlent</h2>
            </div>
            <div className="reviews">
                <div className="rev">
                    <div className="rev-stars">
                        <svg viewBox="0 0 24 24">
                            <use href="#i-star" />
                        </svg>
                        <svg viewBox="0 0 24 24">
                            <use href="#i-star" />
                        </svg>
                        <svg viewBox="0 0 24 24">
                            <use href="#i-star" />
                        </svg>
                        <svg viewBox="0 0 24 24">
                            <use href="#i-star" />
                        </svg>
                        <svg viewBox="0 0 24 24">
                            <use href="#i-star" />
                        </svg>
                    </div>
                    <p className="rev-text">
                        "Mon voyage à Paris a coûté moins cher que le billet seul au prix
                        normal. Incroyable."
                    </p>
                    <div className="rev-who">
                        <div className="rev-av">ML</div>
                        <div>
                            <div className="rev-name">Marie-Lou P.</div>
                            <div className="rev-loc">Montréal</div>
                        </div>
                    </div>
                </div>
                <div className="rev">
                    <div className="rev-stars">
                        <svg viewBox="0 0 24 24">
                            <use href="#i-star" />
                        </svg>
                        <svg viewBox="0 0 24 24">
                            <use href="#i-star" />
                        </svg>
                        <svg viewBox="0 0 24 24">
                            <use href="#i-star" />
                        </svg>
                        <svg viewBox="0 0 24 24">
                            <use href="#i-star" />
                        </svg>
                        <svg viewBox="0 0 24 24">
                            <use href="#i-star" />
                        </svg>
                    </div>
                    <p className="rev-text">
                        "Les suggestions d'activités m'ont fait découvrir des endroits que
                        j'aurais jamais trouvés."
                    </p>
                    <div className="rev-who">
                        <div className="rev-av">JF</div>
                        <div>
                            <div className="rev-name">Jean-François D.</div>
                            <div className="rev-loc">Québec</div>
                        </div>
                    </div>
                </div>
                <div className="rev">
                    <div className="rev-stars">
                        <svg viewBox="0 0 24 24">
                            <use href="#i-star" />
                        </svg>
                        <svg viewBox="0 0 24 24">
                            <use href="#i-star" />
                        </svg>
                        <svg viewBox="0 0 24 24">
                            <use href="#i-star" />
                        </svg>
                        <svg viewBox="0 0 24 24">
                            <use href="#i-star" />
                        </svg>
                        <svg viewBox="0 0 24 24">
                            <use href="#i-star" />
                        </svg>
                    </div>
                    <p className="rev-text">
                        "10 nuits à Bangkok tout inclus pour 900$. Mes amis m'ont pas cru!"
                    </p>
                    <div className="rev-who">
                        <div className="rev-av">SC</div>
                        <div>
                            <div className="rev-name">Sarah C.</div>
                            <div className="rev-loc">Laval</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
