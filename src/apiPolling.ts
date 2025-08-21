import { Bot } from "grammy";
import { apiService } from "./ApiService";
import { JobsReadyDTO, TMyContext } from "./types";
import { logger } from "./logger";

function getProcessJob(bot: Bot<TMyContext>) {
    return async function processJob(jobReady: JobsReadyDTO[number]) {
        const job = await apiService.getJob(jobReady.jobId);

        if (!job) {
            logger.fatal("No job found by readyJob.id");
            return;
        }

        await bot.api.sendMessage(job.userId, job.result);
        await apiService.markJobAsSent(job.jobId);
    };
}

export async function pollApi(bot: Bot<TMyContext>, interval: number): Promise<void> {
    logger.debug("Polled API!");
    try {
        const result = await apiService.getJobsDone();
        const processJob = getProcessJob(bot);

        await Promise.all(result.map(processJob));
    } catch (error) {
        logger.error(error, "Polling failed!");
        throw error;
    }

    setTimeout(() => pollApi(bot, interval), interval);
}
