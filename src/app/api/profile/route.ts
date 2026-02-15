import { NextRequest, NextResponse } from "next/server";
import { ProfileService } from "@/features/profile/profile.service";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await ProfileService.get(user.id);
    return NextResponse.json(profile);
}

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    try {
        const updatedProfile = await ProfileService.update(user.id, body);
        return NextResponse.json(updatedProfile);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
