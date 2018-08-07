import { LineStream } from './stream';
import { ElementType, ILineHasDws, ILineHasUps, ILineOptions, INodeHasDws, INodeHasUps, INodeLike } from './types';
import { handleError, tip } from './util';
import { weld } from './weld';

export abstract class Line implements ILineHasUps, ILineHasDws {
  public abstract type: ElementType;
  public readonly id: string | undefined;
  constructor(
    ups: INodeHasDws | null | undefined,
    dws: INodeHasUps | null | undefined,
    { id, classes }: ILineOptions = {},
  ) {
    this.id = id;
    this.classes = classes ?
      Array.isArray(classes) ?
        classes : [classes]
      : [];
    ups && weld(ups.Out, this.upstream);
    dws && weld(dws.In, this.downstream);
  }
  public classes: string[] = [];

  /**
   * Run this Line
   * @param data if the line is Arrow, data only can be null or undefined
   */
  public abstract run(data: any, caller: INodeHasDws): void;
  public upstream: LineStream = new LineStream(this);
  public downstream: LineStream = new LineStream(this);
}

export class Arrow extends Line {
  public type = ElementType.Arrow;
  public run(data: any, caller: INodeHasDws) {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof data !== 'undefined' && data !== null) {
        handleError(new Error(`data '${
          String(data).length > 20 ?
            String(data).substr(0, 20) + '...' : String(data)
          }' can not pass through Arrow, replace with Pipe`), 'Arrow', this);
        return;
      }
      if (!this.downstream.stream) {
        tip('the downstream of the arrow below is null', this);
        return;
      }
      if (caller !== this.upstream.stream) {
        tip('the arrow below is not called by its upstream, however, it still runs', this);
      }
    }
    this.downstream.stream && this.downstream.stream.run(void 0, this);
  }
}

export class Pipe extends Line {
  public type = ElementType.Pipe;
  public run(data: any, caller: INodeHasDws) {
    if (process.env.NODE_ENV !== 'production') {
      if (!this.downstream.stream) {
        tip('the downstream of the pipe below is null', this);
        return;
      }
      if (caller !== this.upstream.stream) {
        tip('the pipe below is not called by its upstream, however, it still runs', this);
      }
    }
    this.downstream.stream && this.downstream.stream.run(data, this);
  }
}

export class Twpipe extends Line {
  public type = ElementType.Twpipe;
  constructor(
    ups: (INodeHasDws & INodeHasUps) | null | undefined,
    dws: (INodeHasDws & INodeHasUps) | null | undefined,
    { id, classes }: ILineOptions = {},
  ) {
    super(ups, dws, { id, classes });
    ups && weld(ups.In, this.upstream);
    dws && weld(dws.Out, this.downstream);
  }
  public run(data: any, caller: INodeHasDws & INodeHasUps) {
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
        this.downstream.stream.run(data, this);
      } else if (caller === this.downstream.stream) {
        this.upstream.stream.run(data, this);
      }
    }
  }
}
