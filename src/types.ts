export interface IDictionary {
    [index: string]: any;
}

export interface ITypedDictionary<T> {
    [index: string]: T;
}

export interface ICallableElementLike {
    (data?: any, caller?: IElementLike): void;
    origin: IElementLike;
}

export interface IElementLike {
    run: (data: any, caller?: IElementLike) => any;
    upstream: IStreamOfElement;
    downstream: IStreamOfElement;
}

export interface IStreamOfElement {
    add: (stream: IElementLike) => void;
    get: (index?: number) => IElementLike[]|IElementLike | undefined;
    getById(id?: string): IElementLike | ITypedDictionary<IElementLike> | undefined;
}

export interface INode extends IElementLike {
    parentNode?: INode;
    watchers: IDictionary;
}

export interface ILine extends IElementLike {
    id?: string;
}

export enum INodeRunningStage {
    before,
    code,
    after,
    finish,
    over,
}

export type INodeCode = (downstream: INodeCodeDWS, upstream: INodeCodeUPS, thisExec: INodeCodeThisExec) => any;

export interface INodeCodeDWS {
    [index: number]: IElementLike;
    all: (data: any) => void;
    get: (id: string, data?: any) => ILine|undefined;
    dispense: (keyValue: {[key: string]: any}) => void;
    length: number;
}
export interface INodeCodeUPS {
    data: any;
    caller: ILine|undefined;
}
export interface INodeCodeThisExec {
    origin: INode;
}

export interface IAttrStore {
    normalAttr: {
        [index: string]: INormalAttr;
    };
    typedAttr: {
        [index: string]: "number"|"string"|"object"|"symbol"|"boolean"|"function";
    };
}
export interface INormalAttr {
    priority?: number;
    before?: INormalAttrFunc;
    beforePriority?: number;
    after?: INormalAttrFunc;
    afterPriority?: number;
    finish?: INormalAttrFunc;
    finishPriority?: number;
}
export type INormalAttrFunc = (condition: IAttrFuncCondition, currentNode: any, isSync: boolean) => void;
export interface IAttrFuncCondition {
    data?: any;
    attrValue: any;
    shut: (error?: any) => void;
    readonly collection?: boolean;
}
