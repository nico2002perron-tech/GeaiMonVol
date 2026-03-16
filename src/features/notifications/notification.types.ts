export type NotificationType = 'deal_match' | 'price_drop' | 'watchlist_alert' | 'expedition_new' | 'system';

export type DealLevel = 'lowest_ever' | 'incredible' | 'great' | 'good' | 'slight' | 'normal';

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    body: string;
    destination: string | null;
    destination_code: string | null;
    deal_price: number | null;
    deal_discount: number | null;
    deal_level: DealLevel | null;
    metadata: Record<string, any>;
    is_read: boolean;
    created_at: string;
}

export interface NotificationWithContext extends Notification {
    matchReason?: string; // "Ta destination préférée!", "Correspond à ton budget!", etc.
}

export interface CreateNotificationInput {
    user_id: string;
    type: NotificationType;
    title: string;
    body: string;
    destination?: string;
    destination_code?: string;
    deal_price?: number;
    deal_discount?: number;
    deal_level?: string;
    metadata?: Record<string, any>;
}

export interface NotificationCounts {
    unread: number;
    total: number;
}
