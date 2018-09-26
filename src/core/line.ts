import { ElementType, LineLike, UnaryFunction } from '../types';
import { assign } from '../util/assign';
import { debug } from './debug';
import { Element, getUid } from './element';
import { Node } from './node';
import { LineStream, weld } from './stream';

export abstract class Line<T = any> implements Element<T>, LineLike<T> {
  public readonly uid = getUid();
  public readonly isLine = true;
  public abstract readonly type?: number;

  public abstract run(data?: any, caller?: Node): T;
  public abstract readonly ups: LineStream;
  public abstract readonly dws: LineStream;

  public readonly id?: string;
  public readonly classes?: string[];
  public generateIdentity(): { [field: string]: any } {
    return {
      uid: this.uid,
      is: 'Line',
      id: this.id,
      classes: this.classes,
    };
  }
}

export interface Line<T = any> extends Element<T> {}

export namespace Line {
  /**
   * Trying to transform an object into Line
   */
  export const ify = <T extends LineLike>(el: T) => {
    (el as any).isLine = true;
    return Element.ify(el);
  };
}

Line.prototype.biu = Element.biu;

export class Arrow<T = any> extends Line<T> {
  public readonly type = ElementType.Arrow;

  public readonly ups: LineStream = new LineStream(this);
  public readonly dws: LineStream = new LineStream(this);
  public readonly id: string | undefined;
  public readonly classes: string[];
  constructor(
    ups: Node | null | undefined,
    dws: Node<T> | null | undefined,
    { id, classes }: { id?: string, classes?: string[] } = {},
  ) {
    super();
    ups && weld(ups.dws, this.ups);
    dws && weld(dws.ups, this.dws);
    this.id = id;
    this.classes = classes || [];
  }
  public run(data: undefined | null, caller: Node): T {
    const node = this.dws.get();
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

  public generateIdentity(): { [field: string]: any } {
    return assign(super.generateIdentity(), { type: 'Arrow' });
  }
}

export class Pipe<T = any> extends Line<T> {
  public readonly type = ElementType.Pipe;

  public readonly ups: LineStream = new LineStream(this);
  public readonly dws: LineStream = new LineStream(this);
  public readonly id: string | undefined;
  public readonly classes: string[];
  constructor(
    ups: Node | null | undefined,
    dws: Node<T> | null | undefined,
    { id, classes }: { id?: string, classes?: string[] } = {},
  ) {
    super();
    ups && weld(ups.dws, this.ups);
    dws && weld(dws.ups, this.dws);
    this.id = id;
    this.classes = classes || [];
  }
  public run(data: any, caller: Node): T {
    const node = this.dws.get();
    if (process.env.NODE_ENV !== 'production') {
      if (!node) {
        debug('LineEmptyDws', this);
      } else if (caller !== node) {
        debug('LineImproperCall', this);
      }
    }
    return node && node.run(data, this);
  }

  public generateIdentity(): { [field: string]: any } {
    return assign(super.generateIdentity(), { type: 'Pipe' });
  }

}
