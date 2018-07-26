import { IAttrsStore, INormalAttr, IPrimitive } from "./types";
import { handleError } from "./util";

// The store of attributes.
export const _attrsStore: IAttrsStore = {
    normal: {},
    typed: {},
};

export const installAttr =
    (
        name: string,
        value: IPrimitive | "object" | "function" | INormalAttr,
    ) => {
        if (process.env.NODE_ENV !== "production") {
            if (typeof name !== "string") {
                handleError(new Error("name should be a string"), "installAttr");
            }
            if (_attrsStore.typed[name] || _attrsStore.normal[name]) {
                handleError(new Error(`attr '${name}' has already been installed.`), "installAttr");
            }
            return;
        }

        if (typeof value === "string") {
            _attrsStore.typed[name] = value as IPrimitive | "object" | "function";
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
            value.priority = void 0;
            _attrsStore.normal[name] = value;
        }
    };

export const getAttrDefinition: (name: string) => IPrimitive | "object" | "function" | INormalAttr | undefined =
    (name: string) => _attrsStore.typed[name] || _attrsStore.normal[name];
