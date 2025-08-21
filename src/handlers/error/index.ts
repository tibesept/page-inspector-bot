import { BotError } from "grammy";
import { logger } from "../../logger";

import { TMyContext } from "../../types/state";

export async function errorHandler(err: BotError<TMyContext>) {
    logger.error(err, "Error!"); // err включает в себя всю важную инфу, в том числе контекст
}
