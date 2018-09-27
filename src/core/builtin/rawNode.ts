import { BasicNodeMode, ElementType, NodeRunPhase, RawNodeCode } from '../../types';
import { errorObject } from '../../util/errorObject';
import { tryCatch } from '../../util/tryCatch';
import { hasPromise } from '../debug';
import { Line } from '../line';
import { NodeStream } from '../stream';
import { BasicNode, BasicNodeDws } from './basicNode';
import { QueueScheduler } from './queueScheduler';

export interface RawNode<T = any> {
  mode: BasicNodeMode | [BasicNodeMode, QueueScheduler | undefined];
  runSync(data?: any, caller?: Line): T;
  queue(queue?: QueueScheduler): {
    run(data?: any, caller?: Line): Promise<T>;
  };
  runMicro(data?: any, caller?: Line): Promise<T>;
  runMacro(data?: any, caller?: Line): Promise<T>;
  runAnimationFrame(data?: any, caller?: Line): Promise<T>;
  noret(): {
    queue(queue?: QueueScheduler): {
      run(data?: any, caller?: Line): void;
    };
    runMacro(data?: any, caller?: Line): void;
    runAnimationFrame(data?: any, caller?: Line): void;
  };
}

export class RawNode<T = any> extends BasicNode<T> {
  public readonly type = ElementType.NormalNode;

  public readonly ups: NodeStream = new NodeStream(this);
  public readonly dws: NodeStream = new NodeStream(this);

  public readonly code: RawNodeCode<T, RawNode<T>>;
  protected readonly codeDws = new BasicNodeDws(this.dws);

  constructor(
    options: {
      $mode: BasicNodeMode | [BasicNodeMode, QueueScheduler | undefined];
    },
    code: RawNodeCode<T, RawNode<T>>,
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
      this.code,
    );
  }

  public _run(data?: any, caller?: Line): T {
    const result = tryCatch(this.code.bind(this, {
      dws: this.codeDws,
      ups: {},
      data,
      origin: this,
    })) as T;
    if (hasPromise && result instanceof Promise) {
      return result
        .catch(error => {
          this.errorHandler(NodeRunPhase.code, error);
        }) as any;
    }

    if (errorObject.e) {
      const e = errorObject.e;
      errorObject.e = void 0;
      this.errorHandler(NodeRunPhase.code, e);
      return void 0 as any;
    }

    return result;
  }
}
