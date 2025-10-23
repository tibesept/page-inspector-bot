import { Context } from "grammy";
import { ELanguages, IAnalyzerSettings, ISessionData } from "#types/state.js";
import { fa } from "zod/locales";

export const defaultAnalyzerSettings: IAnalyzerSettings = {
    links: false,
    seo: true,
    lighthouse: false,
    techstack: true,
    ai_summary: false
};

export function initial(): ISessionData {
    return {
        language: ELanguages.en,
        currentUrl: null,
        analyzerSettingsBuffer: defaultAnalyzerSettings,
        analyzerSettings: defaultAnalyzerSettings
    };
}

export function getSessionKey(ctx: Context): string | undefined {
    return ctx.from?.id.toString();
}
