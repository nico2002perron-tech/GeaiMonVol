'use client';
import { useState } from 'react';

interface HowItWorksModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
    const [activeStep, setActiveStep] = useState(0);

    if (!isOpen) return null;

    const steps = [
        { title: "Explorez la carte", desc: "Survolez les continents pour découvrir les meilleurs deals en temps réel.", label: "Étape 1" },
        { title: "Réservez votre vol", desc: "Sélectionnez un deal, choisissez vos dates et réservez en quelques clics.", label: "Étape 2" },
        { title: "Partagez votre expérience", desc: "Au retour, Geai vous pose quelques questions pour aider les futurs voyageurs.", label: "Étape 3" },
        { title: "Obtenez votre guide IA", desc: "Des guides personnalisés, créés à partir de vraies expériences de voyageurs.", label: "Étape 4" }
    ];

    return (
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`} id="modalOverlay">
            <div className="modal" id="modal">
                <button className="modal-close" onClick={onClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
                <div className="modal-header">
                    <div className="modal-title">Comment ça marche?</div>
                    <div className="modal-subtitle">De la découverte au voyage, en 4 étapes simples.</div>
                </div>

                {/* Timeline */}
                <div className="timeline">
                    <div className="timeline-track">
                        <div className="timeline-fill" style={{ width: `${(activeStep / 3) * 100}%` }}></div>
                    </div>
                    <div className="timeline-dots">
                        {[0, 1, 2, 3].map((step) => (
                            <button
                                key={step}
                                className={`tl-dot ${step <= activeStep ? (step === activeStep ? 'active' : 'done') : ''}`}
                                onClick={() => setActiveStep(step)}
                            >
                                <span className="tl-num">{step + 1}</span>
                                <span className="tl-spark"></span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="steps-viewport">
                    <div className="steps-track">
                        {steps.map((s, i) => (
                            <div
                                key={i}
                                className={`step-card ${i === activeStep ? 'active' : ''}`}
                                onClick={() => setActiveStep(i)}
                            >
                                <div className="step-img-wrap">
                                    {/* Placeholder SVG/Image */}
                                    <div style={{ width: '100%', height: '140px', background: '#f4f8fb' }}></div>
                                </div>
                                <div className="step-body">
                                    <div className="step-label">{s.label}</div>
                                    <div className="step-title">{s.title}</div>
                                    <div className="step-desc">{s.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="modal-cta" onClick={onClose}>Explorer les deals</button>
                </div>
            </div>
        </div>
    );
}
