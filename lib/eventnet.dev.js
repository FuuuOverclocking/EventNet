"use strict";
/**
 * EventNet
 * Created by X.Y.Z. at March 3rd, 2018.
 * @version 0.0.2
 */
Object.defineProperty(exports, "__esModule", { value: true });
const normal_node_1 = require("./internal/dev/normal_node");
const debug = require("debug");
exports._debug = debug("EventNet");
/**
 * Create a EventNet Node.
 * @param {Object} [attrs] set the attributes of Node
 * @param {Object} [states] set the initial state of Node, the `attrs` must be set firstly to set this item
 * @param {Function} code - set the code that is executed when the Node runs
 * @return {NormalNode} a new normal EventNet Node
 */
exports.en = ((attrs, state, code) => {
    if (typeof attrs === "object" && typeof state === "object" && typeof code === "function") {
        return new normal_node_1.NormalNode(attrs, state, code);
    }
    else if (typeof attrs === "object" && typeof state === "function") {
        return new normal_node_1.NormalNode(attrs, {}, state);
    }
    else {
        return new normal_node_1.NormalNode({}, {}, attrs);
    }
});
// The store of attributes.
exports._attrsStore = {
    normalAttrs: {},
    typedAttrs: {},
};
exports.en._attrsStore = exports._attrsStore;
function installAttr(name, value) {
    // Parameter checking, remove in min&mon version.
    if (typeof name !== "string") {
        throw new Error("EventNet.installAttr: name should be a string");
    }
    if (typeof value === "string") {
        exports._attrsStore.typedAttrs[name] = value;
    }
    else {
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
        exports._attrsStore.normalAttrs[name] = value;
    }
}
exports.installAttr = installAttr;
exports.en.installAttr = installAttr;
exports.getAttrDefinition = (name) => exports._attrsStore.typedAttrs[name] ||
    (!exports._attrsStore.normalAttrs[name].before
        && !exports._attrsStore.normalAttrs[name].after
        && !exports._attrsStore.normalAttrs[name].finish) ?
    void 0 :
    [(exports._attrsStore.normalAttrs[name].before || void 0),
        (exports._attrsStore.normalAttrs[name].after || void 0),
        (exports._attrsStore.normalAttrs[name].finish || void 0)];
exports.en.getAttrDefinition = exports.getAttrDefinition;
// The default state of each new Node.
// The states of Node created by calling en() is the result
// of assigning parameter `states` to the default state.
exports.defaultState = {
    data: {},
    error: null,
    runTimes: 0,
    running: 0,
};
exports.en.defaultState = exports.defaultState;
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
//# sourceMappingURL=eventnet.dev.js.map