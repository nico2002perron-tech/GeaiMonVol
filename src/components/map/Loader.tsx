'use client';
import { useEffect, useState } from 'react';

export default function Loader() {
    const [done, setDone] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDone(true), 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div id="loader" className={done ? 'done' : ''}>
            <div className="loader-brand">
                Geai<span>MonVol</span>
            </div>
            <div className="loader-track">
                <div className="loader-fill"></div>
            </div>
            <div className="loader-hint">Recherche des meilleurs deals...</div>
        </div>
    );
}
