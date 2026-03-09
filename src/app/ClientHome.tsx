'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LandingHeader from '@/components/LandingHeader';
import './landing.css';

type Category = 'tous' | 'canada' | 'monde' | 'tout-inclus';

const DEALS = [
  {
    city: 'Lisbonne', country: 'Portugal', price: 529, oldPrice: 780,
    dates: 'Avril - Mai', tag: 'Top Deal', tagIcon: '🔥',
    code: 'LIS',
    image: 'https://images.unsplash.com/photo-1570481662006-a3a1374699e8?w=800&h=500&fit=crop',
    category: 'monde' as Category,
  },
  {
    city: 'Tokyo', country: 'Japon', price: 689, oldPrice: 1050,
    dates: 'Septembre', tag: 'Tendance', tagIcon: '✈️',
    code: 'TYO',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=500&fit=crop',
    category: 'monde' as Category,
  },
  {
    city: 'Paris', country: 'France', price: 549, oldPrice: 820,
    dates: 'Mai - Juin', tag: 'Classique', tagIcon: '🗼',
    code: 'CDG',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=500&fit=crop',
    category: 'monde' as Category,
  },
  {
    city: 'Vancouver', country: 'Canada', price: 289, oldPrice: 410,
    dates: 'Mai - Sept.', tag: 'Canada', tagIcon: '🍁',
    code: 'YVR',
    image: 'https://images.unsplash.com/photo-1609825488888-3a766db05542?w=800&h=500&fit=crop',
    category: 'canada' as Category,
  },
  {
    city: 'Calgary', country: 'Canada', price: 249, oldPrice: 380,
    dates: 'Juin - Aout', tag: 'Rocheuses', tagIcon: '🏔️',
    code: 'YYC',
    image: 'https://images.unsplash.com/photo-1561489413-985b06da5bee?w=800&h=500&fit=crop',
    category: 'canada' as Category,
  },
  {
    city: 'Halifax', country: 'Canada', price: 199, oldPrice: 310,
    dates: 'Juillet - Sept.', tag: 'Maritimes', tagIcon: '🌊',
    code: 'YHZ',
    image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&h=500&fit=crop',
    category: 'canada' as Category,
  },
  {
    city: 'Punta Cana', country: 'Rep. Dominicaine', price: 899, oldPrice: 1350,
    dates: 'Dec. - Mars', tag: 'Tout-inclus', tagIcon: '🏖️',
    code: 'PUJ',
    image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&h=500&fit=crop',
    category: 'tout-inclus' as Category,
  },
  {
    city: 'Riviera Maya', country: 'Mexique', price: 849, oldPrice: 1200,
    dates: 'Janv. - Avril', tag: 'Tout-inclus', tagIcon: '🌴',
    code: 'CUN',
    image: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800&h=500&fit=crop',
    category: 'tout-inclus' as Category,
  },
  {
    city: 'Varadero', country: 'Cuba', price: 749, oldPrice: 1100,
    dates: 'Nov. - Avril', tag: 'Tout-inclus', tagIcon: '☀️',
    code: 'VRA',
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=500&fit=crop',
    category: 'tout-inclus' as Category,
  },
];

const FILTER_TABS: { id: Category; label: string }[] = [
  { id: 'tous', label: 'Tous les deals' },
  { id: 'canada', label: '🍁 Canada' },
  { id: 'monde', label: '🌍 International' },
  { id: 'tout-inclus', label: '🏖️ Tout-inclus' },
];

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14m-6-6l6 6-6 6" />
  </svg>
);

export default function ClientHome() {
  const [activeFilter, setActiveFilter] = useState<Category>('tous');
  const filteredDeals = activeFilter === 'tous' ? DEALS : DEALS.filter(d => d.category === activeFilter);

  return (
    <div className="lp">
      {/* ─── HEADER ─── */}
      <LandingHeader />

      {/* ─── HERO (OCEAN) ─── */}
      <section className="lp-hero">
        {/* Simple gradient + wave divider */}
        <div className="lp-ocean">
          <div className="lp-ocean-gradient" />
        </div>

        <div className="lp-hero-content">
          <div className="lp-hero-text">
            <div className="lp-hero-badge">
              <span className="lp-hero-badge-dot" />
              Scanning en direct
            </div>
            <h1>
              Voyage moins cher,<br />
              <span>voyage plus souvent.</span>
            </h1>
            <p className="lp-hero-sub">
              On detecte les baisses de prix sur les vols au depart de Montreal
              et notre IA te cree un itineraire complet en quelques secondes.
            </p>
            <div className="lp-hero-actions">
              <Link href="/explore" className="lp-btn-ocean">
                <span className="lp-btn-ocean-glow" />
                Voir les deals
                <ArrowIcon />
              </Link>
              <a href="#how" className="lp-btn-glass">
                Comment ca marche
              </a>
            </div>
            <div className="lp-hero-proof">
              <div className="lp-hero-proof-item">
                <span className="lp-hero-proof-icon">📡</span>
                <div>
                  <strong>40+</strong>
                  <span>destinations scannees</span>
                </div>
              </div>
              <div className="lp-hero-proof-sep" />
              <div className="lp-hero-proof-item">
                <span className="lp-hero-proof-icon">💰</span>
                <div>
                  <strong>-35%</strong>
                  <span>en moyenne</span>
                </div>
              </div>
              <div className="lp-hero-proof-sep" />
              <div className="lp-hero-proof-item">
                <span className="lp-hero-proof-icon">⚡</span>
                <div>
                  <strong>24h</strong>
                  <span>mise a jour</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lp-hero-visual">
            <div className="lp-hero-card lp-hero-card-float-1">
              <div className="lp-hero-card-img">
                <Image src="https://images.unsplash.com/photo-1570481662006-a3a1374699e8?w=400&h=200&fit=crop" alt="Lisbonne" fill style={{ objectFit: 'cover' }} />
                <span className="lp-hero-card-badge">🔥 -32%</span>
              </div>
              <div className="lp-hero-card-body">
                <div className="lp-hero-card-route">
                  <strong>YUL</strong> → <strong>LIS</strong>
                </div>
                <div className="lp-hero-card-city">Lisbonne</div>
                <div className="lp-hero-card-price">
                  <span className="old">780 $</span>
                  <span className="current">529 $</span>
                </div>
              </div>
            </div>

            <div className="lp-hero-card lp-hero-card-float-2">
              <div className="lp-hero-card-img">
                <Image src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=200&fit=crop" alt="Tokyo" fill style={{ objectFit: 'cover' }} />
                <span className="lp-hero-card-badge">✈️ -34%</span>
              </div>
              <div className="lp-hero-card-body">
                <div className="lp-hero-card-route">
                  <strong>YUL</strong> → <strong>TYO</strong>
                </div>
                <div className="lp-hero-card-city">Tokyo</div>
                <div className="lp-hero-card-price">
                  <span className="old">1 050 $</span>
                  <span className="current">689 $</span>
                </div>
              </div>
            </div>

            <div className="lp-hero-card lp-hero-card-float-3">
              <div className="lp-hero-card-img">
                <Image src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=400&h=200&fit=crop" alt="Punta Cana" fill style={{ objectFit: 'cover' }} />
                <span className="lp-hero-card-badge">🏖️ -33%</span>
              </div>
              <div className="lp-hero-card-body">
                <div className="lp-hero-card-route">
                  <strong>YUL</strong> → <strong>PUJ</strong>
                </div>
                <div className="lp-hero-card-city">Punta Cana</div>
                <div className="lp-hero-card-price">
                  <span className="old">1 350 $</span>
                  <span className="current">899 $</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave transition — evaporation into white */}
        <div className="lp-wave-divider">
          <svg viewBox="0 0 1440 140" preserveAspectRatio="none">
            <path d="M0,50 C240,110 480,10 720,60 C960,110 1200,20 1440,70 L1440,140 L0,140 Z" fill="white" opacity="0.3" />
            <path d="M0,70 C300,30 600,100 900,50 C1100,20 1300,80 1440,55 L1440,140 L0,140 Z" fill="white" opacity="0.5" />
            <path d="M0,90 C200,70 500,110 800,80 C1100,50 1300,100 1440,85 L1440,140 L0,140 Z" fill="#F8FAFC" />
          </svg>
        </div>
      </section>

      {/* ─── TICKER BAR ─── */}
      <section className="lp-ticker">
        {/* Row 1 — scrolls left */}
        <div className="lp-ticker-row">
          <div className="lp-ticker-track lp-ticker-left">
            {[...Array(2)].map((_, i) => (
              <div className="lp-ticker-list" key={i} aria-hidden={i === 1}>
                {DEALS.map((d) => {
                  const pct = Math.round(((d.oldPrice - d.price) / d.oldPrice) * 100);
                  return (
                    <Link href="/explore" className="lp-ticker-card" key={`${i}-${d.code}`}>
                      <span className="lp-ticker-emoji">{d.tagIcon}</span>
                      <span className="lp-ticker-city">{d.city}</span>
                      <span className="lp-ticker-dates">{d.dates}</span>
                      <span className="lp-ticker-arrow">✈</span>
                      <span className="lp-ticker-old">{d.oldPrice}$</span>
                      <span className="lp-ticker-price">{d.price}$</span>
                      <span className="lp-ticker-pct">-{pct}%</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {/* Row 2 — scrolls right (reversed deals) */}
        <div className="lp-ticker-row">
          <div className="lp-ticker-track lp-ticker-right">
            {[...Array(2)].map((_, i) => (
              <div className="lp-ticker-list" key={i} aria-hidden={i === 1}>
                {[...DEALS].reverse().map((d) => {
                  const pct = Math.round(((d.oldPrice - d.price) / d.oldPrice) * 100);
                  return (
                    <Link href="/explore" className="lp-ticker-card" key={`${i}-${d.code}`}>
                      <span className="lp-ticker-emoji">{d.tagIcon}</span>
                      <span className="lp-ticker-city">{d.city}</span>
                      <span className="lp-ticker-dates">{d.dates}</span>
                      <span className="lp-ticker-arrow">✈</span>
                      <span className="lp-ticker-old">{d.oldPrice}$</span>
                      <span className="lp-ticker-price">{d.price}$</span>
                      <span className="lp-ticker-pct">-{pct}%</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="lp-how" id="how">
        <div className="lp-how-header">
          <span className="lp-section-label">Facile</span>
          <h2 className="lp-section-title">3 etapes. C&apos;est tout.</h2>
        </div>

        <div className="lp-steps">
          {/* Step 1 */}
          <div className="lp-step">
            <div className="lp-step-icon lp-step-icon-1">
              <span>📡</span>
            </div>
            <div className="lp-step-content">
              <div className="lp-step-num">01</div>
              <h3 className="lp-step-title">On scanne pour toi</h3>
              <p className="lp-step-desc">Les meilleurs prix de vols depuis Montreal, scannes chaque jour automatiquement.</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="lp-step-arrow">
            <svg viewBox="0 0 80 24" fill="none">
              <path d="M0,12 L60,12" stroke="#BAE6FD" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M55,6 L67,12 L55,18" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>

          {/* Step 2 */}
          <div className="lp-step">
            <div className="lp-step-icon lp-step-icon-2">
              <span>🔔</span>
            </div>
            <div className="lp-step-content">
              <div className="lp-step-num">02</div>
              <h3 className="lp-step-title">Tu recois les deals</h3>
              <p className="lp-step-desc">Alerte email instantanee quand un prix chute sur ta destination preferee.</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="lp-step-arrow">
            <svg viewBox="0 0 80 24" fill="none">
              <path d="M0,12 L60,12" stroke="#BAE6FD" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M55,6 L67,12 L55,18" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>

          {/* Step 3 */}
          <div className="lp-step">
            <div className="lp-step-icon lp-step-icon-3">
              <span>🗺️</span>
            </div>
            <div className="lp-step-content">
              <div className="lp-step-num">03</div>
              <h3 className="lp-step-title">L&apos;IA planifie ton trip</h3>
              <p className="lp-step-desc">Itineraire complet genere par IA : activites, restos, budget jour par jour.</p>
              <span className="lp-step-premium">Premium</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DEALS ─── */}
      <section className="lp-deals" id="deals">
        <div className="lp-deals-inner">
          <div className="lp-deals-header">
            <div className="lp-deals-header-left">
              <span className="lp-section-label">En direct</span>
              <h2 className="lp-section-title">Deals du moment</h2>
            </div>
            <div className="lp-tabs">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`lp-tab ${activeFilter === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lp-grid">
            {filteredDeals.map((d) => {
              const savings = Math.round(((d.oldPrice - d.price) / d.oldPrice) * 100);
              return (
                <Link href="/explore" key={`${d.code}-${d.city}`} className="lp-card">
                  <div className="lp-card-img">
                    <Image
                      src={d.image}
                      alt={d.city}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                    <span className="lp-card-tag">{d.tagIcon} {d.tag}</span>
                    <span className="lp-card-savings">-{savings}%</span>
                  </div>
                  <div className="lp-card-body">
                    <div className="lp-card-route">
                      <span className="lp-card-code">YUL</span>
                      <span className="lp-card-line" />
                      <span className="lp-card-arrow">✈</span>
                      <span className="lp-card-line" />
                      <span className="lp-card-code">{d.code}</span>
                    </div>
                    <h3>{d.city}</h3>
                    <span className="lp-card-meta">{d.country} · {d.dates}</span>
                    <div className="lp-card-bottom">
                      <div className="lp-card-price">
                        <span className="lp-card-old">{d.oldPrice} $</span>
                        <span className="lp-card-amount">{d.price} $</span>
                      </div>
                      <div className="lp-card-cta">
                        <ArrowIcon />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── AI GUIDE FEATURE ─── */}
      <section className="lp-feature" id="guide">
        <div className="lp-feature-text">
          <span className="lp-section-label">Intelligence artificielle</span>
          <h2 className="lp-section-title">Ton guide de voyage, genere par IA</h2>
          <p className="lp-section-sub" style={{ marginBottom: 0 }}>
            Dis-nous ta destination, ton budget et tes preferences.
            On te genere un itineraire complet en quelques secondes.
          </p>
          <ul className="lp-feature-list">
            <li>
              <span className="lp-feature-check"><CheckIcon /></span>
              <span>Planning jour par jour adapte a ta duree de sejour</span>
            </li>
            <li>
              <span className="lp-feature-check"><CheckIcon /></span>
              <span>Suggestions de restos, activites et spots photo</span>
            </li>
            <li>
              <span className="lp-feature-check"><CheckIcon /></span>
              <span>Budget estime detaille pour tout le voyage</span>
            </li>
            <li>
              <span className="lp-feature-check"><CheckIcon /></span>
              <span>Assistant en temps reel pendant ton voyage</span>
            </li>
          </ul>
          <Link href="/explore" className="lp-btn-primary">
            Essayer le guide IA
            <ArrowIcon />
          </Link>
        </div>

        <div className="lp-feature-visual">
          <div className="lp-feature-visual-glow" />
          <div className="lp-mockup-msg user">
            <span className="label">Toi</span>
            Je pars 5 jours a Lisbonne avec 1 500 $ de budget. J&apos;aime la bouffe locale et les quartiers historiques.
          </div>
          <div className="lp-mockup-msg ai">
            <span className="label">GeaiMonVol IA</span>
            Voici ton itineraire pour Lisbonne! Jour 1 : Quartier de l&apos;Alfama, degustation de pasteis de nata chez Manteigaria, coucher de soleil au Miradouro da Graca...
          </div>
          <div className="lp-mockup-msg ai" style={{ opacity: 0.6, maxWidth: '70%' }}>
            <span className="label">Budget estime</span>
            Vols: 529$ · Hebergement: 420$ · Nourriture: 280$ · Activites: 180$
          </div>
        </div>
      </section>

      {/* Wave into dark globe section */}
      <div className="lp-wave-divider-dark">
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path d="M0,40 C360,90 720,10 1080,60 C1260,85 1380,40 1440,50 L1440,100 L0,100 Z" fill="#020810" opacity="0.4" />
          <path d="M0,55 C240,25 600,80 960,35 C1200,5 1380,65 1440,45 L1440,100 L0,100 Z" fill="#020810" />
        </svg>
      </div>

      {/* ─── GLOBE SECTION ─── */}
      <section className="lp-globe-section">
        <div className="lp-globe-inner">
          <span className="lp-section-label">Globe interactif</span>
          <h2 className="lp-section-title">Visualise les deals sur le globe 3D</h2>
          <p className="lp-section-sub">
            Explore les destinations en temps reel sur notre carte interactive.
            Chaque point represente un deal actif au depart de Montreal.
          </p>

          <div className="lp-globe-preview">
            <div className="lp-globe-dots">
              {/* Simulated deal dots on globe */}
              <div className="lp-globe-dot" style={{ width: 6, height: 6, top: '28%', left: '55%', animationDelay: '0s' }} />
              <div className="lp-globe-dot" style={{ width: 5, height: 5, top: '35%', left: '48%', animationDelay: '0.5s' }} />
              <div className="lp-globe-dot" style={{ width: 7, height: 7, top: '42%', left: '60%', animationDelay: '1s' }} />
              <div className="lp-globe-dot" style={{ width: 5, height: 5, top: '22%', left: '42%', animationDelay: '1.5s' }} />
              <div className="lp-globe-dot" style={{ width: 6, height: 6, top: '50%', left: '35%', animationDelay: '2s' }} />
              <div className="lp-globe-dot" style={{ width: 8, height: 8, top: '38%', left: '68%', animationDelay: '0.8s' }} />
              <div className="lp-globe-dot" style={{ width: 5, height: 5, top: '55%', left: '52%', animationDelay: '2.5s' }} />
              <div className="lp-globe-dot" style={{ width: 6, height: 6, top: '30%', left: '72%', animationDelay: '1.2s' }} />
            </div>
          </div>

          <div style={{ marginTop: 48 }}>
            <Link href="/explore" className="lp-btn-light">
              Explorer le globe
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="lp-final-cta">
        <div className="lp-final-inner">
          <span className="lp-section-label">Pret a partir?</span>
          <h2 className="lp-section-title">Trouve ton prochain vol maintenant</h2>
          <p className="lp-section-sub">
            Les prix changent chaque jour. Decouvre les deals en direct et planifie
            ton voyage avec notre guide IA.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/explore" className="lp-btn-primary">
              Voir les deals
              <ArrowIcon />
            </Link>
            <Link href="/auth" className="lp-btn-secondary">
              Creer un compte
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div>
              <div className="lp-footer-brand">
                <Image src="/logo_geai.png" alt="" width={28} height={28} />
                <span>GeaiMonVol</span>
              </div>
              <p className="lp-footer-brand-desc">
                Les meilleurs deals de vols au depart de Montreal.
                Scanne automatique, alertes personnalisees et guide de voyage IA.
              </p>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Produit</div>
              <Link href="/explore">Globe interactif</Link>
              <a href="#deals">Deals en direct</a>
              <a href="#guide">Guide IA</a>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Destinations</div>
              <a href="#deals">Canada</a>
              <a href="#deals">International</a>
              <a href="#deals">Tout-inclus</a>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Compte</div>
              <Link href="/auth">Connexion</Link>
              <Link href="/auth">Inscription</Link>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span className="lp-footer-copy">&copy; 2026 GeaiMonVol. Montreal, QC.</span>
            <span className="lp-footer-made">Fait avec ❤️ au Quebec</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
