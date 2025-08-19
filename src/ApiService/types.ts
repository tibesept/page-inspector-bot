import { z } from "zod";

// SCHEMAS
export const createJobBodySchema = z.object({
    userId: z.number(),
    url: z.string(),
    type: z.number(),
    depth: z.number().int(),
});

export const jobSchema = z.object({
    userId: z.number(),
    jobId: z.number(),
    status: z.string(),
});

export const JobsDoneSchema = z.array(jobSchema);

export const userSchema = z.object({
    userId: z.number(),
    balance: z.number(),
});

// TYPES
export type CreateJobBody = z.infer<typeof createJobBodySchema>;
export type Job = z.infer<typeof jobSchema>;
export type JobsDone = z.infer<typeof JobsDoneSchema>;
export type User = z.infer<typeof userSchema>;