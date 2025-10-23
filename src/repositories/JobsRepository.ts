import { ApiService } from "#api/ApiService.js";
import { AiSummary, CreateJobParams, Job, JobStatus, Ready } from "#core/models/Job.js";
import { CreateJobDTO, JobDTO, jobSchemaDTO, JobsReadyDTO, jobWorkerResultSchema } from "#api/types.js";
import { logger } from "#core/logger.js";
import { Sticker } from "grammy/types";

export interface IJobsRepository {
    createJob(data: CreateJobParams): Promise<Job>; 
    findReady(): Promise<Ready>;
    findById(id: number): Promise<Job | null>;
    updateStatus(id: number, status: JobStatus): Promise<void>; // Обновляет статус задачи
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

    public async findReady(): Promise<Ready> {
        const ready = await this.apiService.getJobsDone()
        // Для каждого ID получаем полную информацию о задаче
        const jobs: Job[] = (await Promise.all(
            ready.readyJobs.map((job) => this.findById(job.jobId)),
        )).filter((job): job is Job => job !== null);
    
        const summaries: AiSummary[] = ready.readySummaries.map(summary => {
            return {
                jobId: summary.jobId,
                userId: summary.userId,
                url: summary.url,
                ai_summary: summary.ai_summary
            }
        })

        return {
            readyJobs: jobs,
            readySummaries: summaries
        };
    }

    public async findById(id: number): Promise<Job | null> {
        const dto = await this.apiService.getJob(id);
        if (!dto) {
            return null;
        }
        // ВЫПОЛНЯЕМ МАППИНГ ИЗ DTO В МОДЕЛЬ
        return this.mapGetDtoToModel(dto);
    }

    public async updateStatus(id: number, status: string): Promise<void> {
        await this.apiService.updateJobStatus(id, status);
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
            ai_summary: dto.ai_summary || null,
            settings: {
                ai_summary: dto.settings.ai_summary,
                techstack: dto.settings.techstack,
                links: dto.settings.links,
                seo: dto.settings.seo,
                lighthouse: dto.settings.lighthouse
            }
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
            ai_summary: null,
            settings: null
        };
    }
}
