export interface IDictionary<T = any> {
  [index: string]: T | undefined;
}

export type IPrimitive = 'string' | 'number' | 'boolean' | 'symbol';

/**
 * ElementType
 * Lowest bit: 0 - Node,    1 - Line
 *
 * For Node:
 *   1-th bit: 0 - Stateless,  1 - Stateful
 * For Line:
 *   1-th bit: 0 - Arrow,   1 - Pipe-like
 *   0-th bit: 0 - one-way, 1 - two-way
 */
export enum ElementType {
  Node = 0,
  Stateful = 0b10,

  RawNode = 0b00,
  NormalNode = 0b10,

  /**********************/

  Line = 1,
  Pipelike = 0b10,
  Twoway = 0b100,

  Arrow = 0b001,
  Pipe = 0b011,
  Twpipe = 0b111,
}

export type IUnaryFunction<T, R> = (source: T) => R;

export interface IElementLike {
  // Unique Identifier
  readonly uid: number;

  // the method to run the element
  run(data?: any, caller?: IElementLike): any;

  // the stream of element
  readonly upstream: IElementStream;
  readonly downstream: IElementStream;

  readonly type: number;

  thread(): this;
  thread<A>(op1: IUnaryFunction<this, A>): A;
  thread<A, B>(op1: IUnaryFunction<this, A>, op2: IUnaryFunction<A, B>): B;
  /////////////////////////////////////////////////////////////////////////

  clone?(): IElementLike;
  destroy?(): void;
  readonly state?: IDictionary;
  watchMe?(
    expOrFn: string | ((this: IDictionary, target: IDictionary) => any),
    callback: (newVal: any, oldVal: any) => void,
    {
      deep,
      sync,
      immediate,
    }: {
        deep: boolean,
        sync: boolean,
        immediate: boolean,
      },
  ): () => void;
}

export interface ICallableElementLike {
  (data?: any): void;
  origin: IElementLike;
}

export interface IWatchableElement {
  readonly state: IDictionary;
  watchMe: (
    expOrFn: string | ((this: IDictionary, target: IDictionary) => any),
    callback: (newVal: any, oldVal: any) => void,
    {
      deep,
      sync,
      immediate,
    }: {
        deep: boolean,
        sync: boolean,
        immediate: boolean,
      },
  ) => () => void;
}

export interface IElementStream {
  readonly owner: IElementLike;

  // add an element to the stream
  // this method must be able to de-duplicate
  add(elem: IElementLike): void;

  // return undefined or the element with specified index
  // if there is no parameter, return all the elements (if more than one, return an array)
  get(): Array<IElementLike | undefined> | IElementLike | undefined;

  // delete the element from stream
  del(elem: IElementLike): void;

  // clear all elements in the stream
  clear(): void;
}

export interface IStreamOfNode extends IElementStream {
  readonly owner: INodeLike;
  get(): Array<ILineLike | undefined>;
  get(index: number): ILineLike | undefined;
  add(elem: ILineLike): void;
  del(elem: ILineLike): void;
}

export interface IStreamOfLine extends IElementStream {
  readonly owner: ILineLike;
  get(): INodeLike | undefined;
  add(elem: INodeLike): void;
  del(elem: INodeLike): void;
}

export interface INodeLike extends IElementLike {
  parent: INodeLike | undefined;
  readonly upstream: IStreamOfNode;
  readonly downstream: IStreamOfNode;
  ondestroy?: Array<(this: any, node: any) => void>;
  _errorHandler(when: NodeRunningStage, what?: any, where?: IElementLike[]): void;
}

export interface ILineLike extends IElementLike {
  readonly id: string | undefined;
  readonly upstream: IStreamOfLine;
  readonly downstream: IStreamOfLine;
  classes?: string[];
}

export enum NodeRunningStage {
  before = 1,

  code, /* for nodes taing code as its content */
  child, /* for nodes containing child nodes */

  after,
  over,
}

export type IRawNodeCode =
  (upstream: INodeCodeUPS, downstream: INodeCodeDWS, me: IRawNodeCodeMe) => any;
export type INormalNodeCode =
  (upstream: INodeCodeUPS, downstream: INodeCodeDWS, me: INormalNodeCodeMe) => any;
export interface INodeCodeDWS extends Array<ICallableElementLike | undefined> {
  all: (data?: any) => void;
  ask: (
    askFor: string | string[] | ((line: ILineLike) => boolean),
    data?: any,
  ) => ICallableElementLike[];
  id: (id: string) => ICallableElementLike | undefined;
  dispense: (IdValue_or_IndexValue: IDictionary) => void;
}
export interface INodeCodeUPS {
  data: any;
  caller: ILineLike | undefined;
}
export interface IRawNodeCodeMe {
  origin: INodeLike;
}

export interface INormalNodeCodeMe {
  origin: INodeLike;
  attrs: () => IDictionary;
  allAttrs: () => IDictionary;
  state: IDictionary;
}

export interface IAttrsStore {
  normal: {
    [index: string]: INormalAttr;
  };
  typed: {
    [index: string]: IPrimitive | 'object' | 'function';
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
