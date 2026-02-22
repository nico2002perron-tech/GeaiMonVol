'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types/database';

interface AuthContext {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthCtx = createContext<AuthContext>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export function useAuth() {
    return useContext(AuthCtx);
}

// LocalStorage helpers for profile caching
const PROFILE_CACHE_KEY = 'geai_profile_cache';

function getCachedProfile(): Profile | null {
    try {
        const cached = localStorage.getItem(PROFILE_CACHE_KEY);
        if (!cached) return null;
        const parsed = JSON.parse(cached);
        // Cache valid for 1 hour
        if (Date.now() - parsed._cachedAt > 3600000) return null;
        const { _cachedAt, ...profile } = parsed;
        return profile as Profile;
    } catch { return null; }
}

function setCachedProfile(profile: Profile | null) {
    try {
        if (profile) {
            localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ ...profile, _cachedAt: Date.now() }));
        } else {
            localStorage.removeItem(PROFILE_CACHE_KEY);
        }
    } catch { }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const retryCount = useRef(0);
    const fetchingRef = useRef(false);

    const fetchProfile = useCallback(async (userId: string, retry = 0): Promise<void> => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // Ignore AbortError — happens on unmount/re-render
                if (error.message?.includes('AbortError') || error.message?.includes('aborted')) {
                    fetchingRef.current = false;
                    return;
                }
                console.warn('Profile fetch error:', error.message);
                // Retry up to 3 times with increasing delay
                if (retry < 3) {
                    fetchingRef.current = false;
                    await new Promise(r => setTimeout(r, 1000 * (retry + 1)));
                    return fetchProfile(userId, retry + 1);
                }
                // If all retries fail, use cached profile
                const cached = getCachedProfile();
                if (cached) {
                    setProfile(cached);
                }
                return;
            }

            const profileData = data as Profile;
            setProfile(profileData);
            setCachedProfile(profileData);
            retryCount.current = 0;
        } catch (err) {
            // Ignore AbortError — happens when component unmounts or re-renders
            if (err instanceof DOMException && err.name === 'AbortError') return;
            console.warn('Profile fetch exception:', err);
            // Use cache as fallback
            const cached = getCachedProfile();
            if (cached) {
                setProfile(cached);
            }
        } finally {
            fetchingRef.current = false;
        }
    }, [supabase]);

    const refreshProfile = useCallback(async () => {
        if (user) await fetchProfile(user.id);
    }, [user, fetchProfile]);

    useEffect(() => {
        // Load cached profile immediately (prevents flash of no-premium)
        const cached = getCachedProfile();
        if (cached) {
            setProfile(cached);
        }

        // Get initial session
        supabase.auth.getUser().then(({ data: { user: authUser } }) => {
            setUser(authUser);
            if (authUser) {
                fetchProfile(authUser.id);
            } else {
                setProfile(null);
                setCachedProfile(null);
            }
            setLoading(false);
        });

        // Listen for auth changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);

                if (currentUser) {
                    // Always re-fetch profile on auth change to ensure fresh data
                    await fetchProfile(currentUser.id);
                } else {
                    setProfile(null);
                    setCachedProfile(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [fetchProfile, supabase]);

    // Re-fetch profile when tab comes back to focus
    useEffect(() => {
        const handleFocus = () => {
            if (user) {
                fetchProfile(user.id);
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [user, fetchProfile]);

    // Periodic profile refresh every 15 minutes (for long sessions)
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => {
            fetchProfile(user.id);
        }, 15 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user, fetchProfile]);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setCachedProfile(null);
    }, [supabase]);

    return (
        <AuthCtx.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthCtx.Provider>
    );
}
