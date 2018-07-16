"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../types");
const stream_of_node_1 = require("./stream_of_node");
const eventnet_dev_1 = require("../../eventnet.dev");
const attrsStore = eventnet_dev_1.en._attrsStore;
const linesWaitingLink = [];
class NormalNode {
    constructor(attrs, state, code) {
        this.upstream = new stream_of_node_1.StreamOfNode();
        this.downstream = new stream_of_node_1.StreamOfNode((line) => {
            const func = ((data) => {
                data = this.codeDwsDataAttrAfterProcess(data, false);
                line.run(data, this);
            });
            func.origin = line;
            return func;
        });
        this.parentNode = void 0;
        this._watchers = []; ////////////////////////////////
        this._errorReceiver = void 0;
        // Parameter checking, remove in min&mon version.
        if (typeof attrs.sync !== "undefined" && typeof attrs.sync !== "boolean") {
            throw new Error("EventNet.Node: Attribution 'sync' must be true or false.");
        }
        for (const name of Object.keys(attrs)) {
            if (!attrsStore.typedAttrs[name] &&
                !attrsStore.normalAttrs[name].before &&
                !attrsStore.normalAttrs[name].after &&
                !attrsStore.normalAttrs[name].finish) {
                eventnet_dev_1._debug(`Node: Attribution '${name}' has not been installed.`);
            }
            if (attrsStore.typedAttrs[name] &&
                typeof attrs[name] !== attrsStore.typedAttrs[name]) {
                throw new Error(`EventNet.Node: The type of attribution '${name}' must be ${attrsStore.typedAttrs[name]}.`);
            }
        }
        this.code = code;
        Object.assign(this.downstream.wrappedContent, {
            all: NormalNode.codeParamDws.all.bind(this),
            get: NormalNode.codeParamDws.get.bind(this),
            dispense: NormalNode.codeParamDws.dispense.bind(this),
        });
        this.codeParam = {
            dws: this.downstream.wrappedContent,
        };
        this._attrs = {};
        this._attrs.inherited = {};
        this._attrs.own = Object.assign(Object.create(this._attrs.inherited), attrs);
        if (typeof this._attrs.own.sync === "undefined") {
            this._attrs.own.sync = false;
        }
        this.sortAttrs();
        this.state = Object.assign({}, eventnet_dev_1.en.defaultState, state);
        for (const ups of linesWaitingLink) {
            ups.downstream.add(this);
            this.upstream.add(ups);
        }
        linesWaitingLink.length = 0;
    }
    get watchers() {
        return this._watchers;
    }
    get attrs() {
        // Only the clone with its own property is exposed,
        // so modifying `attr` is invalid.
        // The inherited property is not exposed.
        return Object.assign({}, this._attrs.own);
    }
    get allAttrs() {
        return Object.assign({}, this._attrs.inherited, this._attrs.own);
    }
    setAttrs(attrs) {
        // Coding suggestion, remove in min&mon version.
        eventnet_dev_1._debug("Node.setAttr: Modify attribute while the Node is running may cause unknown errors.");
        for (const attr of attrs) {
            this._attrs.own[attr.name] = attr.value;
        }
        this.sortAttrs();
    }
    _setInheritAttrs(attrs) {
        for (const attr of attrs) {
            this._attrs.inherited[attr.name] = attr.value;
        }
        this.sortAttrs();
    }
    sortAttrs() {
        this._attrs.beforeSequence.length = 0;
        this._attrs.afterSequence.length = 0;
        this._attrs.finishSequence.length = 0;
        const attr = this._attrs.own;
        // For-in will traverse all the attributes of Node, including its own and inherited.
        for (const name in attr) {
            if (typeof attr[name] === "undefined") {
                continue;
            }
            if (attrsStore.normalAttrs[name].before) {
                this._attrs.beforeSequence.push({
                    name,
                    value: attr[name],
                    priority: attrsStore.normalAttrs[name].beforePriority
                });
            }
            if (attrsStore.normalAttrs[name].after) {
                this._attrs.afterSequence.push({
                    name,
                    value: attr[name],
                    priority: attrsStore.normalAttrs[name].afterPriority
                });
            }
            if (attrsStore.normalAttrs[name].finish) {
                this._attrs.finishSequence.push({
                    name,
                    value: attr[name],
                    priority: attrsStore.normalAttrs[name].finishPriority
                });
            }
        }
        // Sort attributes based on priority.
        this._attrs.beforeSequence.sort((a, b) => a.priority - b.priority);
        this._attrs.afterSequence.sort((a, b) => b.priority - a.priority);
        this._attrs.finishSequence.sort((a, b) => b.priority - a.priority);
    }
    run(data, caller) {
        if (this._attrs.own.sync) {
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
    set errorReceiver(element) {
        if (!(element.type & 1)) {
            this._errorReceiver = this.createPipe(element, { feature: "error" });
        }
        else if (element.type === types_1.ElementType.Pipe) {
            this._errorReceiver = element;
        }
        else {
            throw new Error("EventNet.Node.errorReceiver: errorReceiver must be assigned to an type of Node or Pipe.");
        }
    }
    createPipe(node, options) {
        return {};
    }
    errorHandler(when, what) {
        if (typeof this._errorReceiver === "undefined") {
            throw { when, what };
        }
        else {
            this._errorReceiver.run({ when, what }, this);
        }
    }
    async _codeAsync(data, caller) {
        ++this.state.runTimes;
        let runningStage = types_1.NodeRunningStage.before;
        ++this.state.running;
        let shutByAttrBefore = false;
        let errorInAttrBefore;
        const conditionBefore = {
            data,
            attrs: this.allAttrs,
            state: this.state,
            node: this,
            shut: (error) => {
                shutByAttrBefore = true;
                if (typeof error === "undefined") {
                    return;
                }
                if (runningStage === types_1.NodeRunningStage.before) {
                    errorInAttrBefore = error;
                }
                else {
                    // Does not report in which operation and which attribute the error occurred for higher performance.
                    this.errorHandler(types_1.NodeRunningStage.before, error);
                }
            },
        };
        for (const attrObj of this._attrs.beforeSequence) {
            await attrsStore.normalAttrs[attrObj.name].before(attrObj.value, conditionBefore);
            if (shutByAttrBefore) {
                runningStage = types_1.NodeRunningStage.over;
                --this.state.running;
                throw { when: types_1.NodeRunningStage.before, what: errorInAttrBefore };
            }
        }
        runningStage = types_1.NodeRunningStage.code;
        data = conditionBefore.data;
        let result = await this.code(this.codeParam.dws, { data, caller }, { origin: this });
        if (this._attrs.finishSequence.length !== 0) {
            runningStage = types_1.NodeRunningStage.finish;
            let shutByAttrFinish = false;
            let errorInAttrFinish;
            const conditionFinish = {
                data: result,
                attrs: this.allAttrs,
                state: this.state,
                node: this,
                shut: (error) => {
                    shutByAttrFinish = true;
                    if (typeof error === "undefined") {
                        return;
                    }
                    errorInAttrFinish = error;
                },
            };
            for (const attrObj of this._attrs.finishSequence) {
                await attrsStore.normalAttrs[attrObj.name].finish(attrObj.value, conditionFinish);
                if (shutByAttrFinish) {
                    runningStage = types_1.NodeRunningStage.over;
                    --this.state.running;
                    throw { when: types_1.NodeRunningStage.finish, what: errorInAttrFinish };
                }
            }
            result = conditionFinish.data;
        }
        runningStage = types_1.NodeRunningStage.over;
        --this.state.running;
        return result;
    }
    _codeSync(data, caller) {
        ++this.state.runTimes;
        let runningStage = types_1.NodeRunningStage.before;
        ++this.state.running;
        let shutByAttrBefore = false;
        let errorInAttrBefore;
        const conditionBefore = {
            data,
            attrs: this.allAttrs,
            state: this.state,
            node: this,
            shut: (error) => {
                shutByAttrBefore = true;
                if (typeof error === "undefined") {
                    return;
                }
                if (runningStage === types_1.NodeRunningStage.before) {
                    errorInAttrBefore = error;
                }
                else {
                    // Does not report in which operation and which attribute the error occurred for higher performance.
                    this.errorHandler(types_1.NodeRunningStage.before, error);
                }
            },
        };
        for (const attrObj of this._attrs.beforeSequence) {
            attrsStore.normalAttrs[attrObj.name].before(attrObj.value, conditionBefore);
            if (shutByAttrBefore) {
                runningStage = types_1.NodeRunningStage.over;
                --this.state.running;
                throw { when: types_1.NodeRunningStage.before, what: errorInAttrBefore };
            }
        }
        runningStage = types_1.NodeRunningStage.code;
        data = conditionBefore.data;
        let result = this.code(this.codeParam.dws, { data, caller }, { origin: this });
        if (this._attrs.finishSequence.length !== 0) {
            runningStage = types_1.NodeRunningStage.finish;
            let shutByAttrFinish = false;
            let errorInAttrFinish;
            const conditionFinish = {
                data: result,
                attrs: this.allAttrs,
                state: this.state,
                node: this,
                shut: (error) => {
                    shutByAttrFinish = true;
                    if (typeof error === "undefined") {
                        return;
                    }
                    errorInAttrFinish = error;
                },
            };
            for (const attrObj of this._attrs.finishSequence) {
                attrsStore.normalAttrs[attrObj.name].finish(attrObj.value, conditionFinish);
                if (shutByAttrFinish) {
                    runningStage = types_1.NodeRunningStage.over;
                    --this.state.running;
                    throw { when: types_1.NodeRunningStage.finish, what: errorInAttrFinish };
                }
            }
            result = conditionFinish.data;
        }
        runningStage = types_1.NodeRunningStage.over;
        --this.state.running;
        return result;
    }
    codeDwsDataAttrAfterProcess(data, collection) {
        // Speed up the operation of the function.
        if (this._attrs.afterSequence.length === 0) {
            return data;
        }
        let shutByAttrAfter = false;
        let errorInAttrAfter;
        const condition = {
            data,
            attrs: this.allAttrs,
            state: this.state,
            node: this,
            shut: (error) => {
                shutByAttrAfter = true;
                if (typeof error === "undefined") {
                    return;
                }
                errorInAttrAfter = error;
            },
            collection,
        };
        for (const attrObj of this._attrs.afterSequence) {
            attrsStore.normalAttrs[attrObj.name].after(attrObj.value, condition);
            if (shutByAttrAfter) {
                this.state.running--;
                throw { when: types_1.NodeRunningStage.after, what: errorInAttrAfter };
            }
        }
        return condition.data;
    }
}
NormalNode.codeParamDws = {
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
            eventnet_dev_1._debug(`Node.codeParamDws.get: There is no downstream of ID '${id}'.`);
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
                    eventnet_dev_1._debug(`Node.codeParamDws.get: There is no downstream of ID '${id}'.`);
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
                    eventnet_dev_1._debug(`Node.codeParamDws.get: There is no downstream of ID '${index}'.`);
                }
            }
        }
    },
};
exports.NormalNode = NormalNode;
//# sourceMappingURL=normal_node.js.map