'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import './pricing.css';

export default function PricingPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <>
            <Navbar />
            <div className="pricing-page">
                {/* HERO */}
                <section className="hero">
                    <div className="mascot-ph">Mascotte<br />ici</div>
                    <div className="hero-badge">Nouveau — Packs voyage tout-inclus</div>
                    <h1>Ton voyage de rêve,<br /><em>organisé par l'IA</em></h1>
                    <p>Pas juste des deals. Un assistant personnel qui surveille les prix, crée ton pack Vol + Hôtel + Activités, et te dit quand réserver.</p>
                </section>

                {/* PRICING */}
                <section className="pricing" id="pricing">
                    {/* GRATUIT */}
                    <div className="pcard">
                        <div className="p-tier">Gratuit</div>
                        <div className="p-name">Explorateur</div>
                        <div className="p-desc">Découvre les deals sur la carte et explore les destinations.</div>
                        <div className="p-price"><span className="p-dollar">0 $</span></div>
                        <div className="p-note">Pour toujours</div>
                        <ul className="p-list">
                            <li><span className="ck y">&#10003;</span>Carte interactive des deals</li>
                            <li><span className="ck y">&#10003;</span>Consultation des prix en temps réel</li>
                            <li><span className="ck y">&#10003;</span>Alertes email générales</li>
                            <li><span className="ck n">&times;</span>Alertes personnalisées</li>
                            <li><span className="ck n">&times;</span>Packs voyage IA</li>
                            <li><span className="ck n">&times;</span>"Meilleur moment pour acheter"</li>
                            <li><span className="ck n">&times;</span>Guide IA gratuit</li>
                        </ul>
                        <button className="p-cta out">Commencer gratuitement</button>
                    </div>

                    {/* PREMIUM */}
                    <div className="pcard pop">
                        <div className="p-tier">Premium</div>
                        <div className="p-name">Voyageur</div>
                        <div className="p-desc">Ton assistant voyage. Prix surveillés, packs prêts, guides offerts.</div>
                        <div className="p-price"><span className="p-dollar">5 $</span><span className="p-period">/ mois</span></div>
                        <div className="p-note">Annulation à tout moment</div>
                        <ul className="p-list">
                            <li><span className="ck y">&#10003;</span>Tout le plan Gratuit</li>
                            <li><span className="ck y">&#10003;</span><strong>Alertes personnalisées</strong> — prix sous ton budget</li>
                            <li><span className="ck y">&#10003;</span><strong>"Meilleur moment pour acheter"</strong></li>
                            <li><span className="ck y">&#10003;</span><strong>Watchlist illimitée</strong></li>
                            <li><span className="ck y">&#10003;</span><strong>Packs Vol + Hôtel + Guide</strong></li>
                            <li><span className="ck y">&#10003;</span><strong>Notification drop de prix</strong></li>
                            <li><span className="ck y">&#10003;</span><span className="bonus">Guide IA gratuit à chaque réservation</span></li>
                        </ul>
                        <button className="p-cta pri">S'abonner à 5 $/mois</button>
                    </div>

                    {/* GUIDE */}
                    <div className="pcard">
                        <div className="p-tier">À la carte</div>
                        <div className="p-name">Guide IA</div>
                        <div className="p-desc">Plan jour par jour personnalisé, sans abonnement.</div>
                        <div className="p-price"><span className="p-dollar">10 $</span><span className="p-period">/ guide</span></div>
                        <div className="p-note">Achat unique par destination</div>
                        <ul className="p-list">
                            <li><span className="ck y">&#10003;</span>Itinéraire jour par jour optimisé</li>
                            <li><span className="ck y">&#10003;</span>Activités incontournables classées</li>
                            <li><span className="ck y">&#10003;</span>Réservations guidées (quoi, où, quand)</li>
                            <li><span className="ck y">&#10003;</span>Conseils de vrais voyageurs</li>
                            <li><span className="ck y">&#10003;</span>Adapté à vos préférences</li>
                            <li><span className="ck n">&times;</span>Alertes personnalisées</li>
                            <li><span className="ck n">&times;</span>Packs voyage</li>
                        </ul>
                        <button className="p-cta gld">Acheter un guide — 10 $</button>
                    </div>
                </section>

                {/* COMPARISON TABLE */}
                <section className="cmp">
                    <h2>Comparaison détaillée</h2>
                    <table>
                        <thead><tr><th></th><th>Gratuit</th><th>Premium 5$/m</th><th>Guide 10$</th></tr></thead>
                        <tbody>
                            <tr><td>Carte des deals</td><td className="ty">&#10003;</td><td className="ty">&#10003;</td><td className="ty">&#10003;</td></tr>
                            <tr><td>Alertes email générales</td><td className="ty">&#10003;</td><td className="ty">&#10003;</td><td className="tn">&mdash;</td></tr>
                            <tr><td>Alertes personnalisées (budget)</td><td className="tn">&mdash;</td><td className="ty">&#10003;</td><td className="tn">&mdash;</td></tr>
                            <tr><td>Watchlist de destinations</td><td className="tn">&mdash;</td><td className="ta">Illimitée</td><td className="tn">&mdash;</td></tr>
                            <tr><td>"Meilleur moment pour acheter"</td><td className="tn">&mdash;</td><td className="ty">&#10003;</td><td className="tn">&mdash;</td></tr>
                            <tr><td>Notification drop de prix</td><td className="tn">&mdash;</td><td className="ty">&#10003;</td><td className="tn">&mdash;</td></tr>
                            <tr><td>Packs Vol + Hôtel + Guide</td><td className="tn">&mdash;</td><td className="ty">&#10003;</td><td className="tn">&mdash;</td></tr>
                            <tr><td>Guide IA personnalisé</td><td className="ta">10 $/guide</td><td className="ta">Gratuit</td><td className="ty">&#10003;</td></tr>
                            <tr><td>Réservations guidées par IA</td><td className="tn">&mdash;</td><td className="ty">&#10003;</td><td className="ty">&#10003;</td></tr>
                        </tbody>
                    </table>
                </section>

                {/* PACK PREVIEW */}
                <section className="pack">
                    <div className="pack-head">
                        <div className="mascot-ph" style={{ width: '80px', height: '80px', marginBottom: '16px' }}>Mascotte<br />valise</div>
                        <h2>Voici un <em>pack voyage</em> type</h2>
                        <p>Généré automatiquement pour les abonnés Premium quand un prix chute.</p>
                    </div>

                    <div className="pack-card">
                        <div className="pack-grid">
                            {/* Vol */}
                            <div className="pack-col">
                                <div className="pack-label"><span className="pack-dot" style={{ background: 'var(--accent)' }}></span> Vol</div>
                                <div className="img-ph">Photo destination</div>
                                <div className="pack-name">Montréal → Lisbonne</div>
                                <div className="pack-meta">YUL - LIS · Vol direct<br />Mars - Mai 2026</div>
                                <div>
                                    <span className="pack-price">329 $</span>
                                    <span className="pack-old">680 $</span>
                                </div>
                                <div><span className="pack-tag hot">-52%</span></div>
                            </div>
                            {/* Hotel */}
                            <div className="pack-col">
                                <div className="pack-label"><span className="pack-dot" style={{ background: 'var(--green)' }}></span> Hôtel</div>
                                <div className="img-ph">Photo hôtel</div>
                                <div className="pack-name">Casa do Principe</div>
                                <div className="pack-meta">3 étoiles · 9.0/10<br />Alfama, Lisbonne · 5 nuits</div>
                                <span className="pack-price">72 $/nuit</span>
                                <div><span className="pack-tag hot">-49%</span></div>
                            </div>
                            {/* Guide */}
                            <div className="pack-col">
                                <div className="pack-label"><span className="pack-dot" style={{ background: 'var(--gold)' }}></span> Guide IA</div>
                                <div className="img-ph" style={{ borderColor: 'rgba(232,168,23,.2)', background: 'var(--gold-soft)', color: '#B8860B' }}>Mascotte guide</div>
                                <div className="pack-name">Guide Lisbonne 5 jours</div>
                                <div className="pack-meta">Itinéraire personnalisé<br />Activités + réservations</div>
                                <div>
                                    <span className="pack-price" style={{ textDecoration: 'line-through', color: 'var(--text-3)', fontSize: '14px' }}>10 $</span>
                                    <span className="pack-price" style={{ marginLeft: '8px' }}>Gratuit</span>
                                </div>
                                <div><span className="pack-tag free">Inclus Premium</span></div>
                            </div>
                        </div>
                        <div className="pack-bottom">
                            <div>
                                <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>Total estimé · 5 nuits</div>
                                <div className="pack-total">689 $</div>
                                <div className="pack-save">Vous économisez 351 $</div>
                            </div>
                            <button className="pack-cta">Réserver ce pack</button>
                        </div>
                    </div>
                </section>

                {/* GUIDE PREVIEW */}
                <section className="guide">
                    <div className="guide-head">
                        <h2>Aperçu du <em>Guide IA</em></h2>
                        <p>Un plan jour par jour créé par notre IA, adapté à vos goûts.</p>
                    </div>
                    <div className="guide-card">
                        <div className="guide-day">
                            <div className="guide-day-num">1</div>
                            <div className="guide-day-body">
                                <div className="guide-day-title">Arrivée + Alfama</div>
                                <div className="guide-day-desc">Installation à l'hôtel. Balade dans le quartier d'Alfama, le plus ancien de Lisbonne. Dîner au Time Out Market.</div>
                                <div className="guide-day-tip">Réservez le restaurant 2 jours avant sur TheFork</div>
                            </div>
                        </div>
                        <div className="guide-day">
                            <div className="guide-day-num">2</div>
                            <div className="guide-day-body">
                                <div className="guide-day-title">Belem + Pasteis de Nata</div>
                                <div className="guide-day-desc">Tour de Belem le matin (arriver avant 10h). Monastère des Jerónimos. Pasteis de Belem pour le goûter.</div>
                                <div className="guide-day-tip">Billets en ligne sur patrimoniocultural.gov.pt — 10€ combo</div>
                            </div>
                        </div>
                        <div className="guide-day">
                            <div className="guide-day-num">3</div>
                            <div className="guide-day-body">
                                <div className="guide-day-title">Sintra — Excursion journée</div>
                                <div className="guide-day-desc">Train depuis Rossio (40 min). Palais de Pena + Quinta da Regaleira. Retour en fin d'après-midi.</div>
                                <div className="guide-day-tip">Achetez les billets Sintra Green Card en ligne — économisez 30%</div>
                            </div>
                        </div>
                        <div className="guide-blur">
                            <div className="guide-blur-text">Jours 4 et 5 disponibles dans le guide complet...</div>
                            <a href="#pricing" className="guide-blur-cta">Débloquer avec Premium — 5 $/mois</a>
                        </div>
                    </div>
                </section>

                {/* HOW IT WORKS */}
                <section className="how">
                    <h2>Comment <em>ça marche</em></h2>
                    <div className="how-grid">
                        <div className="how-step">
                            <div className="how-num">1</div>
                            <div className="mascot-ph-rect">Mascotte<br />explore</div>
                            <h3>Dis-nous tes rêves</h3>
                            <p>Choisis tes destinations, ton budget, tes dates flexibles.</p>
                        </div>
                        <div className="how-step">
                            <div className="how-num">2</div>
                            <div className="mascot-ph-rect">Mascotte<br />surveillé</div>
                            <h3>On surveille les prix</h3>
                            <p>Notre système vérifie les prix 24/7 sur toutes tes routes.</p>
                        </div>
                        <div className="how-step">
                            <div className="how-num">3</div>
                            <div className="mascot-ph-rect">Mascotte<br />alerte</div>
                            <h3>Alerte au bon moment</h3>
                            <p>Prix en chute? Pack prêt. Tu reçois une notif avec tout inclus.</p>
                        </div>
                        <div className="how-step">
                            <div className="how-num">4</div>
                            <div className="mascot-ph-rect">Mascotte<br />voyage!</div>
                            <h3>Réserve et pars</h3>
                            <p>Un clic pour réserver. Le guide IA est déjà prêt pour ton trip.</p>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="faq" id="faq">
                    <h2>Questions fréquentes</h2>

                    <div className={`faq-item ${openFaq === 0 ? 'open' : ''}`}>
                        <div className="faq-q" onClick={() => toggleFaq(0)}>Le Guide IA est vraiment gratuit avec l'abonnement?</div>
                        <div className="faq-a">Oui. Chaque fois que tu réserves un vol ou un hôtel via notre plateforme en étant abonné Premium, le Guide IA personnalisé est généré gratuitement. Sans abonnement, il coûte 10$ par destination.</div>
                    </div>
                    <div className={`faq-item ${openFaq === 1 ? 'open' : ''}`}>
                        <div className="faq-q" onClick={() => toggleFaq(1)}>Comment fonctionne le "Meilleur moment pour acheter"?</div>
                        <div className="faq-a">On collecte les prix plusieurs fois par jour et on compare avec l'historique. Quand le prix actuel est significativement plus bas que la moyenne, on te le dit avec un score clair : "Ce prix est plus bas que 85% des billets vendus cette semaine."</div>
                    </div>
                    <div className={`faq-item ${openFaq === 2 ? 'open' : ''}`}>
                        <div className="faq-q" onClick={() => toggleFaq(2)}>Je peux annuler l'abonnement quand je veux?</div>
                        <div className="faq-a">Oui, annulation en un clic, pas de questions. Tu gardes l'accès jusqu'à la fin de ton mois payé. Les guides déjà générés restent à toi pour toujours.</div>
                    </div>
                    <div className={`faq-item ${openFaq === 3 ? 'open' : ''}`}>
                        <div className="faq-q" onClick={() => toggleFaq(3)}>Qu'est-ce que le Guide IA inclut exactement?</div>
                        <div className="faq-a">Un itinéraire jour par jour optimisé, les activités incontournables classées par priorité, les liens de réservation pour chaque site qui le nécessite (avec le meilleur moment pour réserver), des conseils de locaux, et des astuces pour éviter les pièges à touristes.</div>
                    </div>
                    <div className={`faq-item ${openFaq === 4 ? 'open' : ''}`}>
                        <div className="faq-q" onClick={() => toggleFaq(4)}>C'est quoi un pack voyage?</div>
                        <div className="faq-a">Quand un prix chute sur une destination de ta watchlist, on génère automatiquement un pack complet : le vol au meilleur prix, l'hôtel recommandé dans ton budget, et le guide IA avec les activités. Tu reçois une notification avec le total et tu peux réserver en quelques clics.</div>
                    </div>
                </section>

                {/* FINAL CTA */}
                <section className="final">
                    <div className="mascot-ph" style={{ width: '120px', height: '120px', marginBottom: '20px', fontSize: '12px' }}>Mascotte<br />célébration!</div>

                    <h2>Prêt à voyager <em>intelligemment</em>?</h2>
                    <p>Rejoins les voyageurs qui économisent des centaines de dollars grâce à l'IA.</p>
                    <a href="#pricing" className="final-btn">Commencer pour 5 $/mois</a>
                </section>
            </div>
            <Footer />
        </>
    );
}
