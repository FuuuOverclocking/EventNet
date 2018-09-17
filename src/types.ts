import { Element } from './core/element';
import { Stream } from './core/stream';

export interface ElementLike<T = any> {
  // the method to activate the element
  run(data?: any, caller?: Element): T;

  readonly upstream?: Stream;
  readonly downstream?: Stream;

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
}
