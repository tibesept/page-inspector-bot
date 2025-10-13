import { JobWorkerResultDTO } from "#api/types.js"; // Мы можем переиспользовать тип результата

export type JobStatus = "pending" | "processing" | "completed" | "sent" | "failed";

/**
 * Доменная модель джобы
 * Эта модель используется в Service Layer (JobService)
 */
export interface Job {
    jobId: number;
    userId: number;
    url: string | null;
    status: JobStatus;
    
    /**
     * Результат выполнения задачи, уже распарсенный из JSON-строки.
     * Может быть null, если задача еще не выполнена.
     */
    result: JobWorkerResultDTO | null;
}

export interface CreateJobParams {
    userId: number;
    url: string;
    type: number;
    depth: number;
}