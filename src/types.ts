import { Node } from './core';
import { BasicNode, BasicNodeDws } from './core/builtin/basicNode';
import { NormalNode } from './core/builtin/normalNode';
import { Element } from './core/element';
import { Stream } from './core/stream';

export interface ElementLike<T = any> {
  // the method to activate the element
  run(data?: any, caller?: Element): T;

  readonly ups?: Stream;
  readonly dws?: Stream;

  readonly isLine?: boolean;
  readonly uid?: number;
  readonly type?: number;
  clone?(): this;
}

export interface CallableElement<T = any> {
  (data?: any): T;
  origin: Element<T>;
}

export interface NodeLike<T = any>
  extends ElementLike<T> {
  readonly isLine?: false;
}

export interface LineLike<T = any>
  extends ElementLike<T> {
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

export type BasicNodeCode<T, originType, stateType = any> = (param: {
  dws: BasicNodeDws,
  ups: any,
  data?: any,
  origin: originType,
  state?: stateType,
  store: any,
}) => T;

export type NormalNodeCode<T, stateType, originType> = (param: {
  dws: BasicNodeDws,
  ups: any,
  data?: any,
  origin: originType,
  state: stateType,
  store: { [i: string]: any },
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
