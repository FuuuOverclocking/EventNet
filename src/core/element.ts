import { IElementLike, ILineLike, INodeLike, IUnaryFunction } from './types';
import { handleError, isObject } from './util';

// uid should start at 1, as 0 is a falsy value
let globalElementUid = 0;
export function getUid() {
  return ++globalElementUid;
}

export abstract class Element implements IElementLike {
  public uid = getUid();
  public abstract run(data?: any, caller?: IElementLike): any;
  public abstract type: number;

  public thread(): this;
  public thread<A>(op1: IUnaryFunction<this, A>): A;
  public thread<A, B>(op1: IUnaryFunction<this, A>, op2: IUnaryFunction<A, B>): B;

  public thread(...fns: Array<IUnaryFunction<any, any>>) {
    if (!fns.length) {
      return this;
    }
    if (fns.length === 1) {
      return fns[0](this);
    }

    return fns.reduce((prev: any, fn: IUnaryFunction<any, any>) => fn(prev), this);
  }
}

export function getElementProducer<type extends INodeLike | ILineLike, T extends any[]>(
  fn: (...args: T) => type,
  name: string,
): (...args: T) => type;

export function getElementProducer<type extends INodeLike | ILineLike>(existingElement: type, name: string): () => type;

export function getElementProducer(fnOrElem: any, name: string) {
  if (typeof fnOrElem === 'function') {
    const fn = (...args: any[]) => {
      const elem = fnOrElem(...args);
      if (process.env.NODE_ENV !== 'production') {
        // check
        // TODO
      }
      elem.uid || (elem.uid = getUid());
      elem.clone || (elem.clone = fn);
    };
    return fn;
  } else {
    if (process.env.NODE_ENV !== 'production' && (!isObject(fnOrElem) || !fnOrElem.clone)) {
      handleError(new Error('an Element with clone method is expected'), 'getElementProducer');
    }
    return fnOrElem.clone();
  }
}
