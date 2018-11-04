import { BasicNodeMode, BasicNodeOpt, ElementType, NodeRunPhase, RawNodeCode } from '../../types';
import { NodePort } from '../port';
import { hasPromise } from '../util/env';
import { isUndef, tryCatch } from '../util/index';
import { BasicNode, BasicNodeDws } from './basicNode';
import { QueueScheduler } from './queueScheduler';

export interface RawNode<T = any> {
  mode: BasicNodeMode | [BasicNodeMode, QueueScheduler | undefined];
  runSync(data?: any, opt?: BasicNodeOpt): T;
  queue(queue?: QueueScheduler): {
    run(data?: any, opt?: BasicNodeOpt): Promise<T>;
  };
  runMicro(data?: any, opt?: BasicNodeOpt): Promise<T>;
  runMacro(data?: any, opt?: BasicNodeOpt): Promise<T>;
  runAnimationFrame(data?: any, opt?: BasicNodeOpt): Promise<T>;
}

export class RawNode<T = any> extends BasicNode<T> {
  public readonly type = ElementType.FullNode;

  public readonly ups: NodePort = new NodePort(this);
  public readonly dws: NodePort = new NodePort(this);

  public readonly code: RawNodeCode<T, RawNode<T>>;
  protected readonly codeDws = new BasicNodeDws(this.dws);

  constructor(
    options: {
      $mode: BasicNodeMode | [BasicNodeMode, QueueScheduler | undefined];
    },
    code: RawNodeCode<T, RawNode<T>>
  ) {
    super();
    this.mode = options.$mode;
    this.code = code;
  }

  public clone(): RawNode<T> {
    return new RawNode(
      {
        $mode: this.mode,
      },
      this.code
    );
  }

  public _run(data: any, opt: BasicNodeOpt): T {
    const codeDws = opt.runStack ?
      new BasicNodeDws(this.dws, opt.runStack) :
      this.codeDws;

    const result = tryCatch(this.code.bind(this, {
      dws: codeDws,
      ups: {},
      data,
      origin: this,
    })) as T;
    if (hasPromise && result instanceof Promise) {
      return result
        .then(
          null,

          error => {
            this.handleError({ phase: NodeRunPhase.code }, error);
          }) as any;
    }

    const e = tryCatch.getErr();
    if (!isUndef(e)) {
      this.handleError({ phase: NodeRunPhase.code }, e);
      return void 0 as any;
    }

    return result;
  }
}
