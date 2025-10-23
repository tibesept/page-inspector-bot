import { Conversation } from "@grammyjs/conversations";
import { logger } from "#core/logger.js";
import { TMyContext } from "#types/state.js";
import { Context } from "grammy";
import {
    createCancelMenu,
    createMainMenu,
} from "#bot/menu/conversationMenus.js";
import { getSettingsText } from "#bot/menu/helpers.js";

const RegexURL =
    /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;


export async function newJob(
    conversation: Conversation<Context, TMyContext>,
    ctx: TMyContext,
    userUrl: string,
) {
    let url: string | undefined = userUrl;

    const cancelMenu = createCancelMenu(conversation);

    if (!url) {
        const botMessage = await ctx.reply(
            "Отправьте ссылку на страницу. Она обязательно должна начинаться с протокола HTTP/HTTPS", 
            { reply_markup: cancelMenu }
        );
        const { message } = await conversation.waitForHears(RegexURL, {
            otherwise: (ctx) => ctx.reply("Ссылка в некорректном формате", { reply_markup: cancelMenu }),
        });
        url = message?.text;
        
        await ctx.api.deleteMessage(botMessage.chat.id, botMessage.message_id);
    }

    if (!url || !ctx.from?.id) {
        logger.warn(`invalid url or ctx.from.id: ${url} \n ${ctx.from?.id}`);
        return;
    }

    // ===== MENU =====
    
    // читаем сессию. ТОЛЬКО ТАК !!!
    const session = await conversation.external((ctx: TMyContext) => ctx.session);
    const settingsBuffer = { ...session.analyzerSettings };

    const main = createMainMenu(conversation, url, settingsBuffer);

    const preRunMessage = await ctx.reply(getSettingsText(settingsBuffer), {
        reply_markup: main,
        parse_mode: "HTML",
    });

    // ждем ТОЛЬКО callback_query от меню
    // если придет текст/фото/любое другое сообщение - выход из диалога
    await conversation.waitUntil(
        (ctx) => ctx.callbackQuery !== undefined,
        {
            otherwise: async (ctx) => {
                ctx.api.deleteMessage(preRunMessage.chat.id, preRunMessage.message_id);
                await ctx.reply("Операция отменена!");
                conversation.halt();
            }
        }
    );
}