import { z } from "zod";

// SCHEMAS
export const createJobBodySchema = z.object({
    user_id: z.number(),
    url: z.string(),
    type: z.number(),
    depth: z.number().int(),
});

export const jobSchema = z.object({
    jobId: z.number(),
    status: z.string(),
});

export const userSchema = z.object({
    userId: z.number(),
    balance: z.number(),
});

// TYPES
export type CreateJobBody = z.infer<typeof createJobBodySchema>;
export type Job = z.infer<typeof jobSchema>;
export type User = z.infer<typeof userSchema>;