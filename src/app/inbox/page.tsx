'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth/AuthProvider';
import { DEAL_LEVELS } from '@/lib/constants/deals';

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    destination: string | null;
    destination_code: string | null;
    deal_price: number | null;
    deal_discount: number | null;
    deal_level: string | null;
    metadata: Record<string, any>;
    is_read: boolean;
    created_at: string;
}

export default function InboxPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const isPremium = profile?.plan === 'premium';

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchNotifs = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/notifications?page=${page}&limit=20`);
            const data = await res.json();
            setNotifications(data.notifications || []);
            setTotal(data.total || 0);
        } catch {}
        setLoading(false);
    }, [user, page]);

    useEffect(() => {
        fetchNotifs();
    }, [fetchNotifs]);

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true }),
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch {}
    };

    const markRead = async (id: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id }),
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch {}
    };

    const groupByDate = (notifs: Notification[]) => {
        const groups: Record<string, Notification[]> = {};
        for (const n of notifs) {
            const day = n.created_at.slice(0, 10);
            if (!groups[day]) groups[day] = [];
            groups[day].push(n);
        }
        return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
    };

    const formatDate = (dateStr: string) => {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (dateStr === today) return "Aujourd'hui";
        if (dateStr === yesterday) return 'Hier';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Not logged in
    if (!authLoading && !user) {
        return (
            <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
                <Navbar dark />
                <div style={{
                    maxWidth: 500,
                    margin: '0 auto',
                    padding: '120px 16px 40px',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
                    <h1 style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: '#0F172A',
                        fontFamily: "'Fredoka', sans-serif",
                        marginBottom: 8,
                    }}>
                        Boîte de réception
                    </h1>
                    <p style={{
                        fontSize: 14,
                        color: '#64748B',
                        fontFamily: "'Outfit', sans-serif",
                        marginBottom: 24,
                    }}>
                        Connecte-toi pour recevoir des alertes personnalisées sur les meilleurs deals.
                    </p>
                    <Link href="/auth" style={{
                        display: 'inline-block',
                        padding: '12px 28px',
                        background: '#0F172A',
                        color: '#fff',
                        borderRadius: 12,
                        fontWeight: 700,
                        fontSize: 14,
                        textDecoration: 'none',
                        fontFamily: "'Outfit', sans-serif",
                    }}>
                        Se connecter
                    </Link>
                </div>
            </div>
        );
    }

    const grouped = groupByDate(notifications);

    // Free users: show first 2 notifs, blur the rest
    const FREE_VISIBLE_LIMIT = 2;

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
            <Navbar dark />

            <main style={{
                maxWidth: 640,
                margin: '0 auto',
                padding: '90px 16px 40px',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 24,
                }}>
                    <div>
                        <h1 style={{
                            fontSize: 24,
                            fontWeight: 800,
                            color: '#0F172A',
                            fontFamily: "'Fredoka', sans-serif",
                            margin: 0,
                        }}>
                            🔔 Boîte de réception
                        </h1>
                        <p style={{
                            fontSize: 13,
                            color: '#64748B',
                            fontFamily: "'Outfit', sans-serif",
                            margin: '4px 0 0',
                        }}>
                            {total} notification{total !== 1 ? 's' : ''}{unreadCount > 0 ? ` · ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : ''}
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            style={{
                                background: '#F0F9FF',
                                border: '1px solid #BAE6FD',
                                borderRadius: 10,
                                padding: '8px 16px',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#0284C7',
                                fontFamily: "'Outfit', sans-serif",
                            }}
                        >
                            Tout marquer lu
                        </button>
                    )}
                </div>

                {/* Loading */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: 48, color: '#94A3B8', fontSize: 14 }}>
                        Chargement...
                    </div>
                )}

                {/* Empty state */}
                {!loading && notifications.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '48px 24px',
                        background: '#fff',
                        borderRadius: 16,
                        border: '1px solid #E2E8F0',
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                        <div style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#0F172A',
                            fontFamily: "'Fredoka', sans-serif",
                            marginBottom: 8,
                        }}>
                            Aucune notification
                        </div>
                        <div style={{
                            fontSize: 13,
                            color: '#64748B',
                            fontFamily: "'Outfit', sans-serif",
                        }}>
                            Les deals qui correspondent à tes préférences apparaîtront ici.
                        </div>
                    </div>
                )}

                {/* Notification groups */}
                {!loading && grouped.map(([date, notifs]) => {
                    let visibleCount = 0;
                    return (
                        <div key={date} style={{ marginBottom: 24 }}>
                            <div style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#94A3B8',
                                fontFamily: "'Outfit', sans-serif",
                                marginBottom: 8,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                            }}>
                                {formatDate(date)}
                            </div>

                            <div style={{
                                background: '#fff',
                                borderRadius: 16,
                                border: '1px solid #E2E8F0',
                                overflow: 'hidden',
                            }}>
                                {notifs.map((notif, idx) => {
                                    visibleCount++;
                                    const isFreeBlurred = !isPremium && visibleCount > FREE_VISIBLE_LIMIT;
                                    const level = notif.deal_level ? DEAL_LEVELS[notif.deal_level] : null;
                                    const time = new Date(notif.created_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <div
                                            key={notif.id}
                                            onClick={() => !isFreeBlurred && !notif.is_read && markRead(notif.id)}
                                            style={{
                                                padding: '14px 16px',
                                                borderBottom: idx < notifs.length - 1 ? '1px solid #F1F5F9' : 'none',
                                                background: notif.is_read ? 'transparent' : '#F0F9FF',
                                                cursor: isFreeBlurred ? 'default' : 'pointer',
                                                filter: isFreeBlurred ? 'blur(4px)' : 'none',
                                                userSelect: isFreeBlurred ? 'none' : 'auto',
                                                pointerEvents: isFreeBlurred ? 'none' : 'auto',
                                                transition: 'background 0.15s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                                {/* Deal level dot */}
                                                <span style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    background: level?.bg || '#CBD5E1',
                                                    flexShrink: 0,
                                                    marginTop: 4,
                                                }} />

                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        marginBottom: 2,
                                                    }}>
                                                        <span style={{
                                                            fontSize: 14,
                                                            fontWeight: notif.is_read ? 500 : 700,
                                                            color: '#0F172A',
                                                            fontFamily: "'Outfit', sans-serif",
                                                        }}>
                                                            {notif.title}
                                                        </span>
                                                        {level && (
                                                            <span style={{
                                                                fontSize: 10,
                                                                fontWeight: 700,
                                                                padding: '2px 8px',
                                                                borderRadius: 100,
                                                                background: level.bg,
                                                                color: level.textColor || '#fff',
                                                            }}>
                                                                {level.icon} {level.label}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div style={{
                                                        fontSize: 12,
                                                        color: '#64748B',
                                                        fontFamily: "'Outfit', sans-serif",
                                                        marginBottom: 4,
                                                    }}>
                                                        {notif.body}
                                                    </div>

                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                    }}>
                                                        <span style={{
                                                            fontSize: 10,
                                                            color: '#94A3B8',
                                                            fontFamily: "'Outfit', sans-serif",
                                                        }}>
                                                            {time}
                                                        </span>
                                                        {notif.destination_code && (
                                                            <Link
                                                                href={`/destination/${notif.destination_code}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                style={{
                                                                    fontSize: 11,
                                                                    color: '#0EA5E9',
                                                                    fontWeight: 600,
                                                                    textDecoration: 'none',
                                                                    fontFamily: "'Outfit', sans-serif",
                                                                }}
                                                            >
                                                                Voir le deal &rarr;
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Price */}
                                                {notif.deal_price && (
                                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                        <div style={{
                                                            fontSize: 18,
                                                            fontWeight: 800,
                                                            color: '#059669',
                                                            fontFamily: "'Fredoka', sans-serif",
                                                        }}>
                                                            {Math.round(notif.deal_price)}$
                                                        </div>
                                                        {notif.deal_discount && notif.deal_discount > 0 && (
                                                            <div style={{
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                color: '#059669',
                                                                fontFamily: "'Fredoka', sans-serif",
                                                            }}>
                                                                -{notif.deal_discount}%
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* Free user upsell overlay */}
                {!isPremium && notifications.length > FREE_VISIBLE_LIMIT && (
                    <div style={{
                        background: 'linear-gradient(135deg, #FFFDF5, #FFF7ED)',
                        border: '1px solid rgba(255,190,60,0.3)',
                        borderRadius: 16,
                        padding: '24px 20px',
                        textAlign: 'center',
                        marginTop: -12,
                    }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
                        <div style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#8B6914',
                            fontFamily: "'Fredoka', sans-serif",
                            marginBottom: 6,
                        }}>
                            {notifications.length - FREE_VISIBLE_LIMIT} notification{notifications.length - FREE_VISIBLE_LIMIT > 1 ? 's' : ''} cachée{notifications.length - FREE_VISIBLE_LIMIT > 1 ? 's' : ''}
                        </div>
                        <div style={{
                            fontSize: 13,
                            color: '#64748B',
                            fontFamily: "'Outfit', sans-serif",
                            marginBottom: 16,
                        }}>
                            Passe Premium pour recevoir toutes les alertes personnalisées et ne manquer aucun deal.
                        </div>
                        <Link href="/pricing" style={{
                            display: 'inline-block',
                            padding: '12px 28px',
                            background: '#0F172A',
                            color: '#FFD700',
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: 14,
                            textDecoration: 'none',
                            fontFamily: "'Outfit', sans-serif",
                        }}>
                            ⭐ Passer Premium — 4,99$/mois
                        </Link>
                    </div>
                )}

                {/* Pagination */}
                {total > 20 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 8,
                        marginTop: 24,
                    }}>
                        {page > 1 && (
                            <button
                                onClick={() => setPage(p => p - 1)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 10,
                                    border: '1px solid #E2E8F0',
                                    background: '#fff',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontFamily: "'Outfit', sans-serif",
                                }}
                            >
                                &larr; Précédent
                            </button>
                        )}
                        {page * 20 < total && (
                            <button
                                onClick={() => setPage(p => p + 1)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 10,
                                    border: '1px solid #E2E8F0',
                                    background: '#fff',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontFamily: "'Outfit', sans-serif",
                                }}
                            >
                                Suivant &rarr;
                            </button>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
