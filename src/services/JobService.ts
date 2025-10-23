import { Bot, InputFile } from "grammy";
import { z } from "zod";
import { IAnalyzerSettings, TMyContext } from "#types/state.js";
import { logger } from "#core/logger.js";
import { IJobsRepository } from "#repositories/JobsRepository.js";
import { Job } from "#core/models/Job.js";
import {
    JobAnalyzerSettingsDB,
    JobWorkerLighthouseResult,
    jobWorkerResultSchema,
    JobWorkerSeoResult,
} from "#api/types.js"; // DTO для результата

/**
 * Оркестрирует процесс получения и обработки задач из источника данных.
 */
export class JobService {
    private isPolling = false;
    private timerId: NodeJS.Timeout | null = null;

    constructor(
        private readonly bot: Bot<TMyContext>,
        private readonly jobsRepository: IJobsRepository,
        private readonly pollIntervalMs: number,
    ) {}

    /**
     * Запускает цикл поллинга для получения новых задач.
     */
    public startPolling(): void {
        if (this.isPolling) {
            logger.warn("Job polling is already running.");
            return;
        }

        logger.info("Starting job polling...");
        this.isPolling = true;
        this.poll();
    }

    /**
     * Останавливает цикл поллинга.
     */
    public stopPolling(): void {
        if (!this.isPolling) {
            logger.warn("Job polling is not running.");
            return;
        }

        logger.info("Stopping job polling...");
        this.isPolling = false;
        if (this.timerId) {
            clearTimeout(this.timerId);
        }
    }

    /**
     * Основной метод цикла, который получает и обрабатывает задачи.
     */
    private async poll(): Promise<void> {
        if (!this.isPolling) {
            return; // Выходим, если поллинг был остановлен
        }

        try {
            logger.debug("Polling for ready jobs...");
            const readyJobs = await this.jobsRepository.findReady();
            logger.debug(`Found ${readyJobs.length} jobs to process.`);

            // Обрабатываем каждую задачу параллельно
            await Promise.all(readyJobs.map((job) => this.processJob(job)));
        } catch (error) {
            logger.error(error, "An error occurred during the polling cycle.");
        } finally {
            // Планируем следующий вызов только если сервис все еще активен
            if (this.isPolling) {
                this.timerId = setTimeout(
                    () => this.poll(),
                    this.pollIntervalMs,
                );
            }
        }
    }

    /**
     * Обрабатывает одну задачу: отправляет результат пользователю и обновляет статус.
     */
    private async processJob(job: Job): Promise<void> {
        try {
            // Валидация данных задачи
            if (!job.result) {
                throw new Error(`Job ${job.jobId} has no result data.`);
            }
            if (job.status === "failed") {
                throw new Error(`Job ${job.jobId} has a failed status.`);
            }

            // Формирование сообщения
            const messageText = this.formatResultMessage(job.result);

            // Отправка фото с результатами
            await this.bot.api.sendPhoto(
                job.userId,
                new InputFile(
                    Buffer.from(job.result.screenshot, "base64"),
                    "analysis.jpeg",
                ),
                { caption: messageText, parse_mode: "HTML" },
            );

            // Отправка списка битых ссылок, если они есть

            let brokenLinksText = "";
            if (job.result.seo?.brokenLinks?.length) {
                brokenLinksText = `Найденные битые ссылки:\n${job.result.seo.brokenLinks.map((link) => `- ${link.url}`).join("\n")}`;
                await this.bot.api.sendMessage(job.userId, brokenLinksText);
            }

            // Пометка задачи как отправленной
            await this.jobsRepository.updateStatus(job.jobId);
            logger.info(
                `Successfully processed and sent job ${job.jobId} to user ${job.userId}.`,
            );
        } catch (error) {
            logger.error(error, `Failed to process job ${job.jobId}.`);
            // Если произошла ошибка, уведомляем пользователя и помечаем задачу как 'failed'
            if (job.userId) {
                await this.bot.api.sendMessage(
                    job.userId,
                    "Возникла непредвиденная ошибка при обработке вашего запроса.",
                );
                await this.jobsRepository.updateStatus(
                    job.jobId,
                    // "failed",
                    // (error as Error).message,
                );
            }
        }
    }

    public async createNewJob(data: {
        userId: number;
        url: string;
        analyzerSettings: IAnalyzerSettings;
    }): Promise<Job> {
        logger.info(
            `User ${data.userId} requested a new job for URL: ${data.url}`,
        );

        // TODO:
        // - Типы задач, глубина
        // - Проверка, есть ли у пользователя баланс
        // - Проверка, не создавал ли он такую же задачу 5 минут назад
        // - Списание денег

        const jobDataForRepo = {
            userId: data.userId,
            url: data.url,
            type: 1,
            settings: {
                depth: 1, // TODO: depth
                seo: data.analyzerSettings.seo,
                lighthouse: data.analyzerSettings.lighthouse,
                links: data.analyzerSettings.links,
                techstack: data.analyzerSettings.techstack
            }
        }

        // Делегируем создание репозиторию
        const createdJob = await this.jobsRepository.createJob(jobDataForRepo);

        return createdJob;
    }

    /**
     * Форматирует результат анализа в HTML-сообщение.
     */
    private formatResultMessage(
        result: z.infer<typeof jobWorkerResultSchema>,
    ): string {

        const seoBlock = result.seo ? this.formatSeoResult(result.seo) : `
🔎 <b>SEO-показатели:</b>
 - <code>Анализ не проводился</code>
`;

        const lighthouseBlock = result.lighthouse
            ? this.formatLighthouseResult(result.lighthouse)
            : `
⚡️ <b>Производительность (Lighthouse):</b>
 - <code>Анализ не проводился</code>
`;
        let techStackBlock = `💻 <b>Стек технологий:</b>
 - <code>Не определен</code>
`;

        if (result.techStack && result.techStack.length > 0) {
            techStackBlock = `💻 <b>Стек технологий:</b>
${result.techStack.map((tech) => ` - <code>${this.escapeHtml(tech)}</code>`).join("\n")}
`;
        }

        return `
<b>Результаты анализа вашего сайта:</b>
${seoBlock}
🤖 <b>Файл robots.txt:</b>
 - Статус: <code>${result.robotsTxtExists ? "✅ Существует" : "❌ Отсутствует"}</code>
${lighthouseBlock}
${techStackBlock}
 `;
    }

    private formatLighthouseResult(
        lighthouse: JobWorkerLighthouseResult,
    ): string {
        // Хелперы для форматирования метрик
        const formatScore = (score: number | null) => {
            if (score === null) return "<code>N/A</code>";
            const percent = (score * 100).toFixed(0);
            const emoji = score >= 0.9 ? "🟢" : score >= 0.5 ? "🟡" : "🔴";
            return `${emoji} <code>${percent}%</code>`;
        };

        const formatLCP = (ms: number | null) => {
            if (ms === null) return "<code>N/A</code>";
            const seconds = (ms / 1000).toFixed(2);
            const emoji = ms <= 2500 ? "🟢" : ms <= 4000 ? "🟡" : "🔴";
            return `${emoji} <code>${seconds} с</code>`;
        };

        const formatCLS = (score: number | null) => {
            if (score === null) return "<code>N/A</code>";
            const formatted = score.toFixed(3);
            const emoji = score <= 0.1 ? "🟢" : score <= 0.25 ? "🟡" : "🔴";
            return `${emoji} <code>${formatted}</code>`;
        };

        const formatTBT = (ms: number | null) => {
            if (ms === null) return "<code>N/A</code>";
            const emoji = ms <= 200 ? "🟢" : ms <= 600 ? "🟡" : "🔴";
            return `${emoji} <code>${ms.toFixed(0)} мс</code>`;
        };

        return `
⚡️ <b>Производительность (Lighthouse):</b>
 - Performance: ${formatScore(lighthouse.performance)}
 - Accessibility: ${formatScore(lighthouse.accessibility)}
 - Best Practices: ${formatScore(lighthouse.bestPractices)}
 - SEO: ${formatScore(lighthouse.seo)}

📈 <b>Core Web Vitals:</b>
 - LCP (Загрузка): ${formatLCP(lighthouse.lcp)}
 - CLS (Стабильность): ${formatCLS(lighthouse.cls)}
 - TBT (Интерактивность): ${formatTBT(lighthouse.tbt)}
`;
    }

    private formatSeoResult(seo: JobWorkerSeoResult): string {
        if (!seo) {
            return "";
        }

        const title = seo.title ? this.escapeHtml(seo.title) : "❌ Не найден";
        const description = seo.description
            ? this.escapeHtml(seo.description)
            : "❌ Не найдено";
        const h1 = seo.h1 ? this.escapeHtml(seo.h1) : "❌ Не найден";
        const brokenLinks = seo.brokenLinks?.length ? seo.brokenLinks?.length : 'Анализ не проводился';

        return `
🔎 <b>SEO-показатели:</b>
 - title: <code>${title}</code>
 - description: <code>${description}</code>
 - Заголовок H1: <code>${h1}</code>
 - Битых ссылок: <code>${brokenLinks}</code>
`;
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}
