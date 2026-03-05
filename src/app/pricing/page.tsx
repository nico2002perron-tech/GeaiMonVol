'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import type { PlanKey } from '@/lib/stripe-config';
import './pricing.css';

export default function PricingPage() {
    return (
        <Suspense>
            <PricingContent />
        </Suspense>
    );
}

function PricingContent() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [checkoutLoading, setCheckoutLoading] = useState<PlanKey | null>(null);
    const searchParams = useSearchParams();
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const handleCheckout = async (plan: PlanKey) => {
        setCheckoutLoading(plan);
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Erreur lors de la création du paiement');
            }
        } catch {
            alert('Erreur réseau. Réessayez.');
        } finally {
            setCheckoutLoading(null);
        }
    };

    return (
        <>
            <Navbar />
            <div className="pricing-page">
                {/* SUCCESS / CANCEL BANNERS */}
                {success && (
                    <div className="pricing-banner success">
                        Paiement réussi ! Bienvenue parmi les voyageurs Premium.
                    </div>
                )}
                {canceled && (
                    <div className="pricing-banner canceled">
                        Paiement annulé. Vous pouvez réessayer quand vous voulez.
                    </div>
                )}

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
                        <a href="/auth" className="p-cta out">Commencer gratuitement</a>
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
                        <button
                            className="p-cta pri"
                            disabled={checkoutLoading === 'premium'}
                            onClick={() => handleCheckout('premium')}
                        >
                            {checkoutLoading === 'premium' ? 'Redirection…' : 'S\'abonner à 5 $/mois'}
                        </button>
                    </div>

                </section>

                {/* COMPARISON TABLE */}
                <section className="cmp">
                    <h2>Comparaison détaillée</h2>
                    <table>
                        <thead><tr><th></th><th>Gratuit</th><th>Premium 5$/m</th></tr></thead>
                        <tbody>
                            <tr><td>Carte des deals</td><td className="ty">&#10003;</td><td className="ty">&#10003;</td></tr>
                            <tr><td>Alertes email générales</td><td className="ty">&#10003;</td><td className="ty">&#10003;</td></tr>
                            <tr><td>Alertes personnalisées (budget)</td><td className="tn">&mdash;</td><td className="ty">&#10003;</td></tr>
                            <tr><td>Watchlist de destinations</td><td className="tn">&mdash;</td><td className="ta">Illimitée</td></tr>
                            <tr><td>"Meilleur moment pour acheter"</td><td className="tn">&mdash;</td><td className="ty">&#10003;</td></tr>
                            <tr><td>Notification drop de prix</td><td className="tn">&mdash;</td><td className="ty">&#10003;</td></tr>
                            <tr><td>Packs Vol + Hôtel + Guide</td><td className="tn">&mdash;</td><td className="ty">&#10003;</td></tr>
                            <tr><td>Guide IA personnalisé</td><td className="tn">&mdash;</td><td className="ta">Gratuit</td></tr>
                            <tr><td>Réservations guidées par IA</td><td className="tn">&mdash;</td><td className="ty">&#10003;</td></tr>
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
                        <div className="faq-q" onClick={() => toggleFaq(0)}>Comment fonctionne le "Meilleur moment pour acheter"?</div>
                        <div className="faq-a">On collecte les prix plusieurs fois par jour et on compare avec l'historique. Quand le prix actuel est significativement plus bas que la moyenne, on te le dit avec un score clair : &quot;Ce prix est plus bas que 85% des billets vendus cette semaine.&quot;</div>
                    </div>
                    <div className={`faq-item ${openFaq === 1 ? 'open' : ''}`}>
                        <div className="faq-q" onClick={() => toggleFaq(1)}>Je peux annuler l'abonnement quand je veux?</div>
                        <div className="faq-a">Oui, annulation en un clic, pas de questions. Tu gardes l'accès jusqu'à la fin de ton mois payé.</div>
                    </div>
                    <div className={`faq-item ${openFaq === 2 ? 'open' : ''}`}>
                        <div className="faq-q" onClick={() => toggleFaq(2)}>C'est quoi un pack voyage?</div>
                        <div className="faq-a">Quand un prix chute sur une destination de ta watchlist, on génère automatiquement un pack complet : le vol au meilleur prix et l'hôtel recommandé dans ton budget. Tu reçois une notification avec le total et tu peux réserver en quelques clics.</div>
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
