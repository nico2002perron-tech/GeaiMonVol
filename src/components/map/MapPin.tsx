'use client';

import React from 'react';
import { Flight } from '@/lib/data/flights';

interface MapPinProps {
    deal: Flight;
    regionKey: string;
    x: number;
    y: number;
    index: number;
    onMouseEnter: (e: React.MouseEvent, deal: Flight) => void;
    onMouseLeave: () => void;
    onClick: (regionKey: string) => void;
}

export default function MapPin({ deal, regionKey, x, y, index, onMouseEnter, onMouseLeave, onClick }: MapPinProps) {
    const isMega = deal.price < 400; // Simplified logic, adapt based on 'disc' if available
    // Note: Legacy code used deal.disc >= 52 for mega. We'll need disc in Flight interface if used.

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
            onClick={() => onClick(regionKey)}
        >
            <div className="pin-pill">-{/*Placeholder for disc*/}%</div>
            <div className="pin-stem"></div>
            <div className="pin-dot"></div>
        </div>
    );
}
