import { Composer } from "grammy";
import { TMyContext } from "../../types";
import { EConversations } from "../conversations";

export const basicCommands = new Composer<TMyContext>();

// TODO: ЯЗЫКИ!!! EN/RU

basicCommands.command("start", async (ctx) => {
    ctx.reply(`
Привет! Бот создан для того, чтобы анализировать веб страницы. Он может предоставить много полезной информации.
Из возможностей (хотелось бы):
- Собственный баланс (в кредитах. Пополнение через TON)
- Возможность тратить кредиты на анализ веб страниц

БЕСПЛАТНЫЙ АНАЛИЗ:
- Скриншот
- Фигня всякая по мелочам
- Ограничение 1 раз в день
- Нет отчета

ПЛАТНЫЙ АНАЛИЗ
Выбор глубины анализа (цены разные)
- Скришот
- Куча инфы, lighthouse, краулинг вглубь
- Полный отчет в формате PDF
- Краткое резюме от ИИ (DeepSeek API) об основных ошибках и возможных исправлениях

Но пока этого ничего нет и бот бесполезен!
`);
});


basicCommands.command("new", async (ctx) => {
    await ctx.conversation.enter(EConversations.newJob);
})

basicCommands.command("me", async (ctx) => {
    await ctx.api.sendChatAction(ctx?.chatId || 0, "typing") // печатает

    const balance = 30//await getBalance()
    await ctx.reply(`
        Баланс: ${balance} кредитов
    `)
})