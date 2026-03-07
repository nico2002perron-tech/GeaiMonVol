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
    dates: 'Avril - Mai', tag: 'Top Deal', tagIcon: '\uD83D\uDD25',
    code: 'LIS', gradient: 'linear-gradient(135deg, #FF6B35 0%, #FF9A76 100%)',
  },
  {
    city: 'Tokyo', country: 'Japon', price: 689,
    dates: 'Septembre', tag: 'Tendance', tagIcon: '\u2708\uFE0F',
    code: 'TYO', gradient: 'linear-gradient(135deg, #F472B6 0%, #C084FC 100%)',
  },
  {
    city: 'Barcelone', country: 'Espagne', price: 599,
    dates: 'Ete 2026', tag: 'Populaire', tagIcon: '\u2B50',
    code: 'BCN', gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  },
  {
    city: 'Cancun', country: 'Mexique', price: 412,
    dates: 'Mars - Avril', tag: 'Top Deal', tagIcon: '\uD83D\uDD25',
    code: 'CUN', gradient: 'linear-gradient(135deg, #06B6D4 0%, #2DD4BF 100%)',
  },
  {
    city: 'Paris', country: 'France', price: 549,
    dates: 'Mai - Juin', tag: 'Classique', tagIcon: '\uD83D\uDDFC',
    code: 'CDG', gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
  },
  {
    city: 'Reykjavik', country: 'Islande', price: 399,
    dates: 'Juin', tag: 'Aubaine', tagIcon: '\uD83D\uDCB0',
    code: 'KEF', gradient: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
  },
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
            <a href="#destinations">Destinations</a>
            <a href="#how">Comment ca marche</a>
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

        {menuOpen && (
          <div className="lp-mobile-menu">
            <a href="#deals" onClick={() => setMenuOpen(false)}>Top Deals</a>
            <a href="#destinations" onClick={() => setMenuOpen(false)}>Destinations</a>
            <a href="#how" onClick={() => setMenuOpen(false)}>Comment ca marche</a>
            <Link href="/explore" onClick={() => setMenuOpen(false)}>Explorer le globe</Link>
          </div>
        )}
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
            <h1>
              Trouve les meilleurs deals de vols au depart de <em>Montreal</em>
            </h1>
            <p className="lp-hero-sub">
              Decouvre les destinations tendances et voyage au meilleur prix.
            </p>
            <div className="lp-hero-btns">
              <a href="#deals" className="btn-pri">Voir les Top Deals</a>
              <Link href="/explore" className="btn-sec">Explorer sur le globe</Link>
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
                      <path d="M5 12h14m-6-6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                <button onClick={prev} aria-label="Precedent">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
            { icon: '\u2708\uFE0F', text: 'Departs depuis Montreal' },
            { icon: '\uD83D\uDD25', text: 'Deals tendances' },
            { icon: '\u26A1', text: 'Comparaison rapide' },
            { icon: '\uD83C\uDF0E', text: 'Destinations populaires' },
          ].map((item, i) => (
            <div key={i} className="lp-trust-item">
              <span className="lp-trust-icon">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TOP DEALS ─── */}
      <section className="lp-deals" id="deals">
        <div className="lp-deals-inner">
          <h2>Top Deals du moment</h2>
          <p className="lp-deals-sub">Les meilleures offres reperees pour toi cette semaine</p>

          <div className="lp-deals-grid">
            {DEALS.map((d, i) => (
              <motion.div
                key={d.code}
                className="lp-deal"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <div className="lp-deal-gradient" style={{ background: d.gradient }} />
                <div className="lp-deal-content">
                  <div className="lp-deal-tag">{d.tagIcon} {d.tag}</div>
                  <div className="lp-deal-route">YUL &rarr; {d.code}</div>
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
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <Footer />
    </div>
  );
}
