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

/**
 * ElementType
 * Lowest bit: 0 - Node,    1 - Line
 *
 * For Node:
 *   2-th bit: 0 - Normal,  1 - Raw
 * For Line:
 *   2-th bit: 0 - Normal,  1 - Smart
 *   1-th bit: 0 - Arrow,   1 - Some kind of pipe
 *   0-th bit: 0 - one-way, 1 - two-way
 *
 * @readonly
 * @enum {number}
 */
export enum ElementType {
    NormalNode = 0b0000,
    RawNode = 0b0010,
    Arrow = 0b0001,
    SmartArrow = 0b0011,
    Pipe = 0b0101,
    SmartPipe = 0b0111,
    Twpipe = 0b1101,
    SmartTwpipe = 0b1111,
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
    normal: {
        [index: string]: INormalAttr;
    };
    typed: {
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

export interface ISimpleSet<T> {
  has(value: T): boolean;
  add(value: T): this;
  clear(): void;
}
export interface ISimpleSetConstructor {
    new (): ISimpleSet<any>;
    new <T>(values?: ReadonlyArray<T> | null): ISimpleSet<T>;
    readonly prototype: ISimpleSet<any>;
}
