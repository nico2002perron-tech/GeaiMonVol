'use client';
import { useEffect, useState, ReactNode } from 'react';

export default function ClientOnly({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div style={{
            width: '100vw',
            height: '100vh',
            background: '#F4F8FB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 24,
                fontWeight: 700,
                color: '#1A2B42',
            }}>
                Geai<span style={{ color: '#2E7DDB' }}>Mon</span>Vol
            </div>
        </div>;
    }

    return <>{children}</>;
}
