// setup
import { Bot, session, webhookCallback } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
// import express from "express";
import { FileAdapter } from "@grammyjs/storage-file";

// config
import { config } from "./config";

// middlewares
import { logger, loggerMiddleware } from "./logger";
import { authMiddleware, devCheckMiddleware } from "./auth";

// session
import * as useSession from "./session";
import { ISessionData, TMyContext } from "./types";

// handlers
import { errorHandler } from "./handlers/error";
import { basicCommands } from "./handlers/commands";

// conversations
import { newJob } from "./handlers/conversations";
import { pollApi } from "./apiPolling";

// Логика запуска, которая переключает режимы
const main = async () => {
    const bot = new Bot<TMyContext>(config.telegram.token);

    // SESSION
    bot.use(
        session({
            initial: useSession.initial,
            getSessionKey: useSession.getSessionKey,
            storage: new FileAdapter<ISessionData>({
                dirName: "sessions",
            }),
        }),
    );

    // MIDDLEWARES
    bot.use(loggerMiddleware);
    bot.use(devCheckMiddleware);
    bot.use(authMiddleware);

    // CONVERSATIONS
    bot.use(conversations());
    bot.use(createConversation(newJob));

    // HANDLERS
    bot.use(basicCommands);

    // ERROR HANDLER
    bot.catch(errorHandler);

    // START
    bot.start({
        onStart: ({ username }) => {
            logger.info({
                msg: "Bot running!",
                username,
            });
        },
    });

    pollApi(bot, config.api.polling_interval_ms);
};

main();
