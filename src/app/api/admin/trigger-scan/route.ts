import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { secret } = await request.json();

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Trigger the scan
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://geai-mon-vol.vercel.app';
    const scanUrl = `${baseUrl}/api/cron/scan-prices?secret=${process.env.CRON_SECRET}`;

    try {
        const res = await fetch(scanUrl);
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
