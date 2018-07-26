import debug = require("debug");
import { isElement, noop } from ".";
import { IElementLike } from "../../core/types";

export let warn: (msg: string, elem?: IElementLike) => void = noop;
export let tip: (msg: string, elem?: IElementLike) => void = noop;
export let generateElemTrace: (elem: IElementLike) => string | void = noop;

if (process.env.NODE_ENV !== "production") {
    const _warn = debug("EventNet:warn");
    const _tip = debug("EventNet:tip");

    _warn.log = console.error.bind(console);
    _tip.log = console.warn.bind(console);

    warn = (msg: string, elem?: IElementLike) => {
        const trace = elem ? generateElemTrace(elem) : "";
        _warn(msg + trace);
    };
    tip = (msg: string, elem?: IElementLike) => {
        const trace = elem ? generateElemTrace(elem) : "";
        _tip(msg + trace);
    };

    generateElemTrace = (elem: IElementLike) => {
        if (!isElement(elem)) { return ""; }
        ////////////////////////////////////////
    };
}
