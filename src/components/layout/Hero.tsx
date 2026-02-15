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
        </section>
    );
}
