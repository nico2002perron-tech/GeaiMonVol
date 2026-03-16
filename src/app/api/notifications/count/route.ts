import { NextResponse } from 'next/server';
import { getUnreadCount } from '@/features/notifications/notification.repository';

export async function GET() {
    try {
        const counts = await getUnreadCount();
        return NextResponse.json(counts, {
            headers: {
                'Cache-Control': 'private, no-cache',
            },
        });
    } catch (error: any) {
        if (error.message?.includes('not authenticated') || error.code === 'PGRST301') {
            return NextResponse.json({ unread: 0, total: 0 });
        }
        return NextResponse.json({ unread: 0, total: 0 });
    }
}
