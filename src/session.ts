import { Context } from "grammy";
import { ELanguages, ISessionData } from "./types";

export function initial(): ISessionData {
    return {
        language: ELanguages.en,
    };
}

export function getSessionKey(ctx: Context): string | undefined {
    return ctx.from?.id.toString();
}
