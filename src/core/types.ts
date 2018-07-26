export interface IDictionary {
    [index: string]: any;
}

export interface ITypedDictionary<T> {
    [index: string]: T | undefined;
}

export type IPrimitive = "string" | "number" | "boolean" | "symbol";

export interface ICallableElementLike {
    (data?: any, caller?: IElement): void;
    origin: IElement;
}

/**
 * ElementType
 * Lowest bit: 0 - Node,    1 - Line
 *
 * For Node:
 *   1-th bit: 0 - Normal,  1 - Raw
 * For Line:
 *   1-th bit: 0 - Arrow,   1 - Some kinds of pipe
 *   0-th bit: 0 - one-way, 1 - two-way
 */
export enum ElementType {
    NormalNode = 0b000,
    RawNode = 0b010,
    Arrow = 0b001,
    Pipe = 0b011,
    Twpipe = 0b111,
}

export interface IElementLike {
    run: (data: any, caller?: IElementLike) => any;
    upstream: IStreamOfElement;
    downstream: IStreamOfElement;
    type: number;
}

export interface IElement extends IElementLike {
    _isEN: boolean;
}

export interface IStreamOfElement {
    add: (elem: IElement) => void;
    get: (index?: number) => Array<IElementLike | undefined> | IElementLike | undefined;
    del: (elem: IElement) => void;
}

export interface INodeLike extends IElementLike {
    name?: string;
    parentNode?: INodeLike;
}

export interface ILineLike extends IElement {
    id?: string;
    features: string[];
}

export enum NodeRunningStage {
    before = 1,
    code,
    after,
    over,
}

export type INodeCode = (downstream: INodeCodeDWS, upstream: INodeCodeUPS, thisExec: INodeCodeThisExec) => any;

export interface INodeCodeDWS extends Array<IElement> {
    all: (data: any) => void;
    get: (id: string, data?: any) => ILineLike | undefined;
    dispense: (keyValue: { [key: string]: any }) => void;
}
export interface INodeCodeUPS {
    data: any;
    caller: ILineLike | undefined;
}
export interface INodeCodeThisExec {
    origin: INodeLike;
}

export interface IAttrsStore {
    normal: {
        [index: string]: INormalAttr;
    };
    typed: {
        [index: string]: IPrimitive | "object" | "function";
    };
}
export interface INormalAttr {
    priority?: number;
    before?: INormalAttrFunc;
    beforePriority?: number;
    after?: INormalAttrFunc;
    afterPriority?: number;
}
export type INormalAttrFunc = (value: any, condition: IAttrFuncCondition) => void;
export interface IAttrFuncCondition {
    data: any;
    attrs: IDictionary;
    state: IDictionary;
    node: INodeLike;
    shut: (error?: any) => void;
}

export interface ISimpleSet<T> {
    has(value: T): boolean;
    add(value: T): this;
    clear(): void;
}
export interface ISimpleSetConstructor {
    new(): ISimpleSet<any>;
    new <T>(values?: ReadonlyArray<T> | null): ISimpleSet<T>;
    readonly prototype: ISimpleSet<any>;
}
