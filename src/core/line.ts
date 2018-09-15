import { ElementType, LineLike } from '../types';
import { debug } from './debug';
import { Element, elementify } from './element';
import { Node } from './node';
import { LineStream, weld } from './stream';

export abstract class Line<T = any>
  extends Element<T>
  implements LineLike<T> {

  public readonly isLine = true;
  public abstract readonly type?: number;

  public abstract run(data: any, caller: Node): T;
  public abstract readonly upstream: LineStream;
  public abstract readonly downstream: LineStream;

  public readonly id?: string;
  public readonly classes?: string[];
  public generateIdentity() {
    return {
      uid: this.uid,
      id: this.id,
      classes: this.classes,
    };
  }
}

export namespace Line {
  /**
   * Trying to transform an object into Line
   */
  export const ify = <T extends LineLike>(el: T) => {
    (el as any).isLine = true;
    return elementify(el);
  };
}

export class Arrow<T = any> extends Line<T> {
  public readonly type = ElementType.Arrow;

  public readonly upstream: LineStream = new LineStream(this);
  public readonly downstream: LineStream = new LineStream(this);
  public readonly id: string | undefined;
  public readonly classes: string[];
  constructor(
    ups: Node | null | undefined,
    dws: Node<T> | null | undefined,
    { id, classes }: { id?: string, classes?: string[] } = {},
  ) {
    super();
    ups && weld(ups.downstream, this.upstream);
    dws && weld(dws.upstream, this.downstream);
    this.id = id;
    this.classes = classes || [];
  }
  public run(data: undefined | null, caller: Node): T {
    const node = this.downstream.get();
    if (process.env.NODE_ENV !== 'production') {
      if (typeof data !== 'undefined' && data !== null) {
        debug('ArrowPassData', this, String(data));
      }
      if (!node) {
        debug('LineEmptyDws', this);
      } else if (caller !== node) {
        debug('LineImproperCall', this);
      }
    }
    return node && node.run(void 0, this);
  }
}

export class Pipe<T = any> extends Line<T> {
  public readonly type = ElementType.Pipe;

  public readonly upstream: LineStream = new LineStream(this);
  public readonly downstream: LineStream = new LineStream(this);
  public readonly id: string | undefined;
  public readonly classes: string[];
  constructor(
    ups: Node | null | undefined,
    dws: Node<T> | null | undefined,
    { id, classes }: { id?: string, classes?: string[] } = {},
  ) {
    super();
    ups && weld(ups.downstream, this.upstream);
    dws && weld(dws.upstream, this.downstream);
    this.id = id;
    this.classes = classes || [];
  }
  public run(data: any, caller: Node): T {
    const node = this.downstream.get();
    if (process.env.NODE_ENV !== 'production') {
      if (!node) {
        debug('LineEmptyDws', this);
      } else if (caller !== node) {
        debug('LineImproperCall', this);
      }
    }
    return node && node.run(data, this);
  }
}
