import { getElementProducer } from '../element';
import { NodeRunningStage } from '../types';
import { ReplayNode } from './replay';

export const fromPromise = getElementProducer((p: Promise<any>) => {
  const rdn = new ReplayNode();
  p.then(
    val => rdn.run(val),
    e => rdn._errorHandler(NodeRunningStage.code, e),
  );
  return rdn;
}, 'fromPromise Node');
