'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';

/**
 * Direct checkout hook — calls /api/checkout and redirects to Stripe.
 * If user is not logged in, redirects to /auth first.
 */
export function useCheckout() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    async function checkout() {
        if (!user) {
            const returnPath = typeof window !== 'undefined' ? window.location.pathname : '/';
            window.location.href = `/auth?redirect=${encodeURIComponent(returnPath)}`;
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/checkout', { method: 'POST' });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch {
            setLoading(false);
        }
    }

    return { checkout, loading };
}
