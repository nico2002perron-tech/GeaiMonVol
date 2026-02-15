export default function CTA() {
    return (
        <section className="cta" id="signup">
            <div className="cta-box">
                <h2>Prêt à partir pour moins?</h2>
                <p>850 000+ voyageurs reçoivent déjà nos alertes.</p>
                <div className="cta-row">
                    <input type="email" placeholder="Votre courriel" />
                    <button>M'inscrire</button>
                </div>
                <div style={{
                    marginTop: 16,
                    fontSize: 13,
                    color: 'var(--text-3)',
                }}>
                    ou <a href="/map" style={{
                        color: 'var(--blue)',
                        fontWeight: 700,
                        textDecoration: 'none',
                    }}>explore la carte interactive →</a>
                </div>
            </div>
        </section>
    );
}
