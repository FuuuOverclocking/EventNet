import { Element, getUid } from './element';
import { LineStream } from './stream';
import { ElementType, ILineHasDws, ILineHasUps, ILineOptions, INodeHasDws, INodeHasUps } from './types';
import { handleError, tip } from './util';
import { weld } from './weld';

export abstract class Line extends Element implements ILineHasUps, ILineHasDws {
  public abstract type: number;
  public readonly id: string | undefined;
  constructor(
    ups: INodeHasDws | null | undefined,
    dws: INodeHasUps | null | undefined,
    { id, classes }: ILineOptions = {},
  ) {
    super();
    this.id = id;
    this.classes = classes || [];
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
        tip(`data '${
          String(data).length > 20 ?
            String(data).substr(0, 20) + '...' : String(data)
          }' can not pass through Arrow, replace with Pipe`, this);
      }
      if (!this.downstream.element) {
        tip('the downstream of the arrow below is null', this);
        return;
      }
      if (caller !== this.upstream.element) {
        tip('the arrow below is activited but not called by its upstream', this);
      }
    }
    this.downstream.element && this.downstream.element.run(void 0, this);
  }
}

export class Pipe extends Line {
  public type = ElementType.Pipe;
  public run(data: any, caller: INodeHasDws) {
    if (process.env.NODE_ENV !== 'production') {
      if (!this.downstream.element) {
        tip('the downstream of the pipe below is null', this);
        return;
      }
      if (caller !== this.upstream.element) {
        tip('the pipe below is not called by its upstream, however, it still runs', this);
      }
    }
    this.downstream.element && this.downstream.element.run(data, this);
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
      if (!this.downstream.element || !this.upstream.element) {
        tip('the downstream or the upstream of the two-way pipe below is null', this);
        return;
      }
      if (caller !== this.upstream.element && caller !== this.downstream.element) {
        handleError(new Error('the caller is neither upstream nor downstream'), 'Twpipe', this);
        return;
      }
    }

    if (this.upstream.element && this.downstream.element) {
      if (caller === this.upstream.element) {
        this.downstream.element.run(data, this);
      } else if (caller === this.downstream.element) {
        this.upstream.element.run(data, this);
      }
    }
  }
}
