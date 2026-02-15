"use client";
import { useEffect, useRef } from "react";

export default function ParticlesBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext("2d");
        if (!ctx) return;

        let W = 0, H = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const particles: any[] = [];

        const resize = () => {
            W = c.width = window.innerWidth;
            H = c.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        for (let i = 0; i < 35; i++) {
            particles.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: Math.random() * 2.5 + 1,
                dx: (Math.random() - 0.5) * 0.3,
                dy: (Math.random() - 0.5) - 0.15,
                o: Math.random() * 0.35 + 0.1,
                color:
                    Math.random() > 0.7 ? "rgba(234,111,34," : "rgba(60,131,213,",
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            particles.forEach((p) => {
                p.x += p.dx;
                p.y += p.dy;
                if (p.x < 0) p.x = W;
                if (p.x > W) p.x = 0;
                if (p.y < 0) p.y = H;
                if (p.y > H) p.y = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = p.color + p.o + ")";
                ctx.fill();
            });
            // Connect nearby particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle =
                            "rgba(60,131,213," + 0.06 * (1 - d / 120) + ")";
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(draw);
        };
        const af = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(af);
        };
    }, []);

    return (
        <canvas
            id="particles"
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 0,
                opacity: 0.4,
            }}
        ></canvas>
    );
}
