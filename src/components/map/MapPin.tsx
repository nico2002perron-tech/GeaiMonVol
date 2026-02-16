'use client';

import React from 'react';
import { Flight } from '@/lib/data/flights';

interface MapPinProps {
    deal: Flight;
    regionKey: string;
    x: number;
    y: number;
    index: number;
    showBadge?: boolean;
    onMouseEnter: (e: React.MouseEvent, deal: Flight) => void;
    onMouseLeave: () => void;
    onClick?: (deal: Flight, e: React.MouseEvent) => void;
}

export default function MapPin({ deal, regionKey, x, y, index, showBadge = true, onMouseEnter, onMouseLeave, onClick }: MapPinProps) {
    const isMega = deal.disc >= 52;

    const style = {
        left: `${x}px`,
        top: `${y}px`,
        animationDelay: `${0.8 + index * 0.08}s`
    };

    return (
        <div
            className={`pin${isMega ? ' mega' : ''} visible`}
            data-region={regionKey}
            style={style}
            onMouseEnter={(e) => onMouseEnter(e, deal)}
            onMouseLeave={onMouseLeave}
            onClick={(e) => onClick?.(deal, e)}
        >
            <div className={`pin-pill${showBadge ? ' visible' : ''}`}>
                {deal.disc >= 52 && (
                    <span className="fire">
                        <svg viewBox="0 0 24 24"><path d="M12 23c5.5 0 8-4.5 8-8.5 0-4-4-8.5-6-10.5-.5 2-2 4-4 4 0-3-2-7-3-8 0 3-3 7-3 11 0 1 0 2 .5 3-2-2-2.5-4-2.5-6-1 2-2 4-2 6.5C0 18.5 6.5 23 12 23z" /></svg>
                    </span>
                )}
                -{deal.disc}%
            </div>
            <div className="pin-stem"></div>
            <div className="pin-dot"></div>
        </div>
    );
}
