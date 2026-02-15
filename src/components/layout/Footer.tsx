import Link from "next/link";
import Image from "next/image";

export default function Footer() {
    return (
        <footer>
            <div className="footer-inner">
                <Link href="#" className="logo">
                    <Image
                        src="/Gemini_Generated_Image_o243yho243yho243.png"
                        alt=""
                        className="logo-img"
                        width={30}
                        height={30}
                    />
                    <div className="logo-word">
                        <span className="jet">Geai</span>
                        <span className="bleu">MonVol</span>
                    </div>
                </Link>
                <ul className="footer-links">
                    <li>
                        <Link href="#">Premium</Link>
                    </li>
                    <li>
                        <Link href="#">Aide</Link>
                    </li>
                    <li>
                        <Link href="#">Blog</Link>
                    </li>
                    <li>
                        <Link href="#">Termes</Link>
                    </li>
                    <li>
                        <Link href="#">Confidentialité</Link>
                    </li>
                </ul>
                <div className="footer-copy">© 2026 GeaiMonVol</div>
            </div>
        </footer>
    );
}
