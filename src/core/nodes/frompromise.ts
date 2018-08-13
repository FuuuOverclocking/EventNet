import { getElementProducer } from '../element';
import { NodeRunningStage } from '../types';
import { replay } from './replay';

export const fromPromise = getElementProducer((p: Promise<any>) => {
  const node = replay();
  p.then(
    val => node.run(val),
    e => node._errorHandler(NodeRunningStage.code, e),
  );
  return node;
}, 'fromPromise Node');
