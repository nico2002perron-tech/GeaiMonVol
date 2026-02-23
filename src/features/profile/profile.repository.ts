import { createServerSupabase } from "@/lib/supabase/server";
import { Profile } from "./profile.schema";

export async function getProfile(userId: string): Promise<Profile | null> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) {
        console.error('Profile fetch error:', error.message);
        return null;
    }
    if (!data) return null;
    return data as Profile;
}

export async function updateProfile(userId: string, profile: Partial<Profile>) {
    const supabase = await createServerSupabase();
    const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", userId);

    if (error) throw new Error(error.message);
}
