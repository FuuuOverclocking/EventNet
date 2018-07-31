import { NodeRunningStage } from '../types';
import { RedistNode } from './redist';

export function fromPromise(promiseOrFn: Promise<any> | (() => Promise<any>)) {
  const pm = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
  const rdn = new RedistNode();

  pm.then(
    val => rdn.run(val),
    e => rdn._errorHandler(NodeRunningStage.code, e),
  );
  return rdn;
}
