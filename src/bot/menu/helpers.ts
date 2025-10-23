import Emoji from "#bot/emoji.js";
import { IAnalyzerSettings } from "#types/state.js";

export interface ISettingsToggle {
    label: string;
    key: keyof IAnalyzerSettings
}

export const settingToggles: ISettingsToggle[] = [
    { label: "Битые ссылки", key: "links" },
    { label: "SEO-анализ", key: "seo" },
    { label: "Аудит LightHouse", key: "lighthouse" },
    { label: "Стек технологий", key: "techstack" },
];


export function getSettingsText(analyzerSettings: IAnalyzerSettings): string {
    return `Текущие настройки:\n${settingToggles
        .map(
            (i) =>
                ` - <b>${i.label}</b>: ${analyzerSettings[i.key] ? Emoji.yes : Emoji.no}`,
        )
        .join("\n")}`;
}