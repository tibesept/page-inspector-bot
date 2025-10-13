import { ApiHttpClient } from "#api/HttpClient.js";
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
} from "#api/types.js";


/**
 * Позволяет удобно отправлять HTTP запросы в API
 */

// TODO: РАЗДЕЛЕНИЕ ОТВЕТСТВЕННОСТИ!!!!
// - Убрать ApiService 
// - Создать независимые репозитории JobRepository и UserRepository (получение данных из API в нужном формате)
// - Создать над ними сервисы JobService и UserService (бизнес-логика)
// - pollApi поместить в JobService (startPolling, stopPolling, poll) 
export class ApiService {
    constructor(private readonly client: ApiHttpClient) {}

    // JOBS
    public getJobsDone(): Promise<JobsReadyDTO> {
        return this.client.get(`/jobs/ready`, jobsReadySchemaDTO);
    }

    public getJob(id: number): Promise<JobDTO> {
        return this.client.get(`/jobs/${id}`, jobSchemaDTO);
    }

    public createJob(body: CreateJobBody): Promise<CreateJobDTO> {
        createJobBodySchema.parse(body); // валидация body
        return this.client.post("/jobs", body, postJobSchemaDTO);
    }

    public markJobAsSent(id: number): Promise<CreateJobDTO> {
        return this.client.put(`/jobs/sent/${id}`, {}, postJobSchemaDTO);
    }


    // USER
    public getUserById(id: number): Promise<UserDTO> {
        return this.client.get(`/users/${id}`, userSchemaDTO);
    }
}