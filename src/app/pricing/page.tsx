'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/landing/Footer';
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
                alert(data.error || 'Erreur lors de la creation du paiement');
            }
        } catch {
            alert('Erreur reseau. Reessayez.');
        } finally {
            setCheckoutLoading(null);
        }
    };

    return (
        <>
            <Navbar dark />
            <div className="pricing-page">
                {/* SUCCESS / CANCEL BANNERS */}
                {success && (
                    <div className="pricing-banner success">
                        Paiement reussi ! Bienvenue parmi les voyageurs Premium.
                    </div>
                )}
                {canceled && (
                    <div className="pricing-banner canceled">
                        Paiement annule. Vous pouvez reessayer quand vous voulez.
                    </div>
                )}

                {/* HERO */}
                <section className="hero">
                    <Image
                        src="/mascots/premium-gold.png"
                        alt="GeaiMonVol Premium"
                        width={100}
                        height={100}
                        className="hero-mascot-img"
                    />
                    <div className="hero-badge">Nouveau — Packs voyage tout-inclus</div>
                    <h1>Ton voyage de reve,<br /><em>organise par l&apos;IA</em></h1>
                    <p>Pas juste des deals. Un assistant personnel qui surveille les prix, cree ton pack Vol + Hotel + Activites, et te dit quand reserver.</p>
                </section>

                {/* PRICING */}
                <section className="pricing" id="pricing">
                    {/* GRATUIT */}
                    <div className="pcard">
                        <div className="p-tier">Gratuit</div>
                        <div className="p-name">Explorateur</div>
                        <div className="p-desc">Decouvre les deals sur la carte et explore les destinations.</div>
                        <div className="p-price"><span className="p-dollar">0 $</span></div>
                        <div className="p-note">Pour toujours</div>
                        <ul className="p-list">
                            <li><span className="ck y">&#10003;</span>Carte interactive des deals</li>
                            <li><span className="ck y">&#10003;</span>Consultation des prix en temps reel</li>
                            <li><span className="ck y">&#10003;</span>Alertes email generales</li>
                            <li><span className="ck n">&times;</span>Alertes personnalisees</li>
                            <li><span className="ck n">&times;</span>Packs voyage IA</li>
                            <li><span className="ck n">&times;</span>&laquo;Meilleur moment pour acheter&raquo;</li>
                            <li><span className="ck n">&times;</span>Guide IA gratuit</li>
                        </ul>
                        <a href="/auth" className="p-cta out">Commencer gratuitement</a>
                    </div>

                    {/* PREMIUM */}
                    <div className="pcard pop">
                        <div className="p-tier">Premium</div>
                        <div className="p-name">Voyageur</div>
                        <div className="p-desc">Ton assistant voyage. Prix surveilles, packs prets, guides offerts.</div>
                        <div className="p-price"><span className="p-dollar">5 $</span><span className="p-period">/ mois</span></div>
                        <div className="p-note">Annulation a tout moment</div>
                        <ul className="p-list">
                            <li><span className="ck y">&#10003;</span>Tout le plan Gratuit</li>
                            <li><span className="ck y">&#10003;</span><strong>Alertes personnalisees</strong> — prix sous ton budget</li>
                            <li><span className="ck y">&#10003;</span><strong>&laquo;Meilleur moment pour acheter&raquo;</strong></li>
                            <li><span className="ck y">&#10003;</span><strong>Watchlist illimitee</strong></li>
                            <li><span className="ck y">&#10003;</span><strong>Packs Vol + Hotel + Guide</strong></li>
                            <li><span className="ck y">&#10003;</span><strong>Notification drop de prix</strong></li>
                            <li><span className="ck y">&#10003;</span><span className="bonus">Guide IA gratuit a chaque reservation</span></li>
                        </ul>
                        <button
                            className="p-cta pri"
                            disabled={checkoutLoading === 'premium'}
                            onClick={() => handleCheckout('premium')}
                        >
                            {checkoutLoading === 'premium' ? 'Redirection...' : 'S\'abonner a 5 $/mois'}
                        </button>
                    </div>

                </section>

                {/* COMPARISON TABLE */}
                <section className="cmp">
                    <h2>Comparaison detaillee</h2>
                    <table>
                        <thead><tr><th></th><th>Gratuit</th><th>Premium 5$/m</th></tr></thead>
                        <tbody>
                            <tr><td>Carte des deals</td><td className="ty">&#10003;</td><td className="ty">&#10003;</td></tr>
                            <tr><td>Alertes email generales</td><td className="ty">&#10003;</td><td className="ty">&#10003;</td></tr>
                            <tr><td>Alertes personnalisees (budget)</td><td className="tn">&mdash;</td><td className="ty">&#10003;</td></tr>
                            <tr><td>Watchlist de destinations</td><td className="tn">&mdash;</td><td className="ta">Illimitee</td></tr>
                            <tr><td>&laquo;Meilleur moment pour acheter&raquo;</td><td className="tn">&mdash;</td><td className="ty">&#10003;</td></tr>
                            <tr><td>Notification drop de prix</td><td className="tn">&mdash;</td><td className="ty">&#10003;</td></tr>
                            <tr><td>Packs Vol + Hotel + Guide</td><td className="tn">&mdash;</td><td className="ty">&#10003;</td></tr>
                            <tr><td>Guide IA personnalise</td><td className="tn">&mdash;</td><td className="ta">Gratuit</td></tr>
                            <tr><td>Reservations guidees par IA</td><td className="tn">&mdash;</td><td className="ty">&#10003;</td></tr>
                        </tbody>
                    </table>
                </section>

                {/* PACK PREVIEW */}
                <section className="pack">
                    <div className="pack-head">
                        <h2>Voici un <em>pack voyage</em> type</h2>
                        <p>Genere automatiquement pour les abonnes Premium quand un prix chute.</p>
                    </div>

                    <div className="pack-card">
                        <div className="pack-grid">
                            {/* Vol */}
                            <div className="pack-col">
                                <div className="pack-label"><span className="pack-dot" style={{ background: '#00D4FF' }}></span> Vol</div>
                                <div className="pack-icon">&#9992;</div>
                                <div className="pack-name">Montreal &rarr; Lisbonne</div>
                                <div className="pack-meta">YUL - LIS &middot; Vol direct<br />Mars - Mai 2026</div>
                                <div>
                                    <span className="pack-price">329 $</span>
                                    <span className="pack-old">680 $</span>
                                </div>
                                <div><span className="pack-tag hot">-52%</span></div>
                            </div>
                            {/* Hotel */}
                            <div className="pack-col">
                                <div className="pack-label"><span className="pack-dot" style={{ background: '#4ADE80' }}></span> Hotel</div>
                                <div className="pack-icon">&#127976;</div>
                                <div className="pack-name">Casa do Principe</div>
                                <div className="pack-meta">3 etoiles &middot; 9.0/10<br />Alfama, Lisbonne &middot; 5 nuits</div>
                                <span className="pack-price">72 $/nuit</span>
                                <div><span className="pack-tag hot">-49%</span></div>
                            </div>
                            {/* Guide */}
                            <div className="pack-col">
                                <div className="pack-label"><span className="pack-dot" style={{ background: '#FBBF24' }}></span> Guide IA</div>
                                <div className="pack-icon">&#129302;</div>
                                <div className="pack-name">Guide Lisbonne 5 jours</div>
                                <div className="pack-meta">Itineraire personnalise<br />Activites + reservations</div>
                                <div>
                                    <span className="pack-price" style={{ textDecoration: 'line-through', color: 'var(--text-3)', fontSize: '14px' }}>10 $</span>
                                    <span className="pack-price" style={{ marginLeft: '8px' }}>Gratuit</span>
                                </div>
                                <div><span className="pack-tag free">Inclus Premium</span></div>
                            </div>
                        </div>
                        <div className="pack-bottom">
                            <div>
                                <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>Total estime &middot; 5 nuits</div>
                                <div className="pack-total">689 $</div>
                                <div className="pack-save">Vous economisez 351 $</div>
                            </div>
                            <button className="pack-cta">Reserver ce pack</button>
                        </div>
                    </div>
                </section>

                {/* HOW IT WORKS */}
                <section className="how">
                    <h2>Comment <em>ca marche</em></h2>
                    <div className="how-grid">
                        <div className="how-step">
                            <Image src="/mascots/step1-scanner.png" alt="Scanner" width={64} height={64} className="how-step-img" />
                            <div className="how-num">1</div>
                            <h3>Dis-nous tes reves</h3>
                            <p>Choisis tes destinations, ton budget, tes dates flexibles.</p>
                        </div>
                        <div className="how-step">
                            <Image src="/mascots/step2-comparer.png" alt="Comparer" width={64} height={64} className="how-step-img" />
                            <div className="how-num">2</div>
                            <h3>On surveille les prix</h3>
                            <p>Notre systeme verifie les prix 24/7 sur toutes tes routes.</p>
                        </div>
                        <div className="how-step">
                            <Image src="/mascots/step3-deals.png" alt="Deals" width={64} height={64} className="how-step-img" />
                            <div className="how-num">3</div>
                            <h3>Alerte au bon moment</h3>
                            <p>Prix en chute? Pack pret. Tu recois une notif avec tout inclus.</p>
                        </div>
                        <div className="how-step">
                            <Image src="/mascots/step4-voyage.png" alt="Voyage" width={64} height={64} className="how-step-img" />
                            <div className="how-num">4</div>
                            <h3>Reserve et pars</h3>
                            <p>Un clic pour reserver. Le guide IA est deja pret pour ton trip.</p>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="faq" id="faq">
                    <h2>Questions frequentes</h2>

                    <div className={`faq-item ${openFaq === 0 ? 'open' : ''}`}>
                        <div className="faq-q" onClick={() => toggleFaq(0)}>Comment fonctionne le &laquo;Meilleur moment pour acheter&raquo;?</div>
                        <div className="faq-a">On collecte les prix plusieurs fois par jour et on compare avec l&apos;historique. Quand le prix actuel est significativement plus bas que la moyenne, on te le dit avec un score clair : &quot;Ce prix est plus bas que 85% des billets vendus cette semaine.&quot;</div>
                    </div>
                    <div className={`faq-item ${openFaq === 1 ? 'open' : ''}`}>
                        <div className="faq-q" onClick={() => toggleFaq(1)}>Je peux annuler l&apos;abonnement quand je veux?</div>
                        <div className="faq-a">Oui, annulation en un clic, pas de questions. Tu gardes l&apos;acces jusqu&apos;a la fin de ton mois paye.</div>
                    </div>
                    <div className={`faq-item ${openFaq === 2 ? 'open' : ''}`}>
                        <div className="faq-q" onClick={() => toggleFaq(2)}>C&apos;est quoi un pack voyage?</div>
                        <div className="faq-a">Quand un prix chute sur une destination de ta watchlist, on genere automatiquement un pack complet : le vol au meilleur prix et l&apos;hotel recommande dans ton budget. Tu recois une notification avec le total et tu peux reserver en quelques clics.</div>
                    </div>
                </section>

                {/* FINAL CTA */}
                <section className="final">
                    <Image
                        src="/mascots/logo.png"
                        alt="GeaiMonVol"
                        width={120}
                        height={120}
                        className="final-mascot-img"
                    />
                    <h2>Pret a voyager <em>intelligemment</em>?</h2>
                    <p>Rejoins les voyageurs qui economisent des centaines de dollars grace a l&apos;IA.</p>
                    <a href="#pricing" className="final-btn">Commencer pour 5 $/mois</a>
                </section>
            </div>
            <Footer />
        </>
    );
}
