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
                <div className="sb-count">{region?.deals.length || 0} deals trouvés</div>
            </div>
            <div className="sb-list">
                {region?.deals.map((deal, i) => (
                    <div key={deal.id} className="sb-deal" onClick={() => onSelectFlight?.(deal)}>
                        <img className="sb-deal-img" src={deal.img} alt={deal.city} />
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
