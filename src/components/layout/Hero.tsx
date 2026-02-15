import Image from "next/image";
import SearchModule from "./SearchModule";

export default function Hero() {
    return (
        <section className="hero">
            <div className="hero-orb"></div>
            <Image
                src="/Gemini_Generated_Image_o243yho243yho243.png"
                alt=""
                className="hero-mascot"
                width={80}
                height={80}
            />
            <div className="hero-pill">
                <span className="live-dot"></span> 3 nouvelles offres détectées
            </div>
            <h1>
                Voyagez pour
                <br />
                <span className="grad">ridiculement moins</span>
            </h1>
            <p className="hero-sub">
                Vols, hôtels et activités aux meilleurs prix. Notre algorithme trouve ce
                que vous ne trouverez pas.
            </p>

            <SearchModule />

            <div style={{
                display: 'flex',
                gap: 12,
                marginTop: 24,
                position: 'relative',
                zIndex: 1,
            }}>
                <a
                    href="/map"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '14px 28px',
                        background: 'var(--blue)',
                        color: '#fff',
                        borderRadius: '50px',
                        fontWeight: 800,
                        fontSize: '15px',
                        textDecoration: 'none',
                        boxShadow: 'var(--sh-blue)',
                        transition: 'all .2s',
                        fontFamily: "'DM Sans', sans-serif",
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                        <line x1="8" y1="2" x2="8" y2="18" />
                        <line x1="16" y1="6" x2="16" y2="22" />
                    </svg>
                    Explorer la carte
                </a>
                <a
                    href="#deals"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '14px 28px',
                        background: 'var(--blue-ultra)',
                        color: 'var(--navy)',
                        border: '1px solid var(--border)',
                        borderRadius: '50px',
                        fontWeight: 700,
                        fontSize: '15px',
                        textDecoration: 'none',
                        transition: 'all .2s',
                        fontFamily: "'DM Sans', sans-serif",
                    }}
                >
                    Voir les deals
                </a>
            </div>
        </section>
    );
}
