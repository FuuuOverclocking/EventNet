import { ElementType, LineLike } from '../types';
import { debug } from './debug';
import { Element, getUid } from './element';
import { Node } from './node';
import { LineStream } from './stream';
import { assign } from './util/index';

export abstract class Line<T = any> implements Element<T>, LineLike<T> {
  public readonly uid = getUid();
  public readonly isLine = true;
  public abstract readonly type?: number;

  public abstract run(data?: any, opt?: { caller?: Node; [i: string]: any; }): T;
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

  public static ify: <T extends LineLike>(el: T) => Line;

}

export interface Line<T = any> extends Element<T> {}

export class Arrow<T = any> extends Line<T> {
  public readonly type: ElementType.Arrow;

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
    ups && ups.dws.weld(this.ups);
    dws && dws.ups.weld(this.dws);
    this.id = id;
    this.classes = classes || [];
  }
  public run(data: undefined | null, opt?: { caller?: Node; [i: string]: any; }): T {
    const node = this.dws.get();
    if (process.env.NODE_ENV !== 'production') {
      if (typeof data !== 'undefined' && data !== null) {
        debug('ArrowPassData', this, data);
      }
      if (!node) {
        debug('LineEmptyDws', this);
      } else if (!opt || opt.caller !== node) {
        debug('LineImproperCall', this);
      }
    }
    return node && node.run(void 0, this);
  }

  public generateIdentity(): { [field: string]: any } {
    return assign(super.generateIdentity(), { type: 'Arrow' });
  }
}
(Arrow.prototype.type as any) = ElementType.Arrow;


export class Pipe<T = any> extends Line<T> {
  public readonly type: ElementType.Pipe;

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
    ups && ups.dws.weld(this.ups);
    dws && dws.ups.weld(this.dws);
    this.id = id;
    this.classes = classes || [];
  }
  public run(data: any, opt?: { caller?: Node; [i: string]: any; }): T {
    const node = this.dws.get();
    if (process.env.NODE_ENV !== 'production') {
      if (!node) {
        debug('LineEmptyDws', this);
      } else if (!opt || opt.caller !== node) {
        debug('LineImproperCall', this);
      }
    }
    return node && node.run(data, this);
  }

  public generateIdentity(): { [field: string]: any } {
    return assign(super.generateIdentity(), { type: 'Pipe' });
  }
}
(Pipe.prototype.type as any) = ElementType.Pipe;
