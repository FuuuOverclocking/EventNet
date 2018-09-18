import { ElementLike, LineLike, NodeLike, UnaryFunction } from '../types';
import { isObject } from '../util/isObject';
import { debug } from './debug';
import { Line } from './line';
import { Node } from './node';
import { LineStream, NodeStream, Stream } from './stream';

// uid will start at 1, as 0 is a falsy value
let globalElementUid = 0;
function getUid() {
  return ++globalElementUid;
}

/**
 * Trying to transform an object into Node or Line
 * @param {boolean} [el.isLine] Used to determine the type of Element
 */
export function elementify<T extends ElementLike>(el: T) {
  if (process.env.NODE_ENV && (!isObject(el) || typeof el.run !== 'function')) {
    debug('ElementifyParam', void 0, new Error());
  }

  const _el: any = el;
  const isLine = _el.isLine = !!_el.isLine;
  _el.uid || (_el.uid = getUid());
  _el.upstream ||
    (_el.upstream = isLine ? new LineStream(_el) : new NodeStream(_el));
  _el.downstream ||
    (_el.downstream = isLine ? new LineStream(_el) : new NodeStream(_el));

  return _el as T extends LineLike ? Line : Node;
}

export abstract class Element<T = any>
  implements ElementLike<T> {

  public readonly uid = getUid();
  public abstract run(data?: any, caller?: Element): T;

  public abstract readonly ups: Stream;
  public abstract readonly dws: Stream;

  public abstract readonly isLine: boolean;
  public readonly type?: number;

  public generateIdentity(): object {
    return { uid: this.uid };
  }

  public clone?(): this;

  // tslint:disable:max-line-length
  public biu(): this;
  public biu<A>(op1: UnaryFunction<this, A>): A;
  public biu<A, B>(op1: UnaryFunction<this, A>, op2: UnaryFunction<A, B>): B;
  public biu<A, B, C>(op1: UnaryFunction<this, A>, op2: UnaryFunction<A, B>, op3: UnaryFunction<B, C>): C;
  public biu<A, B, C, D>(op1: UnaryFunction<this, A>, op2: UnaryFunction<A, B>, op3: UnaryFunction<B, C>, op4: UnaryFunction<C, D>): D;
  public biu<A, B, C, D, E>(op1: UnaryFunction<this, A>, op2: UnaryFunction<A, B>, op3: UnaryFunction<B, C>, op4: UnaryFunction<C, D>, op5: UnaryFunction<D, E>): E;
  public biu<A, B, C, D, E, F>(op1: UnaryFunction<this, A>, op2: UnaryFunction<A, B>, op3: UnaryFunction<B, C>, op4: UnaryFunction<C, D>, op5: UnaryFunction<D, E>, op6: UnaryFunction<E, F>): F;
  public biu<A, B, C, D, E, F, G>(op1: UnaryFunction<this, A>, op2: UnaryFunction<A, B>, op3: UnaryFunction<B, C>, op4: UnaryFunction<C, D>, op5: UnaryFunction<D, E>, op6: UnaryFunction<E, F>, op7: UnaryFunction<F, G>): G;
  public biu<A, B, C, D, E, F, G, H>(op1: UnaryFunction<this, A>, op2: UnaryFunction<A, B>, op3: UnaryFunction<B, C>, op4: UnaryFunction<C, D>, op5: UnaryFunction<D, E>, op6: UnaryFunction<E, F>, op7: UnaryFunction<F, G>, op8: UnaryFunction<G, H>): H;
  public biu<A, B, C, D, E, F, G, H, I>(op1: UnaryFunction<this, A>, op2: UnaryFunction<A, B>, op3: UnaryFunction<B, C>, op4: UnaryFunction<C, D>, op5: UnaryFunction<D, E>, op6: UnaryFunction<E, F>, op7: UnaryFunction<F, G>, op8: UnaryFunction<F, G>): I;
  // tslint:enable:max-line-length

  /**
   * Used to stitch together functional operators into a chain.
   */
  public biu(...fns: Array<UnaryFunction<any, any>>) {
    if (!fns.length) {
      return this;
    } else if (fns.length === 1) {
      return fns[0](this);
    }
    return fns.reduce(
      (prev: any, fn: UnaryFunction<any, any>) => fn(prev),
      this,
    );
  }
}

export namespace Element {

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
        return elementify(fnOrEl(...args));
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
}
