import { Conversation } from "@grammyjs/conversations";
import { logger } from "#core/logger.js";
import { TMyContext } from "#types/state.js";
import { Context } from "grammy";
import {
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

    if (!url) {
        const botMessage = await ctx.reply(
            "Отправьте ссылку на страницу. Она обязательно должна начинаться с протокола HTTP/HTTPS",
        );
        const { message } = await conversation.waitForHears(RegexURL, {
            otherwise: (ctx) => ctx.reply("Ссылка в некорректном формате"),
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

    await ctx.reply(getSettingsText(settingsBuffer), {
        reply_markup: main,
        parse_mode: "HTML",
    });

    await conversation.wait(); // обязательно. Иначе меню не будет работать
}