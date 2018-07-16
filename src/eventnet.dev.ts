/**
 * EventNet
 * Created by X.Y.Z. at March 3rd, 2018.
 * @version 0.0.2
 */

import {
    ElementType, IAttrFuncCondition, IAttrsStore, ICallableElementLike, IDictionary, IElementLike, ILine,
    INode, INodeCode, INodeCodeDWS, INormalAttr, INormalAttrFunc,
    IStreamOfElement, ITypedDictionary, NodeRunningStage
} from "./types";
import {NormalNode} from "./internal/dev/normal_node";

import debug = require("debug");
export const _debug = debug("EventNet");

interface IEventNet {
    (attrs: IDictionary, state: IDictionary, code: INodeCode): NormalNode;
    (attrs: IDictionary, code: INodeCode): NormalNode;
    (code: INodeCode): NormalNode;
    installAttr: typeof installAttr;
    getAttrDefinition: typeof getAttrDefinition;
    defaultState: any;
    _attrsStore: IAttrsStore;
}

/**
 * Create a EventNet Node.
 * @param {Object} [attrs] set the attributes of Node
 * @param {Object} [states] set the initial state of Node, the `attrs` must be set firstly to set this item
 * @param {Function} code - set the code that is executed when the Node runs
 * @return {NormalNode} a new normal EventNet Node
 */
export const en = ((attrs: any, state?: any, code?: any) => {
    if (typeof attrs === "object" && typeof state === "object" && typeof code === "function") {
        return new NormalNode(attrs, state, code);
    } else if (typeof attrs === "object" && typeof state === "function") {
        return new NormalNode(attrs, {}, state);
    } else {
        return new NormalNode({}, {}, attrs);
    }
}) as IEventNet;

// The store of attributes.
export const _attrsStore: IAttrsStore = {
    normalAttrs: {},
    typedAttrs: {},
};

en._attrsStore = _attrsStore;

export function installAttr(name: string, type: "number" | "string" | "object" | "symbol" | "boolean" | "function"): void;
export function installAttr(name: string, attr: INormalAttr): void;
export function installAttr(name: any, value: any): void {
    // Parameter checking, remove in min&mon version.
    if (typeof name !== "string") {
        throw new Error("EventNet.installAttr: name should be a string");
    }

    if (typeof value === "string") {
        _attrsStore.typedAttrs[name] = value as "number" | "string" | "object" | "symbol" | "boolean" | "function";
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
        _attrsStore.normalAttrs[name] = value;
    }
}

en.installAttr = installAttr;

export const getAttrDefinition = (name: string) =>
    _attrsStore.typedAttrs[name] ||
        (!_attrsStore.normalAttrs[name].before
            && !_attrsStore.normalAttrs[name].after
            && !_attrsStore.normalAttrs[name].finish) ?
        void 0 :
        [(_attrsStore.normalAttrs[name].before || void 0),
        (_attrsStore.normalAttrs[name].after || void 0),
        (_attrsStore.normalAttrs[name].finish || void 0)];

en.getAttrDefinition = getAttrDefinition;

// The default state of each new Node.
// The states of Node created by calling en() is the result
// of assigning parameter `states` to the default state.
export const defaultState = {
    data: {},
    error: null,
    runTimes: 0,
    running: 0,
};

en.defaultState = defaultState;
/*
installAttr("fold", "number");
installAttr("sync", "boolean");
installAttr("runPlan", {
    before(condition, currentNode, isSync) {
        // TODO
    },
    beforePriority: 100,
    after(condition, currentNode, isSync) {
        // TODO
    },
    afterPriority: 100,
});
installAttr("timelimit", {
    before(condition, currentNode, isSync) {
        // TODO
    },
    beforePriority: 100,
    after(condition, currentNode, isSync) {
        // TODO
    },
    afterPriority: 100,
});
*/
