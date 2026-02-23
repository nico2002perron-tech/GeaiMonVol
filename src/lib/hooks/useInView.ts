'use client';
import { useState, useEffect, RefObject } from 'react';

export function useInView(
    ref: RefObject<HTMLDivElement | null>,
    options?: { threshold?: number; rootMargin?: string; once?: boolean }
) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const obs = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) {
                    setVisible(true);
                    if (options?.once !== false) obs.disconnect();
                }
            },
            {
                threshold: options?.threshold ?? 0.15,
                rootMargin: options?.rootMargin ?? '0px 0px -30px 0px',
            }
        );

        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return visible;
}
