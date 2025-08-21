import { Conversation } from "@grammyjs/conversations";
import { Context } from "grammy";
import { logger } from "../../logger";
import { apiService } from "../../ApiService";

const RegexURL =
    /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

export async function newJob(conversation: Conversation, ctx: Context) {
    const botMessage = await ctx.reply(
        "Отправьте ссылку на страницу. Она обязательно должна начинаться с протокола HTTP/HTTPS",
    );
    const { message } = await conversation.waitForHears(RegexURL, {
        otherwise: (ctx) => ctx.reply("Ссылка в некорректном формате"),
    });
    const url = message?.text;

    if (!url || !ctx.from?.id) {
        logger.info(`invalid url or ctx.from.id: ${url} \n ${ctx.from?.id}`);
        return;
    }
    logger.info(`got url: ${url}`);

    await ctx.api.deleteMessage(botMessage.chat.id, botMessage.message_id);
    await ctx.reply(`Принято! Ожидайте`);

    await ctx.api.sendChatAction(ctx?.chatId || 0, "typing"); // печатает
    await apiService.createJob({
        userId: ctx.from?.id,
        url: url,
        type: 0,
        depth: 1,
    });
}
