import Image from "next/image";

interface HowItWorksProps {
    onClose?: () => void;
}

export default function HowItWorks({ onClose }: HowItWorksProps) {
    return (
        <section className="section" id="how">
            <div className="section-header">
                <div className="tag">Comment ça marche</div>
                <h2>Aussi simple que 1-2-3</h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: 20,
                            right: 20,
                            background: 'none',
                            border: 'none',
                            fontSize: 24,
                            cursor: 'pointer',
                            color: 'var(--text-2)'
                        }}
                    >
                        ×
                    </button>
                )}
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
                        <div className="stp-img has-img" style={{
                            background: 'linear-gradient(135deg, #EDF3FB, #DCE8F8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                                <circle cx="60" cy="60" r="50" fill="rgba(60,131,213,0.08)" />
                                <circle cx="60" cy="60" r="35" fill="rgba(60,131,213,0.08)" />
                                {/* Bell icon */}
                                <path d="M60 35C50 35 42 43 42 53V65L38 72H82L78 65V53C78 43 70 35 60 35Z"
                                    stroke="#3c83d5" strokeWidth="3" fill="none" strokeLinecap="round" />
                                <path d="M53 72V75C53 79 56 82 60 82C64 82 67 79 67 75V72"
                                    stroke="#3c83d5" strokeWidth="3" fill="none" strokeLinecap="round" />
                                {/* Notification dot */}
                                <circle cx="73" cy="42" r="8" fill="#ea6f22" />
                                <text x="73" y="46" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">!</text>
                            </svg>
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
                        <div className="stp-img has-img" style={{
                            background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                                <circle cx="60" cy="60" r="50" fill="rgba(22,163,74,0.06)" />
                                <circle cx="60" cy="60" r="35" fill="rgba(22,163,74,0.06)" />
                                {/* Plane icon */}
                                <path d="M75 50L45 62L55 65L58 75L75 50Z"
                                    stroke="#16a34a" strokeWidth="2.5" fill="rgba(22,163,74,0.1)" strokeLinejoin="round" />
                                {/* Takeoff arc */}
                                <path d="M30 75C35 60 50 48 75 50"
                                    stroke="#16a34a" strokeWidth="2" fill="none" strokeDasharray="4 4" strokeLinecap="round" />
                                {/* Checkmark */}
                                <circle cx="82" cy="40" r="10" fill="#16a34a" />
                                <path d="M77 40L80 43L87 36" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
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
