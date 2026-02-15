import Image from "next/image";

export default function HowItWorks() {
    return (
        <section className="section" id="how">
            <div className="section-header">
                <div className="tag">Comment ça marche</div>
                <h2>Aussi simple que 1-2-3</h2>
            </div>
            <div className="steps-wrap">
                <div className="steps-row">
                    {/* STEP 1 */}
                    <div className="stp">
                        <div className="stp-num">1</div>
                        <div className="stp-img has-img">
                            <Image
                                src="/Gemini_Generated_Image_2x9w8c2x9w8c2x9w.png"
                                alt="On scanne tout"
                                width={200}
                                height={200}
                            />
                        </div>
                        <h3>On scanne tout</h3>
                        <p>
                            Notre algo surveille{" "}
                            <strong>les prix de milliers de vols et hôtels</strong> en temps
                            réel.
                        </p>
                    </div>

                    {/* ANIMATED ARROW 1→2 */}
                    <div className="stp-arrow">
                        <svg viewBox="0 0 56 28" overflow="visible">
                            <line className="a-line" x1="4" y1="14" x2="42" y2="14" />
                            <polygon className="a-head" points="40,8 50,14 40,20" />
                            <circle className="a-dot" cy="14" />
                            <circle className="a-dot2" cy="14" />
                        </svg>
                    </div>

                    {/* STEP 2 */}
                    <div className="stp">
                        <div className="stp-num">2</div>
                        <div className="stp-img">
                            <div className="ph">
                                📷 Votre image
                                <br />
                                Étape 2
                            </div>
                        </div>
                        <h3>On vous alerte</h3>
                        <p>
                            Dès qu'un prix chute, on vous envoie{" "}
                            <strong>vol + hôtel + activités</strong>.
                        </p>
                    </div>

                    {/* ANIMATED ARROW 2→3 */}
                    <div className="stp-arrow">
                        <svg viewBox="0 0 56 28" overflow="visible">
                            <line
                                className="a-line"
                                x1="4"
                                y1="14"
                                x2="42"
                                y2="14"
                                style={{ animationDelay: ".45s" }}
                            />
                            <polygon className="a-head" points="40,8 50,14 40,20" />
                            <circle
                                className="a-dot"
                                cy="14"
                                style={{ animationDelay: ".45s" }}
                            />
                            <circle
                                className="a-dot2"
                                cy="14"
                                style={{ animationDelay: ".6s" }}
                            />
                        </svg>
                    </div>

                    {/* STEP 3 */}
                    <div className="stp">
                        <div className="stp-num">3</div>
                        <div className="stp-img">
                            <div className="ph">
                                📷 Votre image
                                <br />
                                Étape 3
                            </div>
                        </div>
                        <h3>Vous partez!</h3>
                        <p>
                            Réservez en un clic, partez vivre votre{" "}
                            <strong>voyage de rêve pour moins cher</strong>.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
