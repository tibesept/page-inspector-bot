import { Bot, InputFile } from "grammy";
import { apiService } from "./ApiService";
import { JobsReadyDTO, jobWorkerResultSchema, TMyContext } from "./types";
import { logger } from "./logger";

function getProcessJob(bot: Bot<TMyContext>) {
    return async function processJob(jobReady: JobsReadyDTO[number]) {        
        const job = await apiService.getJob(jobReady.jobId);
        
        let error = false
        
        if (typeof job?.result !== "string") {
            if (!job) {
                logger.fatal("No job found by readyJob.id");
                return;
            }
            logger.fatal("No job result found");
            error = true
        }
        
        if(job.status === "failed") {
            logger.fatal("Job status FAILED")
            error = true
        }
        
        if (error && job.userId) {
            await bot.api.sendMessage(
                job.userId,
                "Возникла непредвиденная ошибка.",
            );
            throw new Error(`unknown error`);
        }


        const jobResult = jobWorkerResultSchema.parse(JSON.parse(job.result));

        const messageText = `
<b>Результаты SEO-анализа вашего сайта:</b>

🔗 <b>Ссылки:</b>
 - Всего ссылок: <code>${jobResult.seo.linksCount}</code>
 - Внутренних: <code>${jobResult.seo.internalLinks}</code>
 - Внешних: <code>${jobResult.seo.externalLinks}</code>
 - Битых ссылок: <code>${jobResult.brokenLinks.length}</code>

🔎 <b>SEO-показатели:</b>
 - title: <code>${jobResult.seo.title ? jobResult.seo.title : "❌ Не найден"}</code>
 - description: <code>${jobResult.seo.description ? jobResult.seo.description : "❌ Не найдено"}</code>
 - Заголовок H1: <code>${jobResult.seo.h1 ? jobResult.seo.h1 : "❌ Не найден"}</code>

🤖 <b>Файл robots.txt:</b>
 - Статус: <code>${jobResult.seo.robotsTxtExists ? "✅ Существует" : "❌ Отсутствует"}</code>

`;

        await bot.api.sendPhoto(
            job.userId,
            new InputFile(
                Buffer.from(jobResult.screenshot, "base64"),
                "photo.jpeg",
            ),
            {
                caption: messageText,
                parse_mode: "HTML",
            },
        );
        if(jobResult.brokenLinks.length) {
            await bot.api.sendMessage(job.userId, `Битые ссылки:\n${jobResult.brokenLinks.reduce((a,b) => a+"\n"+b.url, "")}`);
        }

        await apiService.markJobAsSent(job.jobId);
    };
}

export async function pollApi(
    bot: Bot<TMyContext>,
    interval: number,
): Promise<void> {
    logger.debug("Polled API!");
    try {
        const result = await apiService.getJobsDone();
        const processJob = getProcessJob(bot);

        await Promise.all(result.map(processJob));
    } catch (error) {
        logger.error(error, "Polling failed!");
    }

    setTimeout(() => pollApi(bot, interval), interval);
}
