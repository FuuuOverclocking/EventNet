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
en.getAttrDefinition = (name) => attrStore.typedAttr[name] ||
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
        this.parentNode = void 0;
        // Parameter checking, remove in min&mon version
        for (const name of Object.keys(attr)) {
            if (!attrStore.typedAttr[name] &&
                !attrStore.normalAttr[name].before &&
                !attrStore.normalAttr[name].after) {
                console.warn(`EventNet.Node: Attribution '${name}' has not been installed.`);
            }
            if (attrStore.typedAttr[name] &&
                typeof attr[name] !== attrStore.typedAttr[name]) {
                throw new Error(`EventNet.Node: The type of attribution '${name}' must be ${attrStore.typedAttr[name]}.`);
            }
        }
        this.code = code;
        this._attr = attr;
        this.state = Object.assign(en.defaultState, state);
        // Sort attributes based on priority.
        for (const name of Object.keys(this._attr)) {
            if (typeof this._attr[name] === "undefined") {
                continue;
            }
            if (attrStore.normalAttr[name].before) {
                this.attrBeforeSequence.push({
                    name,
                    value: this._attr[name],
                    priority: attrStore.normalAttr[name].beforePriority
                });
            }
            if (attrStore.normalAttr[name].after) {
                this.attrAfterSequence.push({
                    name,
                    value: this._attr[name],
                    priority: attrStore.normalAttr[name].afterPriority
                });
            }
        }
        this.attrBeforeSequence.sort((a, b) => a.priority - b.priority);
        this.attrAfterSequence.sort((a, b) => b.priority - a.priority);
    }
    get watchers() {
        return this._watchers;
    }
    get attr() {
        return this._attr;
    }
    async _code(data, caller) {
        this.state.running++;
        const condition = {
            data,
            attrValue: null,
            shut: false,
        };
        for (const attrObj of this.attrBeforeSequence) {
            condition.attrValue = attrObj.value;
            await attrStore.normalAttr[attrObj.name].before(condition, this);
        }
        if (condition.shut) {
            this.state.running--;
            return;
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
