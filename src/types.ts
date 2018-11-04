import { Line, Node } from './core';
import { BasicNodeDws } from './core/builtin/basicNode';
import { FullNode } from './core/builtin/fullNode';
import { Element } from './core/element';
import { Watcher } from './core/observer/watcher';
import { LinePort, NodePort, Port } from './core/port';

export interface ElementLike<T = any> {
  // the method to activate the element
  run(data?: any, options?: { caller?: Element; [i: string]: any; }): T;

  readonly ups?: Port;
  readonly dws?: Port;

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
    }
  ): () => void;
  watchers: Watcher[];
}

export interface NodeLike<T = any>
  extends ElementLike<T> {
  run(data?: any, options?: { caller?: Line; [i: string]: any; }): T;

  readonly ups?: NodePort;
  readonly dws?: NodePort;

  readonly isLine?: false;
}

export interface LineLike<T = any>
  extends ElementLike<T> {
  run(data?: any, options?: { caller?: Node; [i: string]: any; }): T;

  readonly ups?: LinePort;
  readonly dws?: LinePort;
  readonly isLine: true;
}

export type UnaryFunction<arg, ret> = (param: arg) => ret;

export enum NodeRunPhase {
  attr = 1,
  code, /* for nodes taing code as its content */
  child, /* for nodes containing child nodes */
}

export enum ElementType {
  Arrow = 1,
  Pipe,
  FullNode,
  ComNode,
  RawNode,
}

export interface BasicNodeOpt {
  caller?: Line;
  runStack?: number[];
  [i: string]: any;
}

export type FullNodeCode<T, stateType, originType> = (param: {
  dws: BasicNodeDws,
  ups: any,
  data?: any,
  origin: originType,
  state: stateType,
  store: { [i: string]: any },
}) => T;

export type ComNodeCode<T, originType> = (param: {
  dws: BasicNodeDws,
  ups: any,
  data?: any,
  origin: originType,
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
    node: FullNode;
    shut: (error?: any) => void;
  }
) => void;
