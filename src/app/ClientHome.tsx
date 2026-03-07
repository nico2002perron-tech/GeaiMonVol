'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '@/components/landing/Footer';
import './landing.css';

const DEALS = [
  {
    city: 'Lisbonne', country: 'Portugal', price: 529,
    dates: 'Avril – Mai', tag: 'Top Deal', tagIcon: '🔥',
    code: 'LIS', gradient: 'linear-gradient(135deg, #FF6B35 0%, #FF9A76 100%)',
    image: '/wonders/colosseum.png',
  },
  {
    city: 'Tokyo', country: 'Japon', price: 689,
    dates: 'Septembre', tag: 'Tendance', tagIcon: '✈️',
    code: 'TYO', gradient: 'linear-gradient(135deg, #F472B6 0%, #C084FC 100%)',
    image: '/wonders/tajmahal.png',
  },
  {
    city: 'Barcelone', country: 'Espagne', price: 599,
    dates: 'Été 2026', tag: 'Populaire', tagIcon: '⭐',
    code: 'BCN', gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    image: '/wonders/machupicchu.png',
  },
  {
    city: 'Cancún', country: 'Mexique', price: 412,
    dates: 'Mars – Avril', tag: 'Top Deal', tagIcon: '🔥',
    code: 'CUN', gradient: 'linear-gradient(135deg, #06B6D4 0%, #2DD4BF 100%)',
    image: '/wonders/cristo.png',
  },
  {
    city: 'Paris', country: 'France', price: 549,
    dates: 'Mai – Juin', tag: 'Classique', tagIcon: '🗼',
    code: 'CDG', gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    image: '/wonders/eiffel.png',
  },
  {
    city: 'Reykjavík', country: 'Islande', price: 399,
    dates: 'Juin', tag: 'Aubaine', tagIcon: '💰',
    code: 'KEF', gradient: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
    image: '/wonders/greatwall.png',
  },
];

const STEPS = [
  { num: '01', icon: '🌍', title: 'Explore', desc: 'Navigue sur notre globe 3D et découvre les destinations au meilleur prix.' },
  { num: '02', icon: '📊', title: 'Compare', desc: 'Notre IA analyse des centaines de vols pour te trouver les meilleurs deals.' },
  { num: '03', icon: '✈️', title: 'Décolle', desc: 'Réserve ton vol en un clic et pars à l\'aventure au prix le plus bas.' },
];

const FEATURES = [
  { icon: '🤖', title: 'IA qui scanne pour toi', desc: 'Notre intelligence artificielle analyse des centaines de vols chaque jour depuis Montréal.' },
  { icon: '🔔', title: 'Alertes en temps réel', desc: 'Reçois une notification dès qu\'un deal exceptionnel apparaît pour ta destination.' },
  { icon: '🌍', title: 'Globe interactif', desc: 'Explore les destinations visuellement sur notre carte 3D immersive et intuitive.' },
  { icon: '💎', title: 'Deals exclusifs', desc: 'Des prix que tu ne trouveras nulle part ailleurs, vérifiés et mis à jour quotidiennement.' },
];

export default function ClientHome() {
  const [current, setCurrent] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const next = useCallback(() => setCurrent(p => (p + 1) % DEALS.length), []);
  const prev = useCallback(() => setCurrent(p => (p - 1 + DEALS.length) % DEALS.length), []);

  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const deal = DEALS[current];

  return (
    <div className="landing">
      {/* ─── HEADER ─── */}
      <header className={`lp-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-header-inner">
          <Link href="/" className="lp-logo">
            <Image src="/logo_geai.png" alt="" width={36} height={36} />
            <span className="lp-logo-text">Geai<span>MonVol</span></span>
          </Link>

          <nav className="lp-nav">
            <a href="#deals">Top Deals</a>
            <a href="#how">Comment ça marche</a>
            <a href="#features">Pourquoi nous</a>
            <Link href="/explore">Explorer</Link>
          </nav>

          <Link href="/explore" className="lp-header-cta">
            Explorer le globe
          </Link>

          <button
            className={`lp-burger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="lp-mobile-menu"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <a href="#deals" onClick={() => setMenuOpen(false)}>Top Deals</a>
              <a href="#how" onClick={() => setMenuOpen(false)}>Comment ça marche</a>
              <a href="#features" onClick={() => setMenuOpen(false)}>Pourquoi nous</a>
              <Link href="/explore" onClick={() => setMenuOpen(false)}>Explorer le globe</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── HERO ─── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <motion.div
            className="lp-hero-text"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="lp-hero-pill">
              <span className="lp-live-dot" />
              Deals mis à jour en temps réel
            </div>

            <h1>
              Trouve les meilleurs deals de vols au départ de <em>Montréal</em>
            </h1>
            <p className="lp-hero-sub">
              Découvre les destinations tendances et voyage au meilleur prix.
              Notre IA scanne des centaines de vols chaque jour pour toi.
            </p>
            <div className="lp-hero-btns">
              <a href="#deals" className="btn-pri">
                Voir les Top Deals
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14m-6-6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <Link href="/explore" className="btn-sec">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 12h20M12 2c2.5 2.5 4 5.5 4 10s-1.5 7.5-4 10c-2.5-2.5-4-5.5-4-10s1.5-7.5 4-10z" stroke="currentColor" strokeWidth="2" />
                </svg>
                Explorer sur le globe
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="lp-hero-visual"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="lp-carousel">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  className="lp-card"
                  style={{ background: deal.gradient }}
                  initial={{ opacity: 0, x: 60, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -60, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="lp-card-tag">{deal.tagIcon} {deal.tag}</div>
                  <div className="lp-card-route">
                    <span>YUL</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14m-6-6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{deal.code}</span>
                  </div>
                  <h3 className="lp-card-city">{deal.city}</h3>
                  <p className="lp-card-country">{deal.country}</p>
                  <div className="lp-card-price">{deal.price} $</div>
                  <div className="lp-card-dates">{deal.dates}</div>
                </motion.div>
              </AnimatePresence>

              <div className="lp-carousel-nav">
                <button onClick={prev} aria-label="Précédent">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="lp-carousel-dots">
                  {DEALS.map((_, i) => (
                    <button
                      key={i}
                      className={`lp-dot ${i === current ? 'active' : ''}`}
                      onClick={() => setCurrent(i)}
                      aria-label={`Deal ${i + 1}`}
                    />
                  ))}
                </div>
                <button onClick={next} aria-label="Suivant">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="lp-mascot">
              <Image src="/mascots/logo.png" alt="Geai Bleu" width={100} height={100} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── TRUST BAND ─── */}
      <section className="lp-trust">
        <div className="lp-trust-inner">
          {[
            { icon: '✈️', text: 'Départs depuis Montréal' },
            { icon: '🔥', text: 'Deals mis à jour en direct' },
            { icon: '⚡', text: 'Comparaison instantanée' },
            { icon: '🌎', text: '50+ destinations' },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="lp-trust-item"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <span className="lp-trust-icon">{item.icon}</span>
              <span>{item.text}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── TOP DEALS ─── */}
      <section className="lp-deals" id="deals">
        <div className="lp-deals-inner">
          <motion.div
            className="lp-section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="lp-section-tag">🔥 Tendances</span>
            <h2>Top Deals du moment</h2>
            <p>Les meilleures offres repérées pour toi cette semaine, au départ de Montréal.</p>
          </motion.div>

          <div className="lp-deals-grid">
            {DEALS.map((d, i) => (
              <motion.div
                key={d.code}
                className="lp-deal"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <div className="lp-deal-image">
                  <Image
                    src={d.image}
                    alt={d.city}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="lp-deal-image-overlay" style={{ background: d.gradient }} />
                  <div className="lp-deal-tag">{d.tagIcon} {d.tag}</div>
                </div>
                <div className="lp-deal-content">
                  <div className="lp-deal-route">YUL → {d.code}</div>
                  <h3>{d.city}</h3>
                  <p>{d.country}</p>
                  <div className="lp-deal-bottom">
                    <span className="lp-deal-price">{d.price} $</span>
                    <span className="lp-deal-dates">{d.dates}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="lp-deals-cta"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/explore" className="btn-pri">
              Explorer toutes les destinations
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-6-6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── COMMENT ÇA MARCHE ─── */}
      <section className="lp-how" id="how">
        <div className="lp-how-inner">
          <motion.div
            className="lp-section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="lp-section-tag">🚀 Simple et rapide</span>
            <h2>Comment ça marche</h2>
            <p>Trois étapes pour trouver le vol parfait au meilleur prix.</p>
          </motion.div>

          <div className="lp-how-grid">
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                className="lp-step"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <div className="lp-step-num">{s.num}</div>
                <div className="lp-step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="lp-step-connector">
                    <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
                      <path d="M0 12h32m-6-6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── POURQUOI GEAIMONVOL ─── */}
      <section className="lp-features" id="features">
        <div className="lp-features-inner">
          <motion.div
            className="lp-section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="lp-section-tag">✨ Pourquoi GeaiMonVol</span>
            <h2>Voyager n&apos;a jamais été aussi simple</h2>
            <p>Des outils puissants pour trouver le vol parfait, en quelques secondes.</p>
          </motion.div>

          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                className="lp-feature"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="lp-cta-banner">
        <motion.div
          className="lp-cta-inner"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="lp-cta-content">
            <div className="lp-cta-icon">🌎</div>
            <h2>Prêt à décoller ?</h2>
            <p>Explore plus de 50 destinations sur notre globe 3D interactif et trouve le deal parfait pour toi.</p>
            <Link href="/explore" className="btn-pri lp-cta-btn">
              Explorer le globe maintenant
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-6-6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <Footer />
    </div>
  );
}
