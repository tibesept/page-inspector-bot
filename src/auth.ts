import { Context, NextFunction } from "grammy";
import { devFilter } from "./filters";
import { apiService } from "./ApiService";
import { logger } from "./logger";

export async function devCheckMiddleware(
    ctx: Context,
    next: NextFunction,
): Promise<void> {
    if (devFilter(ctx)) {
        await next();
    }
}

export async function authMiddleware(
    ctx: Context,
    next: NextFunction,
): Promise<void> {
    const userId = ctx.message?.from.id;

    if (!userId) {
        logger.error(`USER ID NOT FOUND: ${ctx}`);
        await next();
        return;
    }

    await apiService.getUser(userId);
    await next();
}
