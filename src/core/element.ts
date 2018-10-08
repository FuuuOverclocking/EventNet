import { ElementLike, LineLike, UnaryFunction } from '../types';
import { debug } from './debug';
import { Line } from './line';
import { Node } from './node';
import { LineStream, NodeStream, Stream } from './stream';
import { isObject, setProto } from './util/index';

// uid will start at 1, as 0 is a falsy value
let globalElementUid = 0;
export function getUid() {
  return ++globalElementUid;
}

type UF<A, B> = UnaryFunction<A, B>;

export interface Element<T = any> {
  readonly uid: number;
  run(data?: any, opt?: { caller?: Element; [i: string]: any; }): T;
  readonly ups: Stream;
  readonly dws: Stream;
  readonly isLine: boolean;
  readonly type?: number;
  generateIdentity(): { [field: string]: any };
  clone?(): Element;

  // tslint:disable:max-line-length
  biu(): this;
  biu<A>(op1: UF<this, A>): A;
  biu<A, B>(op1: UF<this, A>, op2: UF<A, B>): B;
  biu<A, B, C>(op1: UF<this, A>, op2: UF<A, B>, op3: UF<B, C>): C;
  biu<A, B, C, D>(op1: UF<this, A>, op2: UF<A, B>, op3: UF<B, C>, op4: UF<C, D>): D;
  biu<A, B, C, D, E>(op1: UF<this, A>, op2: UF<A, B>, op3: UF<B, C>, op4: UF<C, D>, op5: UF<D, E>): E;
  biu<A, B, C, D, E, F>(op1: UF<this, A>, op2: UF<A, B>, op3: UF<B, C>, op4: UF<C, D>, op5: UF<D, E>, op6: UF<E, F>): F;
  biu<A, B, C, D, E, F, G>(op1: UF<this, A>, op2: UF<A, B>, op3: UF<B, C>, op4: UF<C, D>, op5: UF<D, E>, op6: UF<E, F>, op7: UF<F, G>): G;
  biu<A, B, C, D, E, F, G, H>(op1: UF<this, A>, op2: UF<A, B>, op3: UF<B, C>, op4: UF<C, D>, op5: UF<D, E>, op6: UF<E, F>, op7: UF<F, G>, op8: UF<G, H>): H;
  biu<A, B, C, D, E, F, G, H, I>(op1: UF<this, A>, op2: UF<A, B>, op3: UF<B, C>, op4: UF<C, D>, op5: UF<D, E>, op6: UF<E, F>, op7: UF<F, G>, op8: UF<F, G>): I;
  // tslint:enable:max-line-length
}

export namespace Element {

  /**
   * Trying to transform an object into Node or Line
   * @param {boolean} [el.isLine] Used to determine the type of Element
   */
  export function ify<T extends ElementLike>(el: T) {
    if (process.env.NODE_ENV && (!isObject(el) || typeof el.run !== 'function')) {
      debug('ElementifyParam', void 0, new Error());
    }

    const _el: any = el;
    const isLine = _el.isLine = !!_el.isLine;
    _el.uid || (_el.uid = getUid());

    if (isLine) {
      _el.upstream || (_el.upstream = new LineStream(_el));
      _el.downstream || (_el.downstream = new LineStream(_el));
      _el instanceof Line || setProto && setProto(_el, Line);
    } else {
      _el.upstream || (_el.upstream = new NodeStream(_el));
      _el.downstream || (_el.downstream = new NodeStream(_el));
      _el instanceof Node || setProto && setProto(_el, Node);
    }

    return _el as T extends LineLike ? Line : Node;
  }

  /**
   * Generates and returns an element maker.
   * @param fn a function that returns an Element-like object
   * @param name the name of this kind of Element
   */
  export function toMaker
    <T extends (...args: any[]) => ElementLike>(
      fn: T,
      name: string,
  ): T;
  /**
   * Generates and returns an element maker.
   * @param elem an Element with `clone` method,
   * used to clone new elements.
   * @param name the name of this kind of Element
   */
  export function toMaker
    <T extends Element>(elem: T, name: string): () => T;

  export function toMaker(fnOrEl: any, name: string) {
    if (typeof fnOrEl === 'function') {
      const fn = (...args: any[]) => {
        const el = fnOrEl(...args);
        if (process.env.NODE_ENV !== 'production' &&
          !(el instanceof Node || el instanceof Line)) {
          debug('ToMakerClone', void 0, new Error());
        }
        return el;
      };
      return fn;
    } else {
      if (process.env.NODE_ENV !== 'production' &&
        (!isObject(fnOrEl) || !(fnOrEl as Element).clone)) {
        debug('ToMakerClone', void 0, new Error());
      }
      return () => fnOrEl.clone();
    }
  }

  export function biu(this: Element, ...fns: Array<UnaryFunction<any, any>>) {
    if (fns.length > 1) {
      return fns.reduce(
        (prev: any, fn: UnaryFunction<any, any>) => fn(prev),
        this,
      );
    } else if (fns.length === 1) {
      return fns[0](this);
    }
    return this;
  }
}
