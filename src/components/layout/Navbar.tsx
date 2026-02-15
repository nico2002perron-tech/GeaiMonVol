import Link from "next/link";
import Image from "next/image";

interface NavbarProps {
    onOpenHowItWorks?: () => void;
}

export default function Navbar({ onOpenHowItWorks }: NavbarProps) {
    return (
        <nav>
            <Link href="#" className="logo">
                <Image src="/Gemini_Generated_Image_o243yho243yho243.png" alt="GeaiMonVol" className="logo-img" width={40} height={40} />
                <div className="logo-word">
                    <span className="jet">Geai</span>
                    <span className="bleu">MonVol</span>
                </div>
            </Link>
            <ul className="nav-menu">
                <li>
                    <Link href="/map">Carte</Link>
                </li>
                <li>
                    <Link href="#deals">Aubaines</Link>
                </li>
                <li>
                    <button onClick={(e) => { e.preventDefault(); onOpenHowItWorks?.(); }} className="nav-link-btn">
                        Comment ça marche
                    </button>
                </li>
                <li>
                    <Link href="#explore">Activités</Link>
                </li>
                <li>
                    <Link href="/pricing">Forfaits</Link>
                </li>
                <li>
                    <Link href="#signup" className="nav-cta">
                        S'inscrire
                    </Link>
                </li>
            </ul>
        </nav>
    );
}

