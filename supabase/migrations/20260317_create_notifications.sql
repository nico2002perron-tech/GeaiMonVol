-- Notifications table for inbox system
-- Stores deal matches, price drops, watchlist alerts

CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deal_match', 'price_drop', 'watchlist_alert', 'expedition_new', 'system')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    destination TEXT,
    destination_code TEXT,
    deal_price NUMERIC,
    deal_discount INTEGER,
    deal_level TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_user_date ON notifications(user_id, created_at DESC);

-- RLS: users can only see/modify their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_service" ON notifications
    FOR INSERT WITH CHECK (true);

-- Add last_notification_read_at to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_notification_read_at TIMESTAMPTZ;
