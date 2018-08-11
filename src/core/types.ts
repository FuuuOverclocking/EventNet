import { NodeDwsMethods } from './node-methods';
import { LineStream, NodeErrorStream, NodeStream } from './stream';

export interface IDictionary<T = any> {
  [index: string]: T | undefined;
}

export type IPrimitive = 'string' | 'number' | 'boolean' | 'symbol';

export interface ICallableElementLike {
  (data?: any): void;
  origin: IElementLike;
}

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
  RawNode = 0b00,
  NormalNode = 0b10,
  Arrow = 0b001,
  Pipe = 0b011,
  Twpipe = 0b111,
}

export interface IElementLike {
  // Unique Identifier
  uid: number;

  // the method to run the element
  run: (data?: any, caller?: IElementLike) => any;

  // the stream of element
  // the element must have one of them
  upstream?: IElementStream | IElementStream[];
  downstream?: IElementStream | IElementStream[];

  type: number;

  clone?: () => IElementLike;
  destroy?: () => void;
  state?: IDictionary;
  watchMe?: (
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

export interface IWatchableElement {
  state: IDictionary;
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
  add: (elem: IElementLike) => void;

  // return undefined or the element with specified index
  // if there is no parameter, return all the elements (if more than one, return an array)
  get: (index?: number) => Array<IElementLike | undefined> | IElementLike | undefined;

  // delete the element from stream
  del: (elem: IElementLike) => void;
}

export interface IStreamOfNode extends IElementStream {
  readonly owner: INodeLike;
}

export interface IStreamOfLine extends IElementStream {
  readonly owner: ILineLike;
}

export interface INodeLike extends IElementLike {
  parent: INodeLike | undefined;
  upstream?: IStreamOfNode | IStreamOfNode[];
  downstream?: IStreamOfNode | IStreamOfNode[];
  destory?: () => void;
  ondestory?: Array<(this: INodeLike, node: INodeLike) => void>;
}

export interface INodeHasUps extends INodeLike {
  In: IStreamOfNode;
  upstream: IStreamOfNode | IStreamOfNode[];
}

export interface INodeHasDwsAndErrorReceiver extends INodeLike, NodeDwsMethods {
  Out: IStreamOfNode;
  Err: IStreamOfNode;
  downstream: [IStreamOfNode, NodeErrorStream];
}

export interface INodeHasDws extends INodeLike, NodeDwsMethods {
  Out: IStreamOfNode;
  downstream: IStreamOfNode | IStreamOfNode[];
}

export interface ILineLike extends IElementLike {
  readonly id: string | undefined;
  classes?: string[];
}

export interface ILineHasUps extends ILineLike {
  upstream: IStreamOfLine;
}

export interface ILineHasDws extends ILineLike {
  downstream: IStreamOfLine;
}

export enum NodeRunningStage {
  before = 1,
  code,
  after,
  over,
}

export type IRawNodeCode =
  (downstream: INodeCodeDWS, upstream: INodeCodeUPS, me: IRawNodeCodeMe) => any;
export type INormalNodeCode =
  (downstream: INodeCodeDWS, upstream: INodeCodeUPS, me: INormalNodeCodeMe) => any;
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
  caller: ILineHasDws | undefined;
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

export interface ILineOptions {
  id?: string;
  classes?: string[];
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
