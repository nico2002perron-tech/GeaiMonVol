import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { secret } = await request.json();

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Trigger the scan
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://geai-mon-vol.vercel.app';

    try {
        const res = await fetch(`${baseUrl}/api/cron/scan-prices`, {
            method: 'GET',
            headers: { 'x-cron-secret': process.env.CRON_SECRET || '' },
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
