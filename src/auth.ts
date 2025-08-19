import { Context, NextFunction } from "grammy";
import { devFilter } from "./filters";

export async function authMiddleware(
    ctx: Context,
    next: NextFunction
): Promise<void> {
    if(devFilter(ctx)) {
        await next();
    }
}

// TODO
// - сделать authMiddleware на проверку админом в режиме dev (перед ВСЕМИ сообщениями)
// - сделать первые хендлеры команд