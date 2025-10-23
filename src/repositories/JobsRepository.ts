import { ApiService } from "#api/ApiService.js";
import { CreateJobParams, Job, JobStatus } from "#core/models/Job.js";
import { CreateJobDTO, JobDTO, jobSchemaDTO, JobsReadyDTO, jobWorkerResultSchema } from "#api/types.js";
import { logger } from "#core/logger.js";

export interface IJobsRepository {
    createJob(data: CreateJobParams): Promise<Job>; 
    findReady(): Promise<Job[]>;
    findById(id: number): Promise<Job | null>;
    updateStatus(id: number /*status: JobStatus*/): Promise<void>; // Обновляет статус задачи
}

export class JobsRepository implements IJobsRepository {
    constructor(private readonly apiService: ApiService) {}

    public async createJob(data: CreateJobParams): Promise<Job> {
        const dto = await this.apiService.createJob({
            userId: data.userId,
            url: data.url,
            type: data.type,
            settings: data.settings
        });
        return this.mapPostDtoToModel(dto);
    }

    public async findReadyIds(): Promise<number[]> {
        const readyJobsDTO = await this.apiService.getJobsDone();
        return readyJobsDTO.map((job) => job.jobId);
    }

    public async findReady(): Promise<Job[]> {
        const readyJobIds = await this.findReadyIds();
        // Для каждого ID получаем полную информацию о задаче
        const jobs = await Promise.all(
            readyJobIds.map((id) => this.findById(id)),
        );
        // Отфильтровываем те, которые по какой-то причине не удалось получить
        return jobs.filter((job): job is Job => job !== null);
    }

    public async findById(id: number): Promise<Job | null> {
        const dto = await this.apiService.getJob(id);
        if (!dto) {
            return null;
        }
        // ВЫПОЛНЯЕМ МАППИНГ ИЗ DTO В МОДЕЛЬ
        return this.mapGetDtoToModel(dto);
    }

    // TODO: обновление статуса должно принимать статус
    public async updateStatus(id: number): Promise<void> {
        await this.apiService.markJobAsSent(id);
    }





    private mapGetDtoToModel(dto: JobDTO): Job {
        if (!dto) throw new Error("Cannot map null DTO to model");

        return {
            jobId: dto.jobId,
            userId: dto.userId,
            url: dto.url,
            // Приводим строку к нашему строгому типу
            status: dto.status as JobStatus,
            // Парсим JSON-строку. Если она пустая или некорректная, возвращаем null.
            result: dto.result ? jobWorkerResultSchema.parse(JSON.parse(dto.result)) : null,
        };
    }

    private mapPostDtoToModel(dto: CreateJobDTO): Job {
        if (!dto) throw new Error("Cannot map null DTO to model");

        return {
            jobId: dto.jobId,
            userId: dto.userId,
            url: null,
            // Приводим строку к нашему строгому типу
            status: dto.status as JobStatus,
            // Парсим JSON-строку. Если она пустая или некорректная, возвращаем null.
            result: null,
        };
    }
}
