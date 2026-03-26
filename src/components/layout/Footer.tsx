import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="lp-footer">
            <div className="lp-footer-inner">
                <div className="lp-footer-top">
                    <div>
                        <div className="lp-footer-brand">
                            <Image src="/logo_geai.png" alt="GeaiMonVol" width={28} height={28} />
                            <span>GeaiMonVol</span>
                        </div>
                        <p className="lp-footer-brand-desc">
                            Les meilleurs deals de vols au d&eacute;part de Montr&eacute;al.
                            Scan automatique, alertes personnalis&eacute;es et guides IA.
                        </p>
                    </div>
                    <div className="lp-footer-col">
                        <div className="lp-footer-col-title">Produit</div>
                        <Link href="/#deals">Deals en direct</Link>
                        <Link href="/explore">Explorer la carte</Link>
                        <Link href="/pricing">Tarifs</Link>
                    </div>
                    <div className="lp-footer-col">
                        <div className="lp-footer-col-title">Destinations</div>
                        <Link href="/destination/CUN">Cancún</Link>
                        <Link href="/destination/CDG">Paris</Link>
                        <Link href="/destination/PUJ">Punta Cana</Link>
                        <Link href="/destination/BCN">Barcelone</Link>
                    </div>
                    <div className="lp-footer-col">
                        <div className="lp-footer-col-title">Compte</div>
                        <Link href="/auth">Connexion</Link>
                        <Link href="/library">Mes guides</Link>
                        <Link href="/profile">Mon profil</Link>
                    </div>
                </div>
                <div className="lp-footer-bottom">
                    <span className="lp-footer-copy">&copy; 2026 GeaiMonVol. Montr&eacute;al, QC.</span>
                    <span className="lp-footer-made">Fait avec &#10084;&#65039; au Qu&eacute;bec</span>
                </div>
            </div>
        </footer>
    );
}
