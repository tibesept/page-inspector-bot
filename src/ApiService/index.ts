import { _apiHttpClient } from "../HttpClient";
import {
    CreateJobBody,
    createJobBodySchema,
    CreateJobDTO,
    JobDTO,
    jobSchemaDTO,
    JobsReadyDTO,
    jobsReadySchemaDTO,
    postJobSchemaDTO,
    UserDTO,
    userSchemaDTO,
} from "../types";

type HttpClient = typeof _apiHttpClient;

/**
 * Позволяет удобно отправлять HTTP запросы в API
 */
class ApiService {
    constructor(private readonly client: HttpClient) {}

    // JOBS
    public getJobsDone(): Promise<JobsReadyDTO> {
        return this.client.get(`/jobs/ready`, jobsReadySchemaDTO);
    }

    public getJob(id: number): Promise<JobDTO> {
        return this.client.get(`/jobs/${id}`, jobSchemaDTO);
    }

    public createJob(body: CreateJobBody): Promise<JobDTO> {
        createJobBodySchema.parse(body); // валидация body
        return this.client.post("/jobs", body, jobSchemaDTO);
    }

    public markJobAsSent(id: number): Promise<CreateJobDTO> {
        return this.client.put(`/jobs/sent/${id}`, {}, postJobSchemaDTO);
    }


    // USER
    public getUser(id: number): Promise<UserDTO> {
        return this.client.get(`/users/${id}`, userSchemaDTO);
    }
}

/**
 * Единственный экземпляр ApiService, который используется ботом
 * он создается с единственным экземпляром http клиента.
 */
export const apiService = new ApiService(_apiHttpClient);
