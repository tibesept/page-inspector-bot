import { IAnalyzerSettings, TMyContext } from "#types/state.js";
import { Conversation, ConversationMenu } from "@grammyjs/conversations";
import { Context } from "grammy";
import { getSettingsText, settingToggles } from "./helpers.js";
import Emoji from "#bot/emoji.js";

// ----- PRE JOB SETTINGS ---- 
export function createSettingsMenu(
    conversation: Conversation<Context, TMyContext>,
    settingsBuffer: IAnalyzerSettings,
    parent: ConversationMenu<TMyContext>
) {
    return conversation
        .menu("settings-menu", { parent: parent })
        .dynamic((ctx, range) => {
            settingToggles.forEach((toggle) => { // создаем чекбоксы (toggles)
                range.text(
                    () => `${toggle.label}: ${settingsBuffer[toggle.key] ? Emoji.yes : Emoji.no}`,
                    async (ctx) => {
                        settingsBuffer[toggle.key] = !settingsBuffer[toggle.key];
                        ctx.menu.update();
                    },
                );
                range.row();
            });
        })
        .row()
        .back("Применить", async (ctx) => { // кнопка "Применить". Сохраняет изменеиня
            await conversation.external(async (ctx: TMyContext) => {
                ctx.session.analyzerSettings = { ...settingsBuffer };
            });
            await ctx.editMessageText(getSettingsText(settingsBuffer), {
                parse_mode: "HTML",
            });
        })
        .back("Отмена", async (ctx) => { // кнопка "Отмена". Откатывает изменения
            const originalSettings = await conversation.external(
                (ctx: TMyContext) => ctx.session.analyzerSettings
            );
            settingToggles.forEach((toggle) => {
                settingsBuffer[toggle.key] = originalSettings[toggle.key];
            });
        });
}

// ----- PRE JOB MENU ---- 
export function createMainMenu(
    conversation: Conversation<Context, TMyContext>,
    url: string,
    settingsBuffer: IAnalyzerSettings
) {
    const main = conversation.menu("root-menu")
        .text("Запуск!", async (ctx) => {
            await ctx.deleteMessage();
            await ctx.reply("Ожидайте...");

            await conversation.external((ctx: TMyContext) => {
                if (!ctx.from?.id) throw new Error("No ctx.from.id");
                
                return ctx.jobService.createNewJob({
                    userId: ctx.from.id,
                    url: url,
                    analyzerSettings: settingsBuffer,
                }).catch(() => ctx.reply("Что-то пошло не так."));
            });
        });

    const settings = createSettingsMenu(conversation, settingsBuffer, main);
    
    main.submenu("Настройки", settings);
    
    return main;
}
