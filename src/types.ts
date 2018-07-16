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
    NormalNode = 0b0000,
    RawNode = 0b0010,
    Arrow = 0b0001,
    SmartArrow = 0b0011,
    Pipe = 0b0101,
    SmartPipe = 0b0111,
    Twpipe = 0b1001,
    SmartTwpipe = 0b1011,
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
    errorReceiver: ILine;
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
    data: any;
    attrs: IDictionary;
    state: IDictionary;
    node: INode;
    shut: (error?: any) => void;
    readonly collection?: boolean;
}
