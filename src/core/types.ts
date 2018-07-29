import { NodeDwsMethods } from './node-methods';
import { LineStream, NodeErrorStream, NodeStream } from './stream';

export interface IDictionary {
  [index: string]: any;
}

export interface ITypedDictionary<T> {
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
  // the method to run the element
  run: (data?: any, caller?: IElementLike) => any;

  // the stream of element
  // the element must have one of them
  upstream?: IElementStream | IElementStream[];
  downstream?: IElementStream | IElementStream[];
  type: number;
}

export interface IElementStream {
  owner: IElementLike;

  // add an element to the stream
  // this method must be able to de-duplicate
  add: (elem: IElementLike) => void;

  // return undefined or the element with specified index
  // if there is no parameter, return all the elements (if more than one, return an array)
  get: (index?: number) => Array<IElementLike | undefined> | IElementLike | undefined;

  // delete the element from stream
  del: (elem: IElementLike) => void;
}

export interface INodeLike extends IElementLike {
  name: string | undefined;
  parentNode: INodeLike | undefined;
}

export interface INodeHasUps extends INodeLike {
  In: IElementStream;
  upstream: IElementStream | IElementStream[];
}

export interface INodeHasDwsAndErrorReceiver extends INodeLike, NodeDwsMethods {
  Out: IElementStream;
  errorReceiver: IElementStream;
  downstream: [IElementStream, NodeErrorStream];
}

export interface INodeHasDws extends INodeLike, NodeDwsMethods {
  Out: IElementStream;
  downstream: IElementStream | IElementStream[];
}

export interface ILineLike extends IElementLike {
  readonly id: string | undefined;
  classes?: string[];
}

export interface ILineHasUps extends ILineLike {
  upstream: LineStream;
}

export interface ILineHasDws extends ILineLike {
  downstream: LineStream;
}

export enum NodeRunningStage {
  before = 1,
  code,
  after,
  over,
}

export type IRawNodeCode =
  (downstream: INodeCodeDWS, upstream: INodeCodeUPS, thisExec: IRawNodeCodeThisExec) => any;
export type INormalNodeCode =
  (downstream: INodeCodeDWS, upstream: INodeCodeUPS, thisExec: INormalNodeCodeThisExec) => any;
export interface INodeCodeDWS extends Array<ICallableElementLike> {
  all: (data?: any) => void;
  ask: (
    askFor: string | string[] | ((line: ILineLike) => boolean),
    data?: any,
  ) => ICallableElementLike[];
  id: (id: string) => ICallableElementLike;
  dispense: (IdValue_or_IndexValue: IDictionary) => void;
}
export interface INodeCodeUPS {
  data: any;
  caller: ILineHasDws | undefined;
}
export interface IRawNodeCodeThisExec {
  origin: INodeLike;
}

export interface INormalNodeCodeThisExec {
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
  classes?: string | string[];
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
