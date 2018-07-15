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

export enum ElementType {
    Node,
    RawNode,
    Line,
    SmartLine,
}

export enum LineType {
    arrow,
    pipe,
    twpipe,
}

export interface IElementLike {
    run: (data: any, caller?: IElementLike) => any;
    type: ElementType;
    upstream: IStreamOfElement;
    downstream: IStreamOfElement;
}

export interface IStreamOfElement {
    add: (stream: IElementLike) => void;
    get: (index?: number) => IElementLike[]|IElementLike | undefined;
}

export interface INode extends IElementLike {
    parentNode?: INode;
    readonly code: INodeCode;
}

export interface ILine extends IElementLike {
    id?: string;
}

export enum NodeRunningStage {
    before,
    code,
    after,
    finish,
    over,
}

export type INodeCode = (downstream: INodeCodeDWS, upstream: INodeCodeUPS, thisExec: INodeCodeThisExec) => any;

export interface INodeCodeDWS extends Array<IElementLike> {
    all: (data: any) => void;
    get: (id: string, data?: any) => ILine|undefined;
    dispense: (keyValue: {[key: string]: any}) => void;
}
export interface INodeCodeUPS {
    data: any;
    caller: ILine|undefined;
}
export interface INodeCodeThisExec {
    origin: INode;
}

export interface IAttrsStore {
    normalAttrs: {
        [index: string]: INormalAttr;
    };
    typedAttrs: {
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
export type INormalAttrFunc = (value: any, condition: IAttrFuncCondition) => void;
export interface IAttrFuncCondition {
    data?: any;
    attrs: IDictionary;
    state: IDictionary;
    node: INode;
    shut: (error?: any) => void;
    readonly collection?: boolean;
}
