import { BasicNodeMode, BasicNodeOpt, CallableElement } from '../../types';
import { debug } from '../debug';
import { Line } from '../line';
import { Node } from '../node';
import { NodeStream } from '../stream';
import { fulfilledPromise } from '../util/env';
import { assign, isUndef, isValidArrayIndex } from '../util/index';
import { defaultQueue, QueueScheduler } from './queueScheduler';

export abstract class BasicNode<T = any> extends Node<T | Promise<T>> {
  public abstract readonly ups: NodeStream;
  public abstract readonly dws: NodeStream;

  /**
   * 继承和实现
   *
   * T 为 BasicNode 的原本返回类型
   *
   * 二选一
   * 1. 用 _run 表示原本的逻辑， run 是根据 mode 执行相应的方法，相应的方法执行 _run ，需要将相应方法和 mode 设置为 public
   * 2. 用 run 表示真正的逻辑，废弃 _run 等等
   */

  public run(
    data?: any,
    opt: BasicNodeOpt = {},
  ): T | Promise<T> {
    switch (this.mode) {
      case BasicNodeMode.sync:
        return this._run!(data, opt);
      case BasicNodeMode.micro:
        return this.runMicro(data, opt);
      case BasicNodeMode.macro:
        return this.runMacro(data, opt);
      case BasicNodeMode.animationFrame:
        return this.runAnimationFrame(data, opt);
      default:
        return this
          .queue((this.mode as [BasicNodeMode, QueueScheduler | undefined])[1])
          .run(data, opt);
    }
  }
  protected _run?(
    data: any,
    opt: BasicNodeOpt,
  ): T;

  protected mode: BasicNodeMode | [BasicNodeMode, QueueScheduler | undefined];

  protected runSync(data?: any, opt: BasicNodeOpt = {}): T {
    return this._run!(data, opt);
  }
  protected queue(
    queue: QueueScheduler = Array.isArray(this.mode) &&
      this.mode[0] === BasicNodeMode.queue &&
      this.mode[1]
      || defaultQueue,
  ): {
      run(data?: any, opt?: BasicNodeOpt): Promise<T>;
    } {
    return {
      run: (data, opt = {}) => {
        return new Promise<T>(resolve =>
          queue.schedule(() => {
            const result = this._run!(data, opt);
            resolve(result);

            // if return Promise, the flush will wait util its state change
            return result;
          }));
      },
    };
  }
  protected runMicro(data?: any, opt: BasicNodeOpt = {}): Promise<T> {
    return (fulfilledPromise as Promise<void>).then(() => this._run!(data, opt));
  }
  protected runMacro(data?: any, opt: BasicNodeOpt = {}): Promise<T> {
    return new Promise(resolve => {
      // In fact, probably more than 4 milliseconds
      setTimeout(() => resolve(this._run!(data, opt)), 0);
    });
  }
  protected runAnimationFrame(data?: any, opt: BasicNodeOpt = {}): Promise<T> {
    return new Promise(resolve => {
      requestAnimationFrame(() => resolve(this._run!(data, opt)));
    });
  }

  /**
   * This is provided for runtime that does not
   * support Promise and do not have a polyfill for Promise.
   */
  protected noret(): {
    queue(queue?: QueueScheduler): {
      run(data?: any, opt?: BasicNodeOpt): void;
    };
    runMacro(data?: any, opt?: BasicNodeOpt): void;
    runAnimationFrame(data?: any, opt?: BasicNodeOpt): void;
  } {
    const fns = {
      queue: (queue = defaultQueue) => {
        return {
          run: (data?: any, opt: BasicNodeOpt = {}) => {
            queue.schedule(() => {
              this._run!(data, opt);
            });
          },
        };
      },
      runMacro: (data?: any, opt: BasicNodeOpt = {}) => {
        setTimeout(() => this._run!(data, opt), 0);
      },
      runAnimationFrame: (data?: any, opt: BasicNodeOpt = {}) => {
        requestAnimationFrame(() => this._run!(data, opt));
      },
    };
    this.noret = () => fns;
    return fns;
  }

  public abstract readonly type: number;
  public generateIdentity(): { [field: string]: any } {
    return assign(super.generateIdentity(), { type: 'BasicNode' });
  }
  public abstract clone(): BasicNode<any>;
  public readonly canRunSeparate: true;
}

(BasicNode.prototype.canRunSeparate as any) = true;

function callableDws(
  line: Line,
  opt: { caller?: Node; runStack?: number[]; [i: string]: any; } = {},
  data?: any,
) {
  return line.run(data, opt);
}

export class BasicNodeDws {
  public readonly origin: NodeStream;
  protected runOptions: {
    caller: Node;
    runStack?: number[];
  };
  constructor(thisStream: NodeStream, runStack?: number[]) {
    this.origin = thisStream;
    this.runOptions = { caller: thisStream.owner, runStack };
  }

  protected static readonly $x = (i: number, origin: NodeStream, runStack?: number[]) => {
    const line = origin.get()[i];
    if (process.env.NODE_ENV !== 'production' && !line) {
      debug('BN_NonexistDws', origin.owner, new Error());
    }
    const f = callableDws.bind(
      null,
      line as Line,
      { caller: origin.owner, runStack });
    f.origin = line;
    return f as CallableElement;
  }

  public $0: CallableElement;
  public $1: CallableElement;
  public $2: CallableElement;
  public $3: CallableElement;
  public $4: CallableElement;
  public $5: CallableElement;
  public $6: CallableElement;
  public $7: CallableElement;
  public $8: CallableElement;
  public $9: CallableElement;

  public $(index: number, data?: any) {
    const f = this.$cache[index] ||
      (this.$cache[index] =
        BasicNodeDws.$x(index, this.origin, this.runOptions.runStack));
    if (typeof data !== 'undefined') {
      f(data);
    }
    return f;
  }

  protected $cache: Array<CallableElement<any>> = [];

  public all(data?: any) {
    this.origin.get().forEach(line =>
      line &&
      line.run(data, this.runOptions));
  }

  public allnerr(data?: any) {
    this.origin.get().filter(line => {
      if (!line) { return false; }
      if (!line.classes) { return true; }
      return !~line.classes.indexOf('error');
    }).forEach(line =>
      (line as Line).run(
        data,
        this.runOptions,
      ));
  }

  public id(id: string): CallableElement {
    const line = this.origin.id(id);
    if (!line) {
      if (process.env.NODE_ENV !== 'production') {
        debug('BN_NonexistDws', this.origin.owner, new Error());
      }
    }
    const f = callableDws.bind(line, this.runOptions);
    f.origin = line;
    return f;
  }

  public query(querystring: string, data?: any) {
    const lines = this.origin.query(querystring);
    const callableLines: CallableElement[] = [];

    if (!lines.length) {
      return callableLines;
    }

    const hasData = !isUndef(data);

    lines.forEach(line => {
      const fn = (d => {
        line.run(d, this.runOptions);
      }) as CallableElement;
      fn.origin = line;

      if (hasData) { fn(data); }
      callableLines.push(fn);
    });

    return callableLines;
  }

  public dispense(
    id_value_or_index_value: { [index: number]: any } | { [id: string]: any },
  ) {
    let downstream: Line | undefined;
    const isIndex = isValidArrayIndex(Object.keys(id_value_or_index_value)[0]);

    Object.keys(id_value_or_index_value).forEach(i => {
      downstream = (
        isIndex
          ? this.origin.get()[Number(i)]
          : this.origin.id(i)
      ) as Line | undefined;

      if (downstream) {
        downstream.run((id_value_or_index_value as any)[i], this.runOptions);
      } else if (process.env.NODE_ENV !== 'production') {
        debug('BN_NonexistDwsWarn', this.origin.owner);
      }
    });
  }
}

for (let i = 0; i < 10; ++i) {
  Object.defineProperty(BasicNodeDws.prototype, '$' + i, {
    get(this: BasicNodeDws) {
      return (this as any).$cache[i] ||
        ((this as any).$cache[i] = (BasicNodeDws as any).$x(
          i,
          this.origin,
          (this as any).runOptions.runStack,
        ));
    },
    enumerable: true,
    configurable: true,
  });
}
