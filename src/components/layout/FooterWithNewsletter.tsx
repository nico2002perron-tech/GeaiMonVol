'use client';

import React from 'react';
import Footer from './Footer';

export default function FooterWithNewsletter() {
  return (
    <>
      {/* Newsletter row */}
      <div className="footer-newsletter">
        <div className="footer-newsletter__inner">
          <h3 className="footer-newsletter__title">
            Ne rate pas les meilleures offres
          </h3>
          <p className="footer-newsletter__sub">
            Rejoins 500+ voyageurs quebecois. Un courriel par semaine avec les deals les plus fous.
          </p>
          <form
            className="footer-newsletter__form"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const btn = form.querySelector('.footer-newsletter__btn') as HTMLButtonElement;
              const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
              if (email && btn) {
                btn.textContent = '✈ Envoye!';
                setTimeout(() => {
                  form.reset();
                  btn.textContent = "S'abonner";
                }, 2500);
              }
            }}
          >
            <input
              name="email"
              type="email"
              required
              placeholder="ton@courriel.com"
              className="footer-newsletter__input"
            />
            <button type="submit" className="footer-newsletter__btn">
              S&apos;abonner
            </button>
          </form>
          <p className="footer-newsletter__privacy">
            Pas de spam, promis. Desabonnement en 1 clic.
          </p>
        </div>
      </div>

      {/* Standard footer */}
      <Footer />
    </>
  );
}
