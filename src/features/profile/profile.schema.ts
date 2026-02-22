import { z } from "zod";

export const ProfileSchema = z.object({
    id: z.string().uuid().optional(),
    email: z.string().email(),
    fullName: z.string().min(2).optional(),
    preferences: z.object({
        destinations: z.array(z.string()).default([]),
        budget: z.number().optional(),
        tripDuration: z.string().optional(), // 'weekend', '1-week', '2-weeks'
    }).default({ destinations: [] }),
    homeAirport: z.string().default('YUL'),
    createdAt: z.string().datetime().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;
