import { IAttrsStore, INormalAttr } from "./types";

// The store of attributes.
export const _attrsStore: IAttrsStore = {
    normal: {},
    typed: {},
};

export const installAttr =
(
    name: string,
    value: "number" | "string" | "object" | "symbol" | "boolean" | "function" | INormalAttr,
) => {
    if (process.env.NODE_ENV !== "production" && typeof name !== "string") {
        throw new Error("EventNet.installAttr: name should be a string");
    }

    if (typeof value === "string") {
        _attrsStore.typed[name] = value as "number" | "string" | "object" | "symbol" | "boolean" | "function";
    } else {
        if (typeof value.priority === "undefined") {
            value.priority = 9999;
        }
        if (value.before && typeof value.beforePriority === "undefined") {
            value.beforePriority = value.priority;
        }
        if (value.after && typeof value.afterPriority === "undefined") {
            value.afterPriority = value.priority;
        }
        if (value.finish && typeof value.finishPriority === "undefined") {
            value.finishPriority = value.priority;
        }
        value.priority = void 0;
        _attrsStore.normal[name] = value;
    }
};

export const getAttrDefinition = (name: string) =>
    _attrsStore.typed[name] ||
        (!_attrsStore.normal[name].before
            && !_attrsStore.normal[name].after
            && !_attrsStore.normal[name].finish) ?
        void 0 :
        [(_attrsStore.normal[name].before || void 0),
        (_attrsStore.normal[name].after || void 0),
        (_attrsStore.normal[name].finish || void 0)];
