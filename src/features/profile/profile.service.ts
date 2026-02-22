import { getProfile, updateProfile } from "./profile.repository";
import { ProfileSchema, Profile } from "./profile.schema";

export const ProfileService = {
    async get(userId: string) {
        return await getProfile(userId);
    },

    async update(userId: string, data: Partial<Profile>) {
        // Validate input partial
        const validated = ProfileSchema.partial().parse(data);
        await updateProfile(userId, validated);
        return validated;
    }
};
