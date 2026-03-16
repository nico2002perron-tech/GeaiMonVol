'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import Link from 'next/link';
import { DEAL_LEVELS } from '@/lib/constants/deals';

interface NotifItem {
    id: string;
    type: string;
    title: string;
    body: string;
    destination_code: string | null;
    deal_level: string | null;
    is_read: boolean;
    created_at: string;
}

export default function NotificationBell() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotifItem[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Poll unread count
    const fetchCount = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch('/api/notifications/count');
            const data = await res.json();
            setUnreadCount(data.unread || 0);
        } catch {}
    }, [user]);

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 60000);
        return () => clearInterval(interval);
    }, [fetchCount]);

    // Fetch latest notifications when dropdown opens
    const openDropdown = async () => {
        setIsOpen(true);
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch('/api/notifications?limit=5');
            const data = await res.json();
            setNotifications(data.notifications || []);
        } catch {}
        setLoading(false);
    };

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    // Mark all as read
    const handleMarkAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true }),
            });
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch {}
    };

    if (!user) return null;

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}j`;
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-flex' }}>
            {/* Bell button */}
            <button
                onClick={() => isOpen ? setIsOpen(false) : openDropdown()}
                style={{
                    position: 'relative',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                aria-label="Notifications"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>

                {/* Unread badge */}
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        background: '#EF4444',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: "'Fredoka', sans-serif",
                        minWidth: 16,
                        height: 16,
                        borderRadius: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                        lineHeight: 1,
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 340,
                    maxHeight: 420,
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    zIndex: 1000,
                    animation: 'notifFadeIn 0.2s ease-out',
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderBottom: '1px solid #F1F5F9',
                    }}>
                        <span style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#0F172A',
                            fontFamily: "'Outfit', sans-serif",
                        }}>
                            Notifications
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    color: '#0EA5E9',
                                    fontWeight: 600,
                                    fontFamily: "'Outfit', sans-serif",
                                }}
                            >
                                Tout marquer lu
                            </button>
                        )}
                    </div>

                    {/* Notification list */}
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                        {loading && (
                            <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                                Chargement...
                            </div>
                        )}

                        {!loading && notifications.length === 0 && (
                            <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>
                                Aucune notification
                            </div>
                        )}

                        {!loading && notifications.map(notif => {
                            const level = notif.deal_level ? DEAL_LEVELS[notif.deal_level] : null;
                            return (
                                <Link
                                    key={notif.id}
                                    href={notif.destination_code ? `/destination/${notif.destination_code}` : '/inbox'}
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                        display: 'block',
                                        padding: '12px 16px',
                                        borderBottom: '1px solid #F8FAFC',
                                        textDecoration: 'none',
                                        background: notif.is_read ? 'transparent' : '#F0F9FF',
                                        transition: 'background 0.15s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                        {/* Level dot */}
                                        <span style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: level?.bg || '#CBD5E1',
                                            flexShrink: 0,
                                            marginTop: 5,
                                        }} />

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: 13,
                                                fontWeight: notif.is_read ? 500 : 700,
                                                color: '#0F172A',
                                                fontFamily: "'Outfit', sans-serif",
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {notif.title}
                                            </div>
                                            <div style={{
                                                fontSize: 11,
                                                color: '#64748B',
                                                fontFamily: "'Outfit', sans-serif",
                                                marginTop: 2,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {notif.body}
                                            </div>
                                        </div>

                                        <span style={{
                                            fontSize: 10,
                                            color: '#94A3B8',
                                            fontFamily: "'Outfit', sans-serif",
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0,
                                        }}>
                                            {timeAgo(notif.created_at)}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <Link
                        href="/inbox"
                        onClick={() => setIsOpen(false)}
                        style={{
                            display: 'block',
                            padding: '12px 16px',
                            textAlign: 'center',
                            borderTop: '1px solid #F1F5F9',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#0EA5E9',
                            textDecoration: 'none',
                            fontFamily: "'Outfit', sans-serif",
                        }}
                    >
                        Voir tout &rarr;
                    </Link>
                </div>
            )}

            <style>{`
                @keyframes notifFadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
