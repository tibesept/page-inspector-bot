import { Bot, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import { FileAdapter } from "@grammyjs/storage-file";

import { config } from "#core/config.js";
import { loggerMiddleware } from "#core/logger.js";
import { createAuthMiddleware, devCheckMiddleware } from "#bot/middlewares/auth.js";
import * as useSession from "#bot/session.js";
import { ISessionData, TMyContext } from "#types/state.js";
import { errorHandler } from "#bot/handlers/error/index.js";
import { basicCommands } from "#bot/handlers/commands/basicCommands.js";
import { newJob } from "#bot/handlers/conversations/index.js";
import { ApiService } from "#api/ApiService.js"; // тип
import { JobService } from "#services/JobService.js";
import { UsersRepository } from "#repositories/UsersRepository.js";
import { UserService } from "#services/UserService.js";
import { createInjectServices } from "./middlewares/injectServices.js";

export function configureBot(
    bot: Bot<TMyContext>,
    usersRepository: UsersRepository,
    userService: UserService,
    jobService: JobService,
): void {
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
    const injectServices = createInjectServices(jobService, userService);

    // MIDDLEWARES
    bot.use(loggerMiddleware);
    bot.use(devCheckMiddleware);
    bot.use(createAuthMiddleware(usersRepository));

    // SERVICE INJECTION
    bot.use(injectServices);

    // CONVERSATIONS
    bot.use(conversations());
    bot.use(createConversation(newJob, { plugins: [injectServices]}));

    // HANDLERS
    bot.use(basicCommands);

    // ERROR HANDLER
    bot.catch(errorHandler);
}
