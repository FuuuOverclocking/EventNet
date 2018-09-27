import { fulfilledPromise, hasPromise } from '../core/debug';

// tslint:disable:ban-types
export const nextMoment: (fn: Function) => void =
  hasPromise ?
    (fn: Function) => { fulfilledPromise!.then(fn as any); } :
    (fn: Function) => { setTimeout(fn, 0); };
