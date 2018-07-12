/**
 * EventNet
 * Created by X.Y.Z. at March 3rd, 2018.
 * @version 0.0.2
 */

import _debug = require("debug");
const debug = _debug("EventNet");
import {
    IAttrFuncCondition, IAttrsStore, ICallableElementLike, IDictionary, IElementLike, ILine,
    INode, INodeCode, INodeCodeDWS, INodeRunningStage, INormalAttr, INormalAttrFunc,
    IStreamOfElement, ITypedDictionary
} from "./types";

interface IEventNet {
    (attrs: IDictionary, state: IDictionary, code: INodeCode): Node;
    (attrs: IDictionary, code: INodeCode): Node;
    (code: INodeCode): Node;
    installAttr: typeof installAttr;
    getAttrDefinition: (name: string) =>
        string
        | [INormalAttrFunc | undefined, INormalAttrFunc | undefined, INormalAttrFunc | undefined]
        | undefined;
    defaultState: any;
}

/**
 * Create a EventNet Node.
 * @param {Object} [attrs] set the attributes of Node
 * @param {Object} [states] set the initial state of Node, the `attrs` must be set firstly to set this item
 * @param {Function} code - set the code that is executed when the Node runs
 * @return {Node} a new normal EventNet Node
 */
const en = ((attrs: any, state?: any, code?: any) => {
    if (typeof attrs === "object" && typeof state === "object" && typeof code === "function") {
        return new Node(attrs, state, code);
    } else if (typeof attrs === "object" && typeof state === "function") {
        return new Node(attrs, {}, state);
    } else {
        return new Node({}, {}, attrs);
    }
}) as IEventNet;

export = en;

// The store of attributes.
const attrsStore: IAttrsStore = {
    normalAttrs: {},
    typedAttrs: {},
};

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

const linesWaitingLink: ILine[] = [];
class StreamOfNode implements IStreamOfElement {
    public add(line: ILine) {
        this.content.push(line);

        // tslint:disable-next-line:no-unused-expression
        this.wrappedContent && this.wrappedContent.push(this.wrapper(line));

        if (typeof line.id !== "undefined") {
            // Parameter checking, remove in min&mon version.
            if (typeof this.contentById[line.id] !== "undefined") {
                throw new Error("EventNet.StreamOfNode.add: The stream of the same id already exists.");
            }

            this.contentById[line.id] = line;
        }
    }
    public get(index?: number): ILine | ILine[] | undefined {
        return typeof index === "undefined" ? this.content : this.content[index];
    }
    public getById(id?: string): ILine | ITypedDictionary<ILine> | undefined {
        return typeof id === "undefined" ? this.contentById : this.contentById[id];
    }
    private content: ILine[] = [];
    private contentById: ITypedDictionary<ILine> = {};
    public wrappedContent: any;
    private wrapper: (line: ILine) => any;
    constructor(wrapper?: (line: ILine) => any) {
        // tslint:disable-next-line:no-unused-expression
        wrapper && (this.wrappedContent = []) && (this.wrapper = wrapper);
    }
}

class Node implements INode {
    public upstream = new StreamOfNode();
    public downstream = new StreamOfNode((line) => {
        const func: ICallableElementLike = ((data?: any) => {
            data = this.codeDwsDataAttrAfterProcess(data, false);
            line.run(data, this);
        }) as ICallableElementLike;
        func.origin = line;
        return func;
    });
    public parentNode: INode | undefined = void 0;


    public state: IDictionary;
    private _watchers: IDictionary = []; ////////////////////////////////
    public get watchers() {
        return this._watchers;
    }


    private _attrs: {
        own: IDictionary;
        inherited: IDictionary; // own = Obejct.create(inherited)
        beforeSequence: Array<{ name: string, value: any, priority: number }>;
        afterSequence: Array<{ name: string, value: any, priority: number }>;
        finishSequence: Array<{ name: string, value: any, priority: number }>;
    };
    public get attrs(): IDictionary {
        // Only the clone with its own property is exposed,
        // so modifying `attr` is invalid.
        // The inherited property is not exposed.
        return Object.assign({}, this._attrs.own);
    }
    public get allAttrs(): IDictionary {
        return Object.assign({}, this._attrs.inherited, this._attrs.own);
    }
    public setAttrs(attrs: Array<{ name: string, value: any }>) {
        // Coding suggestion, remove in min&mon version.
        debug("Node.setAttr: Modify attribute while the Node is running may cause unknown errors.");
        for (const attr of attrs) {
            this._attrs.own[attr.name] = attr.value;
        }
        this.sortAttrs();
    }
    public setInheritAttrs(attrs: Array<{ name: string, value: any }>) {
        for (const attr of attrs) {
            this._attrs.inherited[attr.name] = attr.value;
        }
        this.sortAttrs();
    }
    private sortAttrs() {
        this._attrs.beforeSequence.length = 0;
        this._attrs.afterSequence.length = 0;
        this._attrs.finishSequence.length = 0;

        const attr = this._attrs.own;

        // For-in will traverse all the attributes of Node, including its own and inherited.
        for (const name in attr) {
            if (typeof attr[name] === "undefined") { continue; }
            if (attrsStore.normalAttrs[name].before) {
                this._attrs.beforeSequence.push({
                    name,
                    value: attr[name],
                    priority: attrsStore.normalAttrs[name].beforePriority!
                });
            }
            if (attrsStore.normalAttrs[name].after) {
                this._attrs.afterSequence.push({
                    name,
                    value: attr[name],
                    priority: attrsStore.normalAttrs[name].afterPriority!
                });
            }
            if (attrsStore.normalAttrs[name].finish) {
                this._attrs.finishSequence.push({
                    name,
                    value: attr[name],
                    priority: attrsStore.normalAttrs[name].finishPriority!
                });
            }
        }

        // Sort attributes based on priority.
        this._attrs.beforeSequence.sort((a, b) => a.priority - b.priority);
        this._attrs.afterSequence.sort((a, b) => b.priority - a.priority);
        this._attrs.finishSequence.sort((a, b) => b.priority - a.priority);
    }

    constructor(attrs: IDictionary, state: IDictionary, code: INodeCode) {

        // Parameter checking, remove in min&mon version.
        if (typeof attrs.sync !== "undefined" && typeof attrs.sync !== "boolean") {
            throw new Error("EventNet.Node: Attribution 'sync' must be true or false.");
        }
        for (const name of Object.keys(attrs)) {
            if (!attrsStore.typedAttrs[name] &&
                !attrsStore.normalAttrs[name].before &&
                !attrsStore.normalAttrs[name].after &&
                !attrsStore.normalAttrs[name].finish) {
                debug(`Node: Attribution '${name}' has not been installed.`);
            }
            if (attrsStore.typedAttrs[name] &&
                typeof attrs[name] !== attrsStore.typedAttrs[name]) {
                throw new Error(
                    `EventNet.Node: The type of attribution '${name}' must be ${attrsStore.typedAttrs[name]}.`
                );
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

        this._attrs = {} as any;
        this._attrs.inherited = {};
        this._attrs.own = Object.assign(Object.create(this._attrs.inherited), attrs);
        if (typeof this._attrs.own.sync === "undefined") {
            this._attrs.own.sync = false;
        }
        this.sortAttrs();

        this.state = Object.assign({}, en.defaultState, state);

        for (const ups of linesWaitingLink) {
            ups.downstream.add(this);
            this.upstream.add(ups);
        }
        linesWaitingLink.length = 0;
    }
    public run(data: any, caller?: IElementLike) {
        if (this._attrs.own.sync) {
            try {
                return this._codeSync(data, caller);
            } catch (error) {
                ////////////////////////////////////////////////////////////////
            }
        } else {
            return this._codeAsync(data, caller).catch((error) => {
                ////////////////////////////////////////////////////////////////
            });
        }
        //////////////////////////////
        // Try-catch will copy all the variables in the current scope.
    }

    public readonly code: INodeCode;

    private _errorReceiver = void 0;
    public set errorReceiver( ILine) {

    }
    private errorHandler(when: INodeRunningStage, what?: any) {
        //////////////////////////////////////////////////////////////////////////////////
    }
    private async _codeAsync(data: any, caller?: ILine): Promise<any> {
        ++this.state.runTimes;

        let runningStage: INodeRunningStage = INodeRunningStage.before;

        ++this.state.running;

        let shutByAttrBefore = false;
        let errorInAttrBefore: any;
        const conditionBefore: IAttrFuncCondition = {
            data,
            attrs: this.allAttrs,
            state: this.state,
            node: this,
            shut: (error?: any) => {
                shutByAttrBefore = true;
                if (typeof error === "undefined") { return; }
                if (runningStage === INodeRunningStage.before) {
                    errorInAttrBefore = error;
                } else {
                    // Does not report in which operation and which attribute the error occurred for higher performance.
                    this.errorHandler(INodeRunningStage.before, error);
                }
            },
        };
        for (const attrObj of this._attrs.beforeSequence) {
            await attrsStore.normalAttrs[attrObj.name].before!(attrObj.value, conditionBefore);
            if (shutByAttrBefore) {
                --this.state.running;
                throw { subject: INodeRunningStage.before, errorInAttrBefore };
            }
        }
        runningStage = INodeRunningStage.code;
        data = conditionBefore.data;

        const result = await this.code(this.codeParam.dws, { data, caller }, { origin: this });

        if (this.attrFinishSequence.length !== 0) {
            runningStage = INodeRunningStage.finish;

            let shutByAttrFinish = false;
            let errorInAttrFinish: any;
            const conditionFinish: IAttrFuncCondition = {
                attrValue: null,
                shut: (error?: any) => {
                    shutByAttrFinish = true;
                    if (typeof error === "undefined") { return; }
                    errorInAttrFinish = error;
                },
            };
            for (const attrObj of this.attrFinishSequence) {
                conditionBefore.attrValue = attrObj.value;
                await attrsStore.normalAttrs[attrObj.name].finish!(conditionFinish, this, this._attr.sync);
                if (shutByAttrFinish) {
                    --this.state.running;
                    throw { subject: INodeRunningStage.finish, errorInAttrFinish };
                }
            }
        }

        runningStage = INodeRunningStage.over;
        --this.state.running;

        return result;
    }
    private _codeSync(data: any, caller?: ILine): any {
        let runningStage: INodeRunningStage = INodeRunningStage.before;

        this.state.running++;

        let shutByAttrBefore = false;
        let errorInAttrBefore: any;
        const conditionBefore: IAttrFuncCondition = {
            data,
            attrValue: null,
            shut: (error?: any) => {
                shutByAttrBefore = true;
                if (typeof error === "undefined") { return; }
                if (runningStage === INodeRunningStage.before) {
                    errorInAttrBefore = error;
                } else {
                    // Does not report in which operation and which attribute the error occurred for higher performance.
                    this.errorHandler(INodeRunningStage.before, error);
                }
            },
        };
        for (const attrObj of this.attrBeforeSequence) {
            conditionBefore.attrValue = attrObj.value;
            attrsStore.normalAttrs[attrObj.name].before!(conditionBefore, this, this._attr.sync);
            if (shutByAttrBefore) {
                this.state.running--;
                throw { subject: INodeRunningStage.before, errorInAttrBefore };
            }
        }
        runningStage = INodeRunningStage.code;
        data = conditionBefore.data;

        const result = this.code(this.codeParam.dws, { data, caller }, { origin: this });

        if (this.attrFinishSequence.length !== 0) {
            runningStage = INodeRunningStage.finish;

            let shutByAttrFinish = false;
            let errorInAttrFinish: any;
            const conditionFinish: IAttrFuncCondition = {
                attrValue: null,
                shut: (error?: any) => {
                    shutByAttrFinish = true;
                    if (typeof error === "undefined") { return; }
                    errorInAttrFinish = error;
                },
            };
            for (const attrObj of this.attrFinishSequence) {
                conditionBefore.attrValue = attrObj.value;
                attrsStore.normalAttrs[attrObj.name].finish!(conditionFinish, this, this._attr.sync);
                if (shutByAttrFinish) {
                    this.state.running--;
                    throw { subject: INodeRunningStage.finish, errorInAttrFinish };
                }
            }
        }

        runningStage = INodeRunningStage.over;
        this.state.running--;

        return result;
    }
    private codeParam: { dws: INodeCodeDWS };
    private static codeParamDws = {
        all(this: Node, data: any) {
            if (typeof data !== "undefined") {
                data = this.codeDwsDataAttrAfterProcess(data, false);
            }
            for (const dws of (this.downstream.get() as IElementLike[])) {
                dws.run(data, this);
            }
        },
        get(this: Node, id: string, data?: any) {
            const downstream = this.downstream.getById(id);

            // Downstream presence checking, remove in min&mon version.
            if (typeof downstream === "undefined") {
                debug(`Node.codeParamDws.get: There is no downstream of ID '${id}'.`);
                return void 0;
            }

            if (typeof data !== "undefined") {
                data = this.codeDwsDataAttrAfterProcess(data, false);
                (downstream as ILine).run(data, this);
            }
            return downstream;
        },
        // tslint:disable-next-line:variable-name
        dispense(this: Node, IdValue_or_IndexValue: IDictionary) {
            IdValue_or_IndexValue = this.codeDwsDataAttrAfterProcess(IdValue_or_IndexValue, true);
            let downstream: ILine | undefined;
            if (isNaN(Number(Object.keys(IdValue_or_IndexValue)[0]))) {
                // Identify 'keyValue' with ID-value type.
                for (const id of Object.keys(IdValue_or_IndexValue)) {
                    downstream = this.downstream.getById(id) as ILine | undefined;

                    // Downstream presence checking, remove in min&mon version.
                    if (typeof downstream !== "undefined") {
                        downstream.run(IdValue_or_IndexValue[id], this);
                    } else {
                        debug(`Node.codeParamDws.get: There is no downstream of ID '${id}'.`);
                    }
                }
            } else {
                // Identify 'keyValue' with index-value type.
                // tslint:disable-next-line:forin
                for (const index in IdValue_or_IndexValue) {
                    downstream = this.downstream.get(Number(index)) as ILine | undefined;

                    // Downstream presence checking, remove in min&mon version.
                    if (typeof downstream !== "undefined") {
                        downstream.run(IdValue_or_IndexValue[index], this);
                    } else {
                        debug(`Node.codeParamDws.get: There is no downstream of ID '${index}'.`);
                    }
                }
            }
        },
    };
    private codeDwsDataAttrAfterProcess(data: any, collection: boolean) {
        // Speed up the operation of the function.
        if (this.attrAfterSequence.length === 0) {
            return data;
        }

        let shutByAttrAfter = false;
        let errorInAttrAfter: any;

        const condition: IAttrFuncCondition = {
            data,
            attrValue: null,
            shut: (error?: any) => {
                shutByAttrAfter = true;
                if (typeof error === "undefined") { return; }
                errorInAttrAfter = error;
            },
            collection,
        };
        for (const attrObj of this.attrAfterSequence) {
            condition.attrValue = attrObj.value;
            attrsStore.normalAttrs[attrObj.name].after!(condition, this, this._attr.sync);
            if (shutByAttrAfter) {
                this.state.running--;
                throw { subject: INodeRunningStage.after, errorInAttrAfter };
            }
        }
        return condition.data;
    }
}
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
