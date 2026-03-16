import { NextRequest, NextResponse } from 'next/server';
import { getNotifications, markAsRead, markAllAsRead } from '@/features/notifications/notification.repository';

export async function GET(req: NextRequest) {
    try {
        const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10);
        const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20', 10), 50);

        const result = await getNotifications(page, limit);
        return NextResponse.json(result);
    } catch (error: any) {
        if (error.message?.includes('not authenticated') || error.code === 'PGRST301') {
            return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { notificationId, markAll } = body;

        if (markAll) {
            await markAllAsRead();
            return NextResponse.json({ success: true, action: 'mark_all_read' });
        }

        if (notificationId) {
            await markAsRead(notificationId);
            return NextResponse.json({ success: true, action: 'mark_read', id: notificationId });
        }

        return NextResponse.json({ error: 'Missing notificationId or markAll' }, { status: 400 });
    } catch (error: any) {
        if (error.message?.includes('not authenticated') || error.code === 'PGRST301') {
            return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
