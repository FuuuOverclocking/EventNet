"use strict";
/** EventNet
 * Created by X.Y.Z. at March 3rd, 2018.
 * @version 0.0.2
 */
const types_1 = require("./types");
const en = ((attrs, states, code) => {
    if (typeof attrs === "object" && typeof states === "object" && typeof code === "function") {
        return new Node(attrs, states, code);
    }
    else if (typeof attrs === "object" && typeof states === "function") {
        return new Node(attrs, {}, states);
    }
    else {
        return new Node({}, {}, attrs);
    }
});
// The store of attributes.
const attrStore = {
    normalAttr: {},
    typedAttr: {},
};
function installAttr(name, value) {
    // Parameter checking, remove in min&mon version.
    if (typeof name !== "string") {
        throw new Error("EventNet.installAttr: name should be a string");
    }
    if (typeof value === "string") {
        attrStore.typedAttr[name] = value;
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
        attrStore.normalAttr[name] = value;
    }
}
en.installAttr = installAttr;
en.getAttrDefinition = (name) => attrStore.typedAttr[name] ||
    (!attrStore.normalAttr[name].before
        && !attrStore.normalAttr[name].after
        && !attrStore.normalAttr[name].finish) ?
    void 0 :
    [(attrStore.normalAttr[name].before || void 0),
        (attrStore.normalAttr[name].after || void 0),
        (attrStore.normalAttr[name].finish || void 0)];
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
class StreamOfNode {
    constructor(wrapper) {
        this.content = [];
        this.contentById = {};
        this.wrappedContent = [];
        this.wrapper = wrapper || ((line) => { });
    }
    add(stream) {
        this.content.push(stream);
        this.wrappedContent.push(this.wrapper(stream));
        if (typeof stream.id !== "undefined") {
            // Parameter checking, remove in min&mon version.
            if (typeof this.contentById[stream.id] !== "undefined") {
                throw new Error("EventNet.StreamOfNode.add: The stream of the same id already exists.");
            }
            this.contentById[stream.id] = stream;
        }
    }
    get(index) {
        return typeof index === "undefined" ? this.content : this.content[index];
    }
    getById(id) {
        return typeof id === "undefined" ? this.contentById : this.contentById[id];
    }
}
class Node {
    constructor(attr, state, code) {
        this.upstream = new StreamOfNode();
        this.downstream = new StreamOfNode((line) => {
            const func = ((data) => {
                data = this.codeDwsDataAttrAfterProcess(data, false);
                line.run(data, this);
            });
            func.origin = line;
            return func;
        });
        this.parentNode = void 0;
        this._watchers = []; ////////////////////////////////
        // Parameter checking, remove in min&mon version.
        if (typeof attr.sync !== "undefined" && typeof attr.sync !== "boolean") {
            throw new Error("EventNet.Node: Attribution 'sync' must be true or false.");
        }
        for (const name of Object.keys(attr)) {
            if (!attrStore.typedAttr[name] &&
                !attrStore.normalAttr[name].before &&
                !attrStore.normalAttr[name].after &&
                !attrStore.normalAttr[name].finish) {
                console.warn(`EventNet.Node: Attribution '${name}' has not been installed.`);
            }
            if (attrStore.typedAttr[name] &&
                typeof attr[name] !== attrStore.typedAttr[name]) {
                throw new Error(`EventNet.Node: The type of attribution '${name}' must be ${attrStore.typedAttr[name]}.`);
            }
        }
        this.code = code;
        Object.assign(this.downstream.wrappedContent, {
            all: Node.codeParamDws.all.bind(this),
            get: Node.codeParamDws.get.bind(this),
            dispense: Node.codeParamDws.dispense.bind(this),
        });
        this.codeParam = {
            dws: this.downstream.wrappedContent,
        };
        this._inheritAttr = {};
        this._attr = Object.assign(Object.create(this._inheritAttr), attr);
        if (typeof this._attr.sync === "undefined") {
            this._attr.sync = false;
        }
        this.sortAttr();
        this.state = Object.assign({}, en.defaultState, state);
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
        // Only the clone with its own property is exposed,
        // so modifying `attr` is invalid.
        // The inherited property is not exposed.
        return Object.assign({}, this._attr);
    }
    setAttr(attrs) {
        // Coding suggestion, remove in min&mon version.
        console.warn("EventNet.Node.setAttr: Modify attribute while the Node is running may cause unknown errors.");
        for (const attr of attrs) {
            this._attr[attr.name] = attr.value;
        }
        this.sortAttr();
    }
    setInheritAttr(attrs) {
        for (const attr of attrs) {
            this._inheritAttr[attr.name] = attr.value;
        }
        this.sortAttr();
    }
    sortAttr() {
        this.attrBeforeSequence.length = 0;
        this.attrAfterSequence.length = 0;
        this.attrFinishSequence.length = 0;
        const attr = this._attr;
        for (const name in attr) {
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
            if (attrStore.normalAttr[name].finish) {
                this.attrFinishSequence.push({
                    name,
                    value: attr[name],
                    priority: attrStore.normalAttr[name].finishPriority
                });
            }
        }
        // Sort attributes based on priority.
        this.attrBeforeSequence.sort((a, b) => a.priority - b.priority);
        this.attrAfterSequence.sort((a, b) => b.priority - a.priority);
        this.attrFinishSequence.sort((a, b) => b.priority - a.priority);
    }
    run(data, caller) {
        if (this._attr.sync) {
            try {
                return this._codeSync(data, caller);
            }
            catch (error) {
                ////////////////////////////////////////////////////////////////
            }
        }
        else {
            return this._codeAsync(data, caller).catch((error) => {
                ////////////////////////////////////////////////////////////////
            });
        }
        //////////////////////////////
        // Try-catch will copy all the variables in the current scope.
    }
    errorHandler(when, what) {
        //////////////////////////////////////////////////////////////////////////////////
    }
    async _codeAsync(data, caller) {
        let runningStage = types_1.INodeRunningStage.before;
        this.state.running++;
        let shutByAttrBefore = false;
        let errorInAttrBefore;
        const conditionBefore = {
            data,
            attrValue: null,
            shut: (error) => {
                shutByAttrBefore = true;
                if (typeof error === "undefined") {
                    return;
                }
                if (runningStage === types_1.INodeRunningStage.before) {
                    errorInAttrBefore = error;
                }
                else {
                    // Does not report in which operation and which attribute the error occurred for higher performance.
                    this.errorHandler(types_1.INodeRunningStage.before, error);
                }
            },
        };
        for (const attrObj of this.attrBeforeSequence) {
            conditionBefore.attrValue = attrObj.value;
            await attrStore.normalAttr[attrObj.name].before(conditionBefore, this, this._attr.sync);
            if (shutByAttrBefore) {
                this.state.running--;
                throw { subject: types_1.INodeRunningStage.before, errorInAttrBefore };
            }
        }
        runningStage = types_1.INodeRunningStage.code;
        data = conditionBefore.data;
        const result = await this.code(this.codeParam.dws, { data, caller }, { origin: this });
        if (this.attrFinishSequence.length !== 0) {
            runningStage = types_1.INodeRunningStage.finish;
            let shutByAttrFinish = false;
            let errorInAttrFinish;
            const conditionFinish = {
                attrValue: null,
                shut: (error) => {
                    shutByAttrFinish = true;
                    if (typeof error === "undefined") {
                        return;
                    }
                    errorInAttrFinish = error;
                },
            };
            for (const attrObj of this.attrFinishSequence) {
                conditionBefore.attrValue = attrObj.value;
                await attrStore.normalAttr[attrObj.name].finish(conditionFinish, this, this._attr.sync);
                if (shutByAttrFinish) {
                    this.state.running--;
                    throw { subject: types_1.INodeRunningStage.finish, errorInAttrFinish };
                }
            }
        }
        runningStage = types_1.INodeRunningStage.over;
        this.state.running--;
        return result;
    }
    _codeSync(data, caller) {
        let runningStage = types_1.INodeRunningStage.before;
        this.state.running++;
        let shutByAttrBefore = false;
        let errorInAttrBefore;
        const conditionBefore = {
            data,
            attrValue: null,
            shut: (error) => {
                shutByAttrBefore = true;
                if (typeof error === "undefined") {
                    return;
                }
                if (runningStage === types_1.INodeRunningStage.before) {
                    errorInAttrBefore = error;
                }
                else {
                    // Does not report in which operation and which attribute the error occurred for higher performance.
                    this.errorHandler(types_1.INodeRunningStage.before, error);
                }
            },
        };
        for (const attrObj of this.attrBeforeSequence) {
            conditionBefore.attrValue = attrObj.value;
            attrStore.normalAttr[attrObj.name].before(conditionBefore, this, this._attr.sync);
            if (shutByAttrBefore) {
                this.state.running--;
                throw { subject: types_1.INodeRunningStage.before, errorInAttrBefore };
            }
        }
        runningStage = types_1.INodeRunningStage.code;
        data = conditionBefore.data;
        const result = this.code(this.codeParam.dws, { data, caller }, { origin: this });
        if (this.attrFinishSequence.length !== 0) {
            runningStage = types_1.INodeRunningStage.finish;
            let shutByAttrFinish = false;
            let errorInAttrFinish;
            const conditionFinish = {
                attrValue: null,
                shut: (error) => {
                    shutByAttrFinish = true;
                    if (typeof error === "undefined") {
                        return;
                    }
                    errorInAttrFinish = error;
                },
            };
            for (const attrObj of this.attrFinishSequence) {
                conditionBefore.attrValue = attrObj.value;
                attrStore.normalAttr[attrObj.name].finish(conditionFinish, this, this._attr.sync);
                if (shutByAttrFinish) {
                    this.state.running--;
                    throw { subject: types_1.INodeRunningStage.finish, errorInAttrFinish };
                }
            }
        }
        runningStage = types_1.INodeRunningStage.over;
        this.state.running--;
        return result;
    }
    codeDwsDataAttrAfterProcess(data, collection) {
        // Speed up the operation of the function.
        if (this.attrAfterSequence.length === 0) {
            return data;
        }
        let shutByAttrAfter = false;
        let errorInAttrAfter;
        const condition = {
            data,
            attrValue: null,
            shut: (error) => {
                shutByAttrAfter = true;
                if (typeof error === "undefined") {
                    return;
                }
                errorInAttrAfter = error;
            },
            collection,
        };
        for (const attrObj of this.attrAfterSequence) {
            condition.attrValue = attrObj.value;
            attrStore.normalAttr[attrObj.name].after(condition, this, this._attr.sync);
            if (shutByAttrAfter) {
                this.state.running--;
                throw { subject: types_1.INodeRunningStage.after, errorInAttrAfter };
            }
        }
        return condition.data;
    }
}
Node.codeParamDws = {
    all(data) {
        if (typeof data !== "undefined") {
            data = this.codeDwsDataAttrAfterProcess(data, false);
        }
        for (const dws of this.downstream.get()) {
            dws.run(data, this);
        }
    },
    get(id, data) {
        const downstream = this.downstream.getById(id);
        // Downstream presence checking, remove in min&mon version.
        if (typeof downstream === "undefined") {
            console.warn(`EventNet.Node.codeParamDws.get: There is no downstream of ID '${id}'.`);
            return void 0;
        }
        if (typeof data !== "undefined") {
            data = this.codeDwsDataAttrAfterProcess(data, false);
            downstream.run(data, this);
        }
        return downstream;
    },
    // tslint:disable-next-line:variable-name
    dispense(IdValue_or_IndexValue) {
        IdValue_or_IndexValue = this.codeDwsDataAttrAfterProcess(IdValue_or_IndexValue, true);
        let downstream;
        if (isNaN(Number(Object.keys(IdValue_or_IndexValue)[0]))) {
            // Identify 'keyValue' with ID-value type.
            for (const id of Object.keys(IdValue_or_IndexValue)) {
                downstream = this.downstream.getById(id);
                // Downstream presence checking, remove in min&mon version.
                if (typeof downstream !== "undefined") {
                    downstream.run(IdValue_or_IndexValue[id], this);
                }
                else {
                    console.warn(`EventNet.Node.codeParamDws.get: There is no downstream of ID '${id}'.`);
                }
            }
        }
        else {
            // Identify 'keyValue' with index-value type.
            // tslint:disable-next-line:forin
            for (const index in IdValue_or_IndexValue) {
                downstream = this.downstream.get(Number(index));
                // Downstream presence checking, remove in min&mon version.
                if (typeof downstream !== "undefined") {
                    downstream.run(IdValue_or_IndexValue[index], this);
                }
                else {
                    console.warn(`EventNet.Node.codeParamDws.get: There is no downstream of ID '${index}'.`);
                }
            }
        }
    },
};
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
module.exports = en;
//# sourceMappingURL=eventnet.dev.js.map