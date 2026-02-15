'use client';
import { useState } from 'react';

export default function MapTopbar() {
    const [dateOpen, setDateOpen] = useState(false);

    return (
        <div className="topbar">
            {/* Logo */}
            <div className="logo" style={{ pointerEvents: 'auto' }}>
                <div className="logo-mark"><svg viewBox="0 0 24 24"><path d="M3.64 14.26c-.24-.24-.24-.63 0-.87l6.36-6.36c.48-.48 1.12-.74 1.8-.74s1.32.26 1.8.74l3.06 3.06.18-2.04c.08-.72.64-1.28 1.36-1.36.72-.08 1.38.32 1.6 1l2.2 6.8c.16.48.06 1-.24 1.38-.3.38-.76.58-1.24.52l-7.08-1.08c-.72-.1-1.28-.66-1.36-1.38-.08-.72.32-1.38 1-1.6l2.14-.74-2.42-2.42c-.24-.24-.56-.36-.88-.36s-.64.12-.88.36L4.68 14.53c-.24.24-.63.24-.87 0l-.17-.27z" /></svg></div>
                Geai<span>Mon</span>Vol
                <button className="how-btn" id="howBtn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    Comment ça marche?
                </button>
            </div>

            {/* Nav */}
            <div className="nav" style={{ pointerEvents: 'auto' }}>
                <button className="nav-btn on">Carte</button>
                <button className="nav-btn">Top Deals</button>
                <a href="/pricing" className="nav-btn nav-premium">Premium</a>
            </div>

            {/* Right Side */}
            <div className="topbar-right" style={{ pointerEvents: 'auto' }}>
                <div className="origin-chip"><span className="origin-dot"></span>Depuis Montréal (YUL)</div>
                <div className="date-picker-wrap" id="dateWrap">
                    <div className="date-chip" id="dateChip" onClick={() => setDateOpen(!dateOpen)}>
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        <span id="dateLabel">Dates flexibles</span>
                    </div>
                    {/* Date Dropdown */}
                    <div className={`date-dropdown ${dateOpen ? 'open' : ''}`} id="dateDrop">
                        <div className="date-dropdown-title">Quand partez-vous?</div>
                        <div className="date-months" id="dateMonths">
                            {/* Placeholder for month selection logic */}
                            {['Mai', 'Juin', 'Juil', 'Aout', 'Sept', 'Oct'].map((m) => (
                                <div key={m} className="date-month">
                                    <span className="month-label">{m}</span>
                                    <span className="month-sub">dès 450$</span>
                                </div>
                            ))}
                        </div>
                        <div className="date-flex-row">
                            <input type="checkbox" className="date-flex-check" id="flexCheck" defaultChecked />
                            <label className="date-flex-label" htmlFor="flexCheck">Dates flexibles (+/- 3 jours)</label>
                            <button className="date-apply" id="dateApply">Appliquer</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
