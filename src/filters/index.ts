import { config } from "../config";
import { Context } from "grammy";
import { isUserHasId } from "grammy-guard";

export const isAdmin = isUserHasId(...config.telegram.botAdmins);

export const devFilter = (() => {
    if ((config.env = "dev")) {
        // если dev, то пускаем только админов
        return isAdmin;
    } else {
        return <C extends Context>(ctx: C) => true;
    }
})();
