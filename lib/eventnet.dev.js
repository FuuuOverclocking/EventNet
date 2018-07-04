"use strict";
/** EventNet
 * Created by X.Y.Z. at March 3rd, 2018.
 * @version 0.0.2
 */
const en = ((attrs, states, code) => {
    if (typeof attrs === "object" && typeof states === "object" && typeof code === "function") {
        return new Node(attrs, states, code);
    }
    else if (typeof attrs === "object" && typeof states === "function") {
        return new Node(attrs, {}, states);
    }
    else {
        return new Node({}, {}, code);
    }
});
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
const upsWaitingLink = [];
class Node {
    constructor(attr, state, code) {
        this.upstream = {
            add(ups) {
                this._upstream.push(ups);
            },
            get(index) {
                return typeof index === "undefined" ? this._upstream : this._upstream[index];
            },
            _content: [],
        };
        this.downstream = {
            add(ups) {
                this._downstream.push(ups);
            },
            get(index) {
                return typeof index === "undefined" ? this._downstream : this._downstream[index];
            },
            _downstream: [],
        };
        this.parentNode = void 0;
        this._watchers = []; ////////////////////////////////
        this.dwsAsParamMethod = {
            all: (data) => {
                for (const dws of this.downstream.get()) {
                    dws.run(data, this);
                }
            },
            get: (id, data) => {
                const downstreams = this.downstream.get();
                for (const dws of downstreams) {
                    if (dws.id === id) {
                        // tslint:disable-next-line:no-unused-expression
                        typeof data !== "undefined" && dws.run(data);
                        return dws;
                    }
                }
                return undefined;
            },
            dispense(keyValue) {
            },
        };
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
        this._attr = Object.assign({}, attr);
        this.state = Object.assign({}, en.defaultState, state);
        this.sortAttr();
        for (const ups of upsWaitingLink) {
            ups.downstream.add(this);
            this.upstream.add(ups);
        }
        upsWaitingLink.length = 0;
    }
    get watchers() {
        return this._watchers;
    }
    get attr() {
        return Object.assign({}, this._attr, this._inheritAttr);
    }
    setAttr(attrs) {
        // Coding suggestion, remove in min&mon version
        console.warn("EventNet.Node.setAttr: Modify attribute after the Node was created is not recommended.");
        for (const attr of attrs) {
            this._attr[attr.name] = attr.value;
        }
        this.sortAttr();
    }
    setInheritAttr(attrs) {
        for (const attr of attrs) {
            if (typeof this._attr[attr.name] !== "undefined") {
                continue;
            }
            this._inheritAttr[attr.name] = attr.value;
        }
        this.sortAttr();
    }
    sortAttr() {
        this.attrBeforeSequence.length = 0;
        this.attrAfterSequence.length = 0;
        const attr = this.attr;
        for (const name of Object.keys(attr)) {
            if (typeof attr[name] === "undefined") {
                continue;
            }
            if (attrStore.normalAttr[name].before) {
                this.attrBeforeSequence.push({
                    name,
                    value: attr[name],
                    priority: attrStore.normalAttr[name].beforePriority
                });
            }
            if (attrStore.normalAttr[name].after) {
                this.attrAfterSequence.push({
                    name,
                    value: attr[name],
                    priority: attrStore.normalAttr[name].afterPriority
                });
            }
        }
        // Sort attributes based on priority.
        this.attrBeforeSequence.sort((a, b) => a.priority - b.priority);
        this.attrAfterSequence.sort((a, b) => b.priority - a.priority);
    }
    async run(data, caller) {
        //////////////////////////////
        // try-catch will Copy all the variables in the current scope.
        try {
            await this._code(data, caller);
        }
        catch (error) {
            if (error === Node.shutByAttrBefore) {
                //////////////////////////////////////////////////////
            }
            else if (error === Node.shutByAttrAfter) {
                //////////////////////////////////////////////////////
            }
        }
        finally {
        }
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
            throw Node.shutByAttrBefore;
        }
        data = condition.data;
        let result;
        try {
            if (this._attr.sync === true) {
                //result = this.code();
            }
            else {
                //result = await this.code();
            }
        }
        catch (error) {
        }
    }
    get dwsAsParam() {
        return Object.assign({}, this.downstream._downstream);
    }
}
Node.shutByAttrBefore = Symbol();
Node.shutByAttrAfter = Symbol();
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
module.exports = en;
