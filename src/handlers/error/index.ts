import { BotError } from "grammy";
import { logger } from "../../logger";

import { TMyContext } from "../../types/state";

export async function errorHandler(err: BotError<TMyContext>) {
    let { ctx, stack } = err;
    logger.info({
        msg: `Update ${ctx.update.update_id} ERROR \n${stack}\nAnd: ${{ ...ctx.update }}\nFull: ${err}`,
    });
}
