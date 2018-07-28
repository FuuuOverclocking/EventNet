import { LineStream } from './stream';
import { ElementType, ILineLike, ILineOptions, INodeLike } from './types';
import { handleError, tip } from './util';

export abstract class Line implements ILineLike {
  public abstract type: ElementType;
  public readonly id: string | undefined;
  constructor(
    ups: INodeLike | null | undefined,
    dws: INodeLike | null | undefined,
    { id, classes }: ILineOptions = {},
  ) {
    this.id = id;
    this.classes = classes ?
      Array.isArray(classes) ?
        classes : [classes]
      : [];
    ups && (this.upstream.stream = ups);
    dws && (this.downstream.stream = dws);
  }
  public classes: string[] = [];

  /**
   * Run this Line
   * @param data if the line is Arrow, data only can be null or undefined
   */
  public abstract run(data: any, caller: INodeLike): void;
  public upstream: LineStream = new LineStream(this);
  public downstream: LineStream = new LineStream(this);
}

export class Arrow extends Line {
  public type = ElementType.Arrow;
  public run(data: any, caller: INodeLike) {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof data !== 'undefined' || data !== null) {
        handleError(new Error('data can not pass through Arrow, replace with Pipe'), 'Arrow', this);
        return;
      }
      if (!this.downstream.stream) {
        tip('the downstream of the arrow below is null', this);
        return;
      }
    }
    this.downstream.stream && this.downstream.stream.run(void 0, caller);
  }
}

export class Pipe extends Line {
  public type = ElementType.Pipe;
  public run(data: any, caller: INodeLike) {
    if (process.env.NODE_ENV !== 'production') {
      if (!this.downstream.stream) {
        tip('the downstream of the pipe below is null', this);
        return;
      }
    }
    this.downstream.stream && this.downstream.stream.run(data, caller);
  }
}

export class Twpipe extends Line {
  public type = ElementType.Twpipe;
  public run(data: any, caller: INodeLike) {
    if (process.env.NODE_ENV !== 'production') {
      if (!this.downstream.stream || !this.upstream.stream) {
        tip('the downstream or the upstream of the two-way pipe below is null', this);
        return;
      }
      if (caller !== this.upstream.stream && caller !== this.downstream.stream) {
        handleError(new Error('the caller is neither upstream nor downstream'), 'Twpipe', this);
        return;
      }
    }

    if (this.upstream.stream && this.downstream.stream) {
      if (caller === this.upstream.stream) {
        this.downstream.stream.run(data, caller);
      } else if (caller === this.downstream.stream) {
        this.upstream.stream.run(data, caller);
      }
    }
  }
}
