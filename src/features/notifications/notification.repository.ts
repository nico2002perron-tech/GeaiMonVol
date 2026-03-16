import { createServerSupabase } from '@/lib/supabase/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import type { Notification, CreateNotificationInput, NotificationCounts } from './notification.types';

// ── User-scoped queries (use server client with RLS) ──

export async function getNotifications(
    page = 1,
    limit = 20
): Promise<{ notifications: Notification[]; total: number }> {
    const supabase = await createServerSupabase();
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return { notifications: (data || []) as Notification[], total: count || 0 };
}

export async function getUnreadCount(): Promise<NotificationCounts> {
    const supabase = await createServerSupabase();

    const { count: unread } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

    const { count: total } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });

    return { unread: unread || 0, total: total || 0 };
}

export async function markAsRead(notificationId: string): Promise<void> {
    const supabase = await createServerSupabase();
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) throw error;
}

export async function markAllAsRead(): Promise<void> {
    const supabase = await createServerSupabase();
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);

    if (error) throw error;
}

// ── Admin operations (service role, no RLS) ──

export async function createNotification(input: CreateNotificationInput): Promise<void> {
    const supabase = createAdminSupabase();
    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: input.user_id,
            type: input.type,
            title: input.title,
            body: input.body,
            destination: input.destination || null,
            destination_code: input.destination_code || null,
            deal_price: input.deal_price || null,
            deal_discount: input.deal_discount || null,
            deal_level: input.deal_level || null,
            metadata: input.metadata || {},
        });

    if (error) {
        console.error('[Notifications] Insert error:', error);
        throw error;
    }
}

export async function createNotificationsBatch(inputs: CreateNotificationInput[]): Promise<number> {
    if (inputs.length === 0) return 0;
    const supabase = createAdminSupabase();

    const records = inputs.map(input => ({
        user_id: input.user_id,
        type: input.type,
        title: input.title,
        body: input.body,
        destination: input.destination || null,
        destination_code: input.destination_code || null,
        deal_price: input.deal_price || null,
        deal_discount: input.deal_discount || null,
        deal_level: input.deal_level || null,
        metadata: input.metadata || {},
    }));

    const { error } = await supabase
        .from('notifications')
        .insert(records);

    if (error) {
        console.error('[Notifications] Batch insert error:', error);
        return 0;
    }

    return records.length;
}

export async function deleteOldNotifications(daysOld = 90): Promise<number> {
    const supabase = createAdminSupabase();
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoff)
        .select('id');

    if (error) {
        console.error('[Notifications] Delete old error:', error);
        return 0;
    }

    return data?.length || 0;
}
