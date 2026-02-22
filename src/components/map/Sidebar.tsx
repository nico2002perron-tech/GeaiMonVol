'use client';
import { REGIONS } from '@/lib/data/regions';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    selectedRegion?: string;
    onSelectFlight?: (flight: any) => void;
}

export default function Sidebar({ isOpen, onClose, selectedRegion, onSelectFlight }: SidebarProps) {
    const region = selectedRegion ? REGIONS[selectedRegion] : null;

    return (
        <div className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sb-head">
                <button className="sb-close" onClick={onClose}>✕</button>
                <div className="sb-region">{region?.name || 'Sélectionnez une région'}</div>
                <div className="sb-count">{(region?.deals || []).length} deals trouvés</div>
            </div>
            <div className="sb-list">
                {(region?.deals || []).map((deal: any, i: number) => (
                    <div key={deal.id} className="sb-deal" onClick={() => onSelectFlight?.(deal)}>
                        <img
                            className="sb-deal-img"
                            src={deal.img}
                            alt={deal.city}
                            onError={(e) => {
                                const target = e.currentTarget;
                                if (!target.dataset.failed) {
                                    target.dataset.failed = 'true';
                                    target.src = 'data:image/svg+xml,' + encodeURIComponent(
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect fill="%23DCEAF5" width="300" height="200"/><text x="150" y="105" text-anchor="middle" fill="%238FA3B8" font-size="14" font-family="sans-serif">Image non disponible</text></svg>'
                                    );
                                }
                            }}
                        />
                        <div className="sb-deal-body">
                            <div className="sb-deal-top">
                                <div className="sb-deal-city">{deal.city}</div>
                                <div className="sb-deal-price">{deal.price} $</div>
                            </div>
                            <div className="sb-deal-info">{deal.route} · {deal.dates}</div>
                            <button className="sb-deal-cta">Voir ce deal</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
