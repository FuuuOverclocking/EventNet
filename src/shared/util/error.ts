import { isObject } from ".";
import { IElementLike } from "../../core/types";
import { warn } from "./debug";
import { inBrowser } from "./env";

export function handleError(err: any, position: string, elem?: IElementLike) {
    if (process.env.NODE_ENV !== "production") {
        warn(`Error in ${position}: "${isObject(err) ? err.message || err.toString() : err.toString()}"`, elem);
    }

    if (inBrowser && typeof console !== "undefined") {
        console.error(err);
    } else {
        throw err;
    }
}
