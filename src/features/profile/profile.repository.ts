import { createClient } from "@/lib/supabase/server";
import { Profile } from "./profile.schema";

export async function getProfile(userId: string): Promise<Profile | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) return null;
    return data as Profile;
}

export async function updateProfile(userId: string, profile: Partial<Profile>) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", userId);

    if (error) throw new Error(error.message);
}
