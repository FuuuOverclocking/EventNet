import { _attrsStore as attrsStore, _debug as debug, defaultState } from "../../eventnet.dev";
import {
    ElementType, IAttrFuncCondition, ICallableElementLike,
    IDictionary, IElementLike, ILine,
    INode, INodeCode, INodeCodeDWS, NodeRunningStage,
} from "../../types";
import { CompatWeakSet } from "../util/compat_weak_map";
import { BasicNode } from "./basic_node";

function def(target: IDictionary, prop: string, value: any, enumerable: boolean = false) {
    Object.defineProperty(target, prop, {
        configurable: true,
        enumerable,
        value,
        writable: true,
    });
}

function converter(obj: IDictionary, prop: string, needWatchLower = 0) {
    if (typeof obj["__" + prop] !== "undefined") {
        if (typeof obj["__" + prop] === "object") {
            obj["__" + prop].__needWatchLower__ =
                Math.max(obj["__" + prop].__needWatchLower__, needWatchLower);
        }
        return;
    }
    def(obj, "__" + prop, obj.prop);
    if (typeof obj.prop === "object") {
        def(obj.prop, "__needWatchLower__", needWatchLower);
    }
    Object.defineProperty(obj, prop, {
        configurable: true,
        enumerable: true,
        get: () => obj["__" + prop],
        set: (value) => {
            obj["__" + prop] = value;
            if (obj.__needWatchLower__ /* If obj.__needWatchLower__ is not undefined or number 0. */
                && typeof value === "object") {
                for (const key of value) {
                    converter(value, key, obj.__needWatchLower__ === 2 ? 2 : 0);
                }
            }
        },
    });
}

const linesWaitingLink: ILine[] = [];

export class NormalNode extends BasicNode implements INode {

    public type = ElementType.NormalNode;

    public state: IDictionary;
    public watchMe(target: string, callback: any) { //////////////////
        target = target.replace(/\s+/g, "");
        const paths = target.split(".");

        if (paths.length === 1) {
            converter(this.state, target);
            return;
        }

        let lastItem = paths[paths.length - 1];
        paths.splice(-1, 1);
        let currentTarget = this.state;
        for (const key of paths) {
            switch (typeof currentTarget[key]) {
                case "undefined":
                    currentTarget[key] = {};
                case "object":
                    converter(currentTarget, key);
                    break;
                default:
                    throw new Error(`EventNet.Node.watchMe: (Node).state.**.${key} is not an object.`);
            }
            currentTarget = currentTarget["__" + key];
        }

        let weakset: any;
        let regRes: RegExpExecArray | null;
        function deepConvert(obj: IDictionary) {
            // Check for circular references.
            if (weakset.has(obj)) { return; }

            weakset.add(obj);
            for (const key of Object.keys(obj)) {
                if (typeof obj[key] === "object") {
                    deepConvert(obj[key]);
                    converter(obj, key, 2);
                } else {
                    converter(obj, key);
                }
            }
        }
        if (lastItem === "*") {
            currentTarget.__needWatchLower__ = 1;
            for (const key of Object.keys(currentTarget)) {
                converter(currentTarget, key);
            }
        } else if (lastItem === "**") {
            currentTarget.__needWatchLower__ = 2;
            weakset = new CompatWeakSet();
            deepConvert(currentTarget);
        } else if (regRes = /^([a-zA-Z\$\_][a-zA-Z0-9\$\_]*)\[\*\]$/.exec(lastItem)) {
            lastItem = regRes[1];
            if (typeof currentTarget[lastItem] === "undefined") {
                currentTarget[lastItem] = [];
            } else if (!Array.isArray(currentTarget[lastItem])) {
                throw new Error(`EventNet.Node.watchMe: (Node).state.**.${lastItem} is not an array.`);
            }
            ///////////////////////////
        } else {
            throw new Error("EventNet.Node.watchMe: Invalid target.");
        }
    }
    private _watchers: IDictionary = []; ////////////////////////////////
    public get watchers() {
        return this._watchers;
    }


    private _attrs: {
        own: IDictionary;
        inherited: IDictionary; // own = Obejct.create(inherited) in constructor
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
    public _setInheritAttrs(attrs: Array<{ name: string, value: any }>) {
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
            if (attrsStore.normal[name].before) {
                this._attrs.beforeSequence.push({
                    name,
                    value: attr[name],
                    priority: attrsStore.normal[name].beforePriority!,
                });
            }
            if (attrsStore.normal[name].after) {
                this._attrs.afterSequence.push({
                    name,
                    value: attr[name],
                    priority: attrsStore.normal[name].afterPriority!,
                });
            }
            if (attrsStore.normal[name].finish) {
                this._attrs.finishSequence.push({
                    name,
                    value: attr[name],
                    priority: attrsStore.normal[name].finishPriority!,
                });
            }
        }

        // Sort attributes based on priority.
        this._attrs.beforeSequence.sort((a, b) => a.priority - b.priority);
        this._attrs.afterSequence.sort((a, b) => b.priority - a.priority);
        this._attrs.finishSequence.sort((a, b) => b.priority - a.priority);
    }

    constructor(attrs: IDictionary, state: IDictionary, code: INodeCode) {
        super(code);
        // Parameter checking, remove in min&mon version.
        if (typeof attrs.sync !== "undefined" && typeof attrs.sync !== "boolean") {
            throw new Error("EventNet.Node: Attribution 'sync' must be true or false.");
        }
        for (const name of Object.keys(attrs)) {
            if (!attrsStore.typed[name] &&
                !attrsStore.normal[name].before &&
                !attrsStore.normal[name].after &&
                !attrsStore.normal[name].finish) {
                debug(`Node: Attribution '${name}' has not been installed.`);
            }
            if (attrsStore.typed[name] &&
                typeof attrs[name] !== attrsStore.typed[name]) {
                throw new Error(
                    `EventNet.Node: The type of attribution '${name}' must be ${attrsStore.typed[name]}.`,
                );
            }
        }

        this.downstream.wrap((line) => {
            const func: ICallableElementLike = ((data?: any) => {
                data = this.codeDwsDataAttrAfterProcess(data, false);
                line.run(data, this);
            }) as ICallableElementLike;
            func.origin = line;
            return func;
        });
        Object.assign(this.downstream.wrappedContent, {
            all: NormalNode.codeParamDws.all.bind(this),
            get: NormalNode.codeParamDws.get.bind(this),
            dispense: NormalNode.codeParamDws.dispense.bind(this),
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

        this.state = Object.assign({}, defaultState, state);

        for (const ups of linesWaitingLink) {
            ups.downstream.add(this);
            this.upstream.add(ups);
        }
        linesWaitingLink.length = 0;
    }
    public run(data: any, caller?: ILine) {
        if (this._attrs.own.sync) {
            try {
                return this._codeSync(data, caller);
            } catch (error) {
                if (typeof error.when !== "undefined") {
                    //////////////////////////////////////////////////////////////
                    if (typeof error.what !== "undefined") {
                        this.errorHandler(error.when, error.what);
                    }
                } else {
                    --this.state.running;
                    this.errorHandler(NodeRunningStage.code, error);
                }
            }
        } else {
            return this._codeAsync(data, caller).catch((error) => {
                if (typeof error.when !== "undefined") {
                    //////////////////////////////////////////////////////////////
                    if (typeof error.what !== "undefined") {
                        this.errorHandler(error.when, error.what);
                    }
                } else {
                    --this.state.running;
                    this.errorHandler(NodeRunningStage.code, error);
                }
            });
        }
        //////////////////////////////////////////////////////////////
        // Try-catch will copy all the variables in the current scope.
    }


    private async _codeAsync(data: any, caller?: ILine): Promise<any> {
        ++this.state.runTimes;

        let runningStage: NodeRunningStage = NodeRunningStage.before;

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
                if (runningStage === NodeRunningStage.before) {
                    errorInAttrBefore = error;
                } else {
                    // Does not report in which operation and which attribute the error occurred for higher performance.
                    this.errorHandler(NodeRunningStage.before, error);
                }
            },
        };
        for (const attrObj of this._attrs.beforeSequence) {
            await attrsStore.normal[attrObj.name].before!(attrObj.value, conditionBefore);
            if (shutByAttrBefore) {
                runningStage = NodeRunningStage.over;
                --this.state.running;
                throw { when: NodeRunningStage.before, what: errorInAttrBefore };
            }
        }

        runningStage = NodeRunningStage.code;
        data = conditionBefore.data;

        let result = await this.code(this.codeParam.dws, { data, caller }, { origin: this });

        if (this._attrs.finishSequence.length !== 0) {
            runningStage = NodeRunningStage.finish;

            let shutByAttrFinish = false;
            let errorInAttrFinish: any;
            const conditionFinish: IAttrFuncCondition = {
                data: result,
                attrs: this.allAttrs,
                state: this.state,
                node: this,
                shut: (error?: any) => {
                    shutByAttrFinish = true;
                    if (typeof error === "undefined") { return; }
                    errorInAttrFinish = error;
                },
            };
            for (const attrObj of this._attrs.finishSequence) {
                await attrsStore.normal[attrObj.name].finish!(attrObj.value, conditionFinish);
                if (shutByAttrFinish) {
                    runningStage = NodeRunningStage.over;
                    --this.state.running;
                    throw { when: NodeRunningStage.finish, what: errorInAttrFinish };
                }
            }
            result = conditionFinish.data;
        }

        runningStage = NodeRunningStage.over;
        --this.state.running;

        return result;
    }
    private _codeSync(data: any, caller?: ILine): any {
        ++this.state.runTimes;

        let runningStage: NodeRunningStage = NodeRunningStage.before;

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
                if (runningStage === NodeRunningStage.before) {
                    errorInAttrBefore = error;
                } else {
                    // Does not report in which operation and which attribute the error occurred for higher performance.
                    this.errorHandler(NodeRunningStage.before, error);
                }
            },
        };
        for (const attrObj of this._attrs.beforeSequence) {
            attrsStore.normal[attrObj.name].before!(attrObj.value, conditionBefore);
            if (shutByAttrBefore) {
                runningStage = NodeRunningStage.over;
                --this.state.running;
                throw { when: NodeRunningStage.before, what: errorInAttrBefore };
            }
        }

        runningStage = NodeRunningStage.code;
        data = conditionBefore.data;

        let result = this.code(this.codeParam.dws, { data, caller }, { origin: this });

        if (this._attrs.finishSequence.length !== 0) {
            runningStage = NodeRunningStage.finish;

            let shutByAttrFinish = false;
            let errorInAttrFinish: any;
            const conditionFinish: IAttrFuncCondition = {
                data: result,
                attrs: this.allAttrs,
                state: this.state,
                node: this,
                shut: (error?: any) => {
                    shutByAttrFinish = true;
                    if (typeof error === "undefined") { return; }
                    errorInAttrFinish = error;
                },
            };
            for (const attrObj of this._attrs.finishSequence) {
                attrsStore.normal[attrObj.name].finish!(attrObj.value, conditionFinish);
                if (shutByAttrFinish) {
                    runningStage = NodeRunningStage.over;
                    --this.state.running;
                    throw { when: NodeRunningStage.finish, what: errorInAttrFinish };
                }
            }
            result = conditionFinish.data;
        }

        runningStage = NodeRunningStage.over;
        --this.state.running;

        return result;
    }
    private codeParam: { dws: INodeCodeDWS };
    private static codeParamDws = {
        all(this: NormalNode, data: any) {
            if (typeof data !== "undefined") {
                data = this.codeDwsDataAttrAfterProcess(data, false);
            }
            for (const dws of (this.downstream.get() as IElementLike[])) {
                dws.run(data, this);
            }
        },
        get(this: NormalNode, id: string, data?: any) {
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
        dispense(this: NormalNode, IdValue_or_IndexValue: IDictionary) {
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
    protected codeDwsDataAttrAfterProcess(data: any, collection: boolean) {
        // Speed up the operation of the function.
        if (this._attrs.afterSequence.length === 0) {
            return data;
        }

        let shutByAttrAfter = false;
        let errorInAttrAfter: any;

        const condition: IAttrFuncCondition = {
            data,
            attrs: this.allAttrs,
            state: this.state,
            node: this,
            shut: (error?: any) => {
                shutByAttrAfter = true;
                if (typeof error === "undefined") { return; }
                errorInAttrAfter = error;
            },
            collection,
        };
        for (const attrObj of this._attrs.afterSequence) {
            attrsStore.normal[attrObj.name].after!(attrObj.value, condition);
            if (shutByAttrAfter) {
                this.state.running--;
                throw { when: NodeRunningStage.after, what: errorInAttrAfter };
            }
        }
        return condition.data;
    }

}
