'use client';
import { useEffect, useState } from 'react';

interface ConfettiProps {
    trigger: number; // increment to trigger
    x?: number;
    y?: number;
}

const COLORS = ['#2E7DDB', '#F59E0B', '#EF4444', '#4ADE80', '#E8466A', '#8B5CF6'];

export default function Confetti({ trigger, x = 0, y = 0 }: ConfettiProps) {
    const [particles, setParticles] = useState<any[]>([]);

    useEffect(() => {
        if (trigger <= 0) return;

        const newParticles = Array.from({ length: 20 }).map((_, i) => ({
            id: Date.now() + i,
            x: x || window.innerWidth / 2,
            y: y || window.innerHeight / 2,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            angle: (Math.random() * 360) * (Math.PI / 180),
            velocity: Math.random() * 6 + 4,
            spin: Math.random() * 360,
            size: Math.random() * 6 + 4,
            shape: Math.random() > 0.5 ? 'circle' : 'rect',
        }));

        setParticles(newParticles);
        setTimeout(() => setParticles([]), 1500);
    }, [trigger]);

    if (particles.length === 0) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0,
            pointerEvents: 'none', zIndex: 9999,
            overflow: 'hidden',
        }}>
            {particles.map((p) => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        left: p.x,
                        top: p.y,
                        width: p.shape === 'circle' ? p.size : p.size * 0.6,
                        height: p.size,
                        background: p.color,
                        borderRadius: p.shape === 'circle' ? '50%' : 2,
                        animation: `confettiFly 1.2s cubic-bezier(.25, .46, .45, .94) forwards`,
                        transform: `rotate(${p.spin}deg)`,
                        '--tx': `${Math.cos(p.angle) * p.velocity * 30}px`,
                        '--ty': `${Math.sin(p.angle) * p.velocity * 30 - 100}px`,
                    } as any}
                />
            ))}
            <style>{`
                @keyframes confettiFly {
                    0% {
                        transform: translate(0, 0) rotate(0deg) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(var(--tx), var(--ty)) rotate(720deg) scale(0);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
}
