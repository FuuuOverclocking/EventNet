import { IElementLike, ILineLike, INodeLike } from './types';
import { handleError, isObject } from './util';

// uid should start at 1, as 0 is a falsy value
let globalElementUid = 0;
export function getUid() {
  return ++globalElementUid;
}


export function getElementProducer<type extends INodeLike | ILineLike, T extends any[]>(
  fn: (...args: T) => any,
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
