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

interface IEventNet {
    (attrs: IDictionary, state: IDictionary, code: INodeCode): NormalNode;
    (attrs: IDictionary, code: INodeCode): NormalNode;
    (code: INodeCode): NormalNode;
    installAttr: typeof installAttr;
    getAttrDefinition: (name: string) =>
        string
        | [INormalAttrFunc | undefined, INormalAttrFunc | undefined, INormalAttrFunc | undefined]
        | undefined;
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
const en = ((attrs: any, state?: any, code?: any) => {
    if (typeof attrs === "object" && typeof state === "object" && typeof code === "function") {
        return new NormalNode(attrs, state, code);
    } else if (typeof attrs === "object" && typeof state === "function") {
        return new NormalNode(attrs, {}, state);
    } else {
        return new NormalNode({}, {}, attrs);
    }
}) as IEventNet;

export = en;

// The store of attributes.
const attrsStore: IAttrsStore = {
    normalAttrs: {},
    typedAttrs: {},
};
en._attrsStore = attrsStore;

function installAttr(name: string, type: "number" | "string" | "object" | "symbol" | "boolean" | "function"): void;
function installAttr(name: string, attr: INormalAttr): void;
function installAttr(name: any, value: any): void {
    // Parameter checking, remove in min&mon version.
    if (typeof name !== "string") {
        throw new Error("EventNet.installAttr: name should be a string");
    }

    if (typeof value === "string") {
        attrsStore.typedAttrs[name] = value as "number" | "string" | "object" | "symbol" | "boolean" | "function";
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
        attrsStore.normalAttrs[name] = value;
    }
}

en.installAttr = installAttr;

en.getAttrDefinition = (name: string) =>
    attrsStore.typedAttrs[name] ||
        (!attrsStore.normalAttrs[name].before
            && !attrsStore.normalAttrs[name].after
            && !attrsStore.normalAttrs[name].finish) ?
        void 0 :
        [(attrsStore.normalAttrs[name].before || void 0),
        (attrsStore.normalAttrs[name].after || void 0),
        (attrsStore.normalAttrs[name].finish || void 0)];

// The default state of each new Node.
// The states of Node created by calling en() is the result
// of assigning parameter `states` to the default state.
en.defaultState = {
    data: {},
    error: null,
    runTimes: 0,
    running: 0,
};

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
