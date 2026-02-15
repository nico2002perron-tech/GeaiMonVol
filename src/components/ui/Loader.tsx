'use client';
import { useEffect, useState } from 'react';

export default function Loader() {
    const [done, setDone] = useState(false);

    useEffect(() => {
        // Legacy animation duration was ~2.2s
        const timer = setTimeout(() => setDone(true), 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div id="loader" className={done ? 'done' : ''}>
            <div className="loader-brand">Geai<span>Mon</span>Vol</div>
            <div className="loader-track"><div className="loader-fill"></div></div>
            <div className="loader-hint">Chargement de la carte...</div>
        </div>
    );
}
