import { Line, Node } from './core';
import { BasicNodeDws } from './core/builtin/basicNode';
import { NormalNode } from './core/builtin/normalNode';
import { Element } from './core/element';
import { LineStream, NodeStream, Stream } from './core/stream';

export interface ElementLike<T = any> {
  // the method to activate the element
  run(data?: any, options?: { caller?: Element; [i: string]: any; }): T;

  readonly ups?: Stream;
  readonly dws?: Stream;

  readonly isLine?: boolean;
  readonly uid?: number;
  readonly type?: number;
  clone?(): Element;
}

export interface CallableElement<T = any> {
  (data?: any): T;
  origin: Element<T>;
}

export interface WatchableObject {
  watchMe(
    expOrFn: string | ((this: any, target: any) => any),
    callback: (newVal: any, oldVal: any) => void,
    options?: {
      deep?: boolean,
      sync?: boolean,
      immediate?: boolean,
    },
  ): () => void;
}

export interface NodeLike<T = any>
  extends ElementLike<T> {
  run(data?: any, options?: { caller?: Line; [i: string]: any; }): T;

  readonly ups?: NodeStream;
  readonly dws?: NodeStream;

  readonly isLine?: false;
}

export interface LineLike<T = any>
  extends ElementLike<T> {
  run(data?: any, options?: { caller?: Node; [i: string]: any; }): T;

  readonly ups?: LineStream;
  readonly dws?: LineStream;
  readonly isLine: true;
}

export type UnaryFunction<arg, ret> = (param: arg) => ret;

export enum NodeRunPhase {
  before = 1,
  code, /* for nodes taing code as its content */
  child, /* for nodes containing child nodes */
  after,
  over,
}

export enum ElementType {
  Arrow = 1,
  Pipe,
  NormalNode,
  RawNode,
}

export interface BasicNodeOpt {
  caller?: Line;
  runStack?: number[];
  [i: string]: any;
}

export type NormalNodeCode<T, stateType, originType> = (param: {
  dws: BasicNodeDws,
  ups: any,
  data?: any,
  origin: originType,
  state: stateType,
  store: { [i: string]: any },
}) => T;

export type RawNodeCode<T, originType> = (param: {
  dws: BasicNodeDws,
  ups: any,
  data?: any,
  origin: originType,
}) => T;

export enum BasicNodeMode {
  sync = 1,
  queue,
  micro,
  macro,
  animationFrame,
}

export interface NodeAttr {
  before?: NodeAttrFn;
  beforePriority?: number;
  after?: NodeAttrFn;
  afterPriority?: number;
}

export type NodeAttrFn = (
  value: any,
  condition: {
    data: any;
    attrs: { [i: string]: any | NodeAttr };
    state: { [i: string]: any };
    node: NormalNode;
    shut: (error?: any) => void;
  },
) => void;
