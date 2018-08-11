import { getElementProducer } from '../element';
import { NormalNode } from '../normal-node';
import {
  ElementType,
  ICallableElementLike,
  IDictionary,
  ILineHasDws,
  ILineHasUps,
  ILineOptions,
  INodeHasUps,
  IWatchableElement,
} from '../types';
import { handleError, isPipe } from '../util';
import { weld } from '../weld';
import { Arrow, Pipe, Twpipe } from './../line';

export const stareArrow = getElementProducer<
  ILineHasDws,
  [
    IWatchableElement,
    string | ((this: IDictionary, target: IDictionary) => any),
    (newVal: any, dws: ICallableElementLike | undefined, oldVal: any) => any,
    {
      deep?: boolean,
      sync?: boolean,
      immediate?: boolean,
    },
    ILineOptions
  ]
  >((
    target: IWatchableElement,
    expOrFn: string | ((this: IDictionary, target: IDictionary) => any),
    callback: (newVal: any, dws: ICallableElementLike | undefined, oldVal: any) => any =
      (newVal, dws) => dws && dws(),
    {
      deep = false,
      sync = false,
      immediate = false,
    } = {},
    { id, classes }: ILineOptions = {},
  ) => {
    const line = new Arrow(null, null, { id, classes });

    target.watchMe(expOrFn, (newVal: any, oldVal: any) => {
      let dws: ICallableElementLike | undefined;
      if (line.downstream.stream) {
        // tslint:disable-next-line:only-arrow-functions
        dws = (function() {
          if (process.env.NODE_ENV !== 'production' && arguments.length) {
            handleError(new Error(`data '${
              String(arguments[0]).length > 20 ?
                String(arguments[0]).substr(0, 20) + '...' : String(arguments[0])
              }' can not pass through StareArrow, replace with StarePipe`), 'StareArrow', line);
          }
          line.downstream.stream!.run(void 0, line);
        }) as ICallableElementLike;
        dws.origin = line.downstream.stream;
      }
      const result = callback(newVal, dws, oldVal);
      if (process.env.NODE_ENV !== 'production' && typeof result !== 'undefined' && result !== null) {
        handleError(new Error(`data '${
          String(result).length > 20 ?
            String(result).substr(0, 20) + '...' : String(result)
          }' can not pass through StareArrow, replace with StarePipe`), 'StareArrow', line);
      }

    }, { deep, sync, immediate });

    return line;
  }, 'stareArrow');

export const starePipe = getElementProducer<
  ILineHasDws,
  [
    IWatchableElement,
    string | ((this: IDictionary, target: IDictionary) => any),
    (newVal: any, dws: ICallableElementLike | undefined, oldVal: any) => any,
    {
      deep?: boolean,
      sync?: boolean,
      immediate?: boolean,
    },
    ILineOptions
  ]
  >((
    target: IWatchableElement,
    expOrFn: string | ((this: IDictionary, target: IDictionary) => any),
    callback: (newVal: any, dws: ICallableElementLike | undefined, oldVal: any) => any =
      (newVal, dws) => dws && dws(newVal),
    {
      deep = false,
      sync = false,
      immediate = false,
    } = {},
    { id, classes }: ILineOptions = {},
  ) => {
    const line = new Pipe(null, null, { id, classes });

    target.watchMe(expOrFn, (newVal: any, oldVal: any) => {
      let dws: ICallableElementLike | undefined;
      if (line.downstream.stream) {
        dws = ((d: any) => {
          line.downstream.stream!.run(d, line);
        }) as ICallableElementLike;
        dws.origin = line.downstream.stream;
      }
      const result = callback(newVal, dws, oldVal);
      if (typeof result !== 'undefined' && line.downstream.stream) {
        line.downstream.stream!.run(result, line);
      }
    }, { deep, sync, immediate });

    return line;
  }, 'starePipe');

export const stareTwpipe = getElementProducer<
  ILineHasUps & ILineHasDws,
  [
    IWatchableElement & INodeHasUps,
    string | ((this: IDictionary, target: IDictionary) => any),
    IWatchableElement & INodeHasUps,
    string | ((this: IDictionary, target: IDictionary) => any),
    (newVal: any, dws: ICallableElementLike | undefined, oldVal: any) => any,
    {
      deep?: boolean,
      sync?: boolean,
      immediate?: boolean,
    },
    ILineOptions
  ]
  >((
    upsTarget: IWatchableElement & INodeHasUps,
    upsExpOrFn: string | ((this: IDictionary, target: IDictionary) => any),
    dwsTarget: IWatchableElement & INodeHasUps,
    dwsExpOrFn: string | ((this: IDictionary, target: IDictionary) => any),
    callback: (
      upsNewVal: any,
      dwsNewVal: any,
      ups: ICallableElementLike | undefined,
      dws: ICallableElementLike | undefined,
      upsOldVal: any,
      dwsOldVal: any,
    ) => void,
    {
      deep = false,
      sync = false,
      immediate = false,
    } = {},
    { id, classes }: ILineOptions = {},
  ) => {
    const line = new Twpipe(null, null, { id, classes });
    weld(line.upstream, upsTarget.In);
    weld(line.downstream, dwsTarget.In);

    let upsOldVal: any = void 0;
    let dwsOldVal: any = void 0;

    const run = (upsValue: any, dwsValue: any, upsOldValue: any, dwsOldValue: any) => {
      let dws: ICallableElementLike | undefined;
      if (line.downstream.stream) {
        // tslint:disable-next-line:only-arrow-functions
        dws = ((d: any) => {
          line.downstream.stream!.run(d, line);
        }) as ICallableElementLike;
        dws.origin = line.downstream.stream;
      }
      let ups: ICallableElementLike | undefined;
      if (line.upstream.stream) {
        // tslint:disable-next-line:only-arrow-functions
        ups = ((d: any) => {
          line.upstream.stream!.run(d, line);
        }) as ICallableElementLike;
        ups.origin = line.upstream.stream;
      }

      callback(upsValue, dwsValue, ups, dws, upsOldValue, dwsOldValue);
    };

    upsTarget.watchMe(upsExpOrFn, (newVal: any, oldVal: any) => {
      run(newVal, void 0, oldVal, dwsOldVal);
      upsOldVal = newVal;
    }, { deep, sync, immediate });
    dwsTarget.watchMe(dwsExpOrFn, (newVal: any, oldVal: any) => {
      run(void 0, newVal, upsOldVal, oldVal);
      dwsOldVal = newVal;
    }, { deep, sync, immediate });
  }, 'stareTwpipe');

declare module '../normal-node' {
  // tslint:disable-next-line:interface-name
  interface NormalNode {
    createStareLine: typeof createStareLine;
    createStareArrow: typeof createStareArrow;
    createStarePipe: typeof createStarePipe;
  }
}

function createStareLine(
  this: NormalNode,
  type: ElementType,
  node: INodeHasUps,
  expOrFn: string | (() => any),
  callback: (newVal: any, dws: ICallableElementLike | undefined, oldVal: any) => any,
  {
    deep = false,
    sync = false,
    immediate = false,
  } = {},
  { id, classes }: ILineOptions = {},
) {
  const ctor = isPipe(type) ? starePipe : stareArrow;
  const line = ctor(
    this,
    expOrFn,
    callback,
    { deep, sync, immediate },
    { id, classes },
  );
  weld(line.downstream, node.In);
  return line;
}

export const [createStareArrow, createStarePipe] =
((types: number[], fn) => [fn(types[0]), fn(types[1])])
(
  [ElementType.Arrow, ElementType.Pipe],
  (t: ElementType) => function(
    this: NormalNode,
    node: INodeHasUps,
    expOrFn: string | (() => any),
    callback: (newVal: any, dws: ICallableElementLike | undefined, oldVal: any) => any,
    {
      deep = false,
      sync = false,
      immediate = false,
    } = {},
    { id, classes }: ILineOptions = {},
  ) {
    return this.createStareLine(t, node, expOrFn, callback, { deep, sync, immediate }, { id, classes });
  });

NormalNode.prototype.createStareLine = createStareLine;
NormalNode.prototype.createStareArrow = createStareArrow;
NormalNode.prototype.createStarePipe = createStarePipe;
