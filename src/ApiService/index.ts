// src/api/api-service.ts
import { _apiHttpClient } from "../HttpClient";
import {
    CreateJobBody,
    Job,
    User,
    createJobBodySchema,
    jobSchema,
    userSchema,
} from "./types";

type HttpClient = typeof _apiHttpClient;

/**
 * Позволяет удобно отправлять HTTP запросы в API
 */
class ApiService {
    constructor(private readonly client: HttpClient) {}

    // JOBS
    public createJob(body: CreateJobBody): Promise<Job> {
        createJobBodySchema.parse(body); // валидация
        return this.client.post("/createJob", body, jobSchema);
    }

    public getJob(id: number): Promise<Job> {
        return this.client.get(`/getJob/${id}`, jobSchema);
    }

    // USER
    public getUser(id: number): Promise<User> {
        return this.client.get(`/user/${id}`, userSchema);
    }

    public createUser(id: number): Promise<User> {
        return this.client.post(`/user/${id}`, {}, userSchema);
    }
}

/**
 * Единственный экземпляр ApiService, который используется ботом
 * он создается с единственным экземпляром http клиента.
 */
export const apiService = new ApiService(_apiHttpClient);
