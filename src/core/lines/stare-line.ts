import { isObject } from 'util';
import { NormalNode } from '..';
import { LineStream } from '../stream';
import {
  ElementType, ICallableElementLike, ILineHasDws,
  ILineHasUps, ILineLike, ILineOptions,
  INodeHasDws, INodeHasUps, INodeLike,
} from '../types';
import { handleError } from '../util';
import { deweld } from '../weld';

export abstract class StareLine implements ILineLike {
  public _isEN = true;
  public readonly id: string | undefined;
  public classes: string[] = [];
  public abstract type: ElementType;
  public abstract run(data:
    /* For arrow and pipe */
    [any, any] |
    /* For two-way pipe */
    [any, any, any, any],
  ): void;
  public readonly callback:
    /* For arrow and pipe */
    ((newVal: any,
      dws: ICallableElementLike | null,
      oldVal: any,
    ) => any) |
    /* For two-way pipe */
    ((upsNewVal: any,
      dwsNewVal: any,
      ups: ICallableElementLike | null,
      dws: ICallableElementLike | null,
      upsOldVal: any,
      dwsOldVal: any,
    ) => void);

  constructor(
    callback:
      /* For arrow and pipe */
      ((newVal: any,
        dws: ICallableElementLike | null,
        oldVal: any,
      ) => any) |
      /* For two-way pipe */
      ((upsNewVal: any,
        dwsNewVal: any,
        ups: ICallableElementLike | null,
        dws: ICallableElementLike | null,
        upsOldVal: any,
        dwsOldVal: any,
      ) => void),
    { id, classes }: ILineOptions = {},
  ) {
    this.id = id;
    this.classes = classes ?
      Array.isArray(classes) ?
        classes : [classes]
      : [];
    this.callback = callback;
  }
}


// arrow, pipe on destory: deweld its downstream
export class StareArrow extends StareLine implements ILineHasDws {
  public type = ElementType.Arrow;
  public downstream: LineStream = new LineStream(this);
  public readonly callback:
    /* For arrow and pipe */
    ((newVal: any,
      dws: ICallableElementLike | null,
      oldVal: any,
    ) => any);

  constructor(
    target: any,
    watchMethod: typeof NormalNode.prototype.watchMe,
    expOrFn: string | (() => any),
    callback: (newVal: any, dws: ICallableElementLike | null, oldVal: any) => any,
    {
      deep = false,
      sync = false,
      immediate = false,
    } = {},
    { id, classes }: ILineOptions = {},
  ) {
    super(callback, { id, classes });
    watchMethod.call(target, expOrFn, (newVal: any, oldVal: any) => {
      this.run([newVal, oldVal]);
    }, { deep, sync, immediate });

    if (isObject(target) && target._isEN) {
      (target as INodeLike).destoryed!.push(() => {
        this.downstream.stream && deweld(this.downstream, (this.downstream.stream as INodeHasUps).In);
      });
    }
  }

  public run(data: [any, any]) {
    let dws: ICallableElementLike | null = null;
    if (this.downstream.stream) {
      const that = this;
      // tslint:disable-next-line:only-arrow-functions
      dws = (function() {
        if (process.env.NODE_ENV !== 'production' && arguments.length) {
          handleError(new Error(`data '${
            String(arguments[0]).length > 20 ?
              String(arguments[0]).substr(0, 20) + '...' : String(arguments[0])
            }' can not pass through StareArrow, replace with StarePipe`), 'StareArrow', that);
        }
        that.downstream.stream!.run(void 0, that);
      }) as ICallableElementLike;
      dws.origin = this.downstream.stream;
    }
    const result = this.callback(data[0], dws, data[1]);
    if (process.env.NODE_ENV !== 'production' && typeof result !== 'undefined' && result !== null) {
      handleError(new Error(`data '${
        String(result).length > 20 ?
          String(result).substr(0, 20) + '...' : String(result)
        }' can not pass through StareArrow, replace with StarePipe`), 'StareArrow', this);
    }
  }
}

export class StarePipe extends StareLine implements ILineHasDws {
  public type = ElementType.Pipe;
  public downstream: LineStream = new LineStream(this);
  public readonly callback:
    /* For arrow and pipe */
    ((newVal: any,
      dws: ICallableElementLike | null,
      oldVal: any,
    ) => any);

  constructor(
    target: any,
    watchMethod: typeof NormalNode.prototype.watchMe,
    expOrFn: string | (() => any),
    callback: (newVal: any, dws: ICallableElementLike | null, oldVal: any) => any,
    {
      deep = false,
      sync = false,
      immediate = false,
    } = {},
    { id, classes }: ILineOptions = {},
  ) {
    super(callback, { id, classes });
    watchMethod.call(target, expOrFn, (newVal: any, oldVal: any) => {
      this.run([newVal, oldVal]);
    }, { deep, sync, immediate });

    if (isObject(target) && target._isEN) {
      (target as INodeLike).destoryed!.push(() => {
        this.downstream.stream && deweld(this.downstream, (this.downstream.stream as INodeHasUps).In);
      });
    }
  }

  public run(data: [any, any]) {
    let dws: ICallableElementLike | null = null;
    if (this.downstream.stream) {
      // tslint:disable-next-line:only-arrow-functions
      dws = ((d: any) => {
        this.downstream.stream!.run(d, this);
      }) as ICallableElementLike;
      dws.origin = this.downstream.stream;
    }
    const result = this.callback(data[0], dws, data[1]);
    if (typeof result !== 'undefined' && this.downstream.stream) {
      this.downstream.stream!.run(result, this);
    }
  }
}

// the upstream's and downstream's target must be EventNet Element
// twpipe on destory: deweld both side
export class StareTwpipe extends StareLine implements ILineHasDws, ILineHasUps {
  public type = ElementType.Pipe;
  public upstream: LineStream = new LineStream(this);
  public downstream: LineStream = new LineStream(this);
  public readonly callback:
    /* For two-way pipe */
    ((upsNewVal: any,
      dwsNewVal: any,
      ups: ICallableElementLike | null,
      dws: ICallableElementLike | null,
      upsOldVal: any,
      dwsOldVal: any,
    ) => void);

  constructor(
    upsTarget: any,
    upsWatchMethod: typeof NormalNode.prototype.watchMe,
    upsExpOrFn: string | (() => any),
    dwsTarget: any,
    dwsWatchMethod: typeof NormalNode.prototype.watchMe,
    dwsExpOrFn: string | (() => any),
    callback: (
      upsNewVal: any,
      dwsNewVal: any,
      ups: ICallableElementLike | null,
      dws: ICallableElementLike | null,
      upsOldVal: any,
      dwsOldVal: any,
    ) => void,
    {
      deep = false,
      sync = false,
      immediate = false,
    } = {},
    { id, classes }: ILineOptions = {},
  ) {
    super(callback, { id, classes });

    if (!upsTarget._isEN || !dwsTarget._isEN) {
      // tslint:disable-next-line:quotemark
      handleError(new Error("the upstream's and downstream's target must be EventNet Element"), 'StareTwpipe');
    }

    let upsOldVal: any = void 0;
    let dwsOldVal: any = void 0;

    upsWatchMethod.call(upsTarget, upsExpOrFn, (newVal: any, oldVal: any) => {
      this.run([newVal, void 0, oldVal, dwsOldVal]);
      upsOldVal = newVal;
    }, { deep, sync, immediate });
    dwsWatchMethod.call(dwsTarget, dwsExpOrFn, (newVal: any, oldVal: any) => {
      this.run([void 0, newVal, upsOldVal, oldVal]);
      dwsOldVal = newVal;
    }, { deep, sync, immediate });

    (upsTarget as INodeLike).destoryed!.push(() => {
      this.downstream.stream && deweld(this.downstream, (this.downstream.stream as INodeHasUps).In);
      this.upstream.stream && deweld(this.upstream, (this.upstream.stream as INodeHasDws).Out);
    });
    (dwsTarget as INodeLike).destoryed!.push(() => {
      this.downstream.stream && deweld(this.downstream, (this.downstream.stream as INodeHasUps).In);
      this.upstream.stream && deweld(this.upstream, (this.upstream.stream as INodeHasDws).Out);
    });

  }

  public run(data: [any, any, any, any]) {
    let dws: ICallableElementLike | null = null;
    if (this.downstream.stream) {
      // tslint:disable-next-line:only-arrow-functions
      dws = ((d: any) => {
        this.downstream.stream!.run(d, this);
      }) as ICallableElementLike;
      dws.origin = this.downstream.stream;
    }
    let ups: ICallableElementLike | null = null;
    if (this.upstream.stream) {
      // tslint:disable-next-line:only-arrow-functions
      ups = ((d: any) => {
        this.upstream.stream!.run(d, this);
      }) as ICallableElementLike;
      ups.origin = this.upstream.stream;
    }

    this.callback(data[0], data[1], ups, dws, data[2], data[3]);
  }
}
