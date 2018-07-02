"use strict";
/** EventNet
 * Created by X.Y.Z. at March 3rd, 2018.
 * @version 0.0.2
 */
Object.defineProperty(exports, "__esModule", { value: true });
const en = (attrs, states, code) => {
    if (typeof attrs === "object" && typeof states === "object" && typeof code === "function") {
        return new Node(attrs, states, code);
    }
    else if (typeof attrs === "object" && typeof states === "function") {
        return new Node(attrs, {}, states);
    }
    else {
        return new Node({}, {}, code);
    }
};
exports.default = en;
// The store of attributes
const attrStore = {
    normalAttr: {},
    typedAttr: {},
};
function installAttr(name, value) {
    // Parameter checking, remove in min&mon version
    if (typeof name !== "string") {
        throw new Error("EventNet.installAttr: name should be a string");
    }
    if (typeof value === "string") {
        attrStore.typedAttr[name] = value;
    }
    else {
        if (value.before && typeof value.beforePriority === "undefined") {
            value.beforePriority = value.afterPriority || 0;
        }
        if (value.after && typeof value.afterPriority === "undefined") {
            value.afterPriority = value.beforePriority || 0;
        }
        attrStore.normalAttr[name] = value;
    }
}
en.installAttr = installAttr;
en.getAttr = (name) => attrStore.typedAttr[name] ||
    (!attrStore.normalAttr[name].before && !attrStore.normalAttr[name].after) ?
    false :
    [(attrStore.normalAttr[name].before || void 0), (attrStore.normalAttr[name].after || void 0)];
// The default state of each new Node that already exists.
// The states of Node created by calling en() is the result
// of assigning parameter `states` to default state.
en.defaultState = {
    data: {},
    error: null,
    runTimes: 0,
    running: 0,
};
class Node {
    constructor(attr, state, code) {
        this.numberOfLegs = 8;
        // Parameter checking, remove in min&mon version
        for (const i of Object.keys(attr)) {
            if (!attrStore.typedAttr[i] && !attrStore.normalAttr[i].before && !attrStore.normalAttr[i].after) {
                console.warn(`EventNet.Node: Attribution '${i}' has not been installed.`);
            }
            if (attrStore.typedAttr[i] && typeof attr[i] !== attrStore.typedAttr[i]) {
                throw new Error(`EventNet.Node: The type of attribution '${i}' must be ${attrStore.typedAttr[i]}.`);
            }
        }
    }
}
exports.Node = Node;
installAttr("fold", "number");
installAttr("sync", "boolean");
installAttr("runPlan", {
    before(condition, currentNode) {
        // TODO
    },
    beforePriority: 100,
    after(condition, currentNode) {
        // TODO
    },
    afterPriority: 100,
});
installAttr("timelimit", {
    before(condition, currentNode) {
        // TODO
    },
    beforePriority: 100,
    after(condition, currentNode) {
        // TODO
    },
    afterPriority: 100,
});
//# sourceMappingURL=eventnet.dev.js.map