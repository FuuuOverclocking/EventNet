import { ElementType, LineLike } from '../types';
import { tip } from './debug';
import { Element, getUid } from './element';
import { Node } from './node';
import { LinePort } from './port';
import { assign, truncate } from './util/index';

export abstract class Line<T = any> implements Element<T>, LineLike<T> {
  public readonly uid = getUid();
  public readonly isLine = true;
  public abstract readonly type?: number;

  public abstract run(data?: any, opt?: { caller?: Node; [i: string]: any; }): T;
  public abstract readonly ups: LinePort;
  public abstract readonly dws: LinePort;

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

export interface Line<T = any> extends Element<T> { }

export class Arrow<T = any> extends Line<T> {
  public readonly type: ElementType.Arrow;

  public readonly ups: LinePort = new LinePort(this);
  public readonly dws: LinePort = new LinePort(this);
  public readonly id: string | undefined;
  public readonly classes: string[];
  constructor(
    ups: Node | null | undefined,
    dws: Node<T> | null | undefined,
    { id, classes }: { id?: string, classes?: string[] } = {}
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
        tip(`data '${truncate(String(data))}' can not pass through an Arrow, replace with a Pipe`,
          this
        );
      }
      if (!node) {
        tip('the downstream of the line is empty', this);
      } else if (!opt || opt.caller !== node) {
        tip('the arrow is activited but not called by its upstream', this);
      }
    }
    if (node) {
      return node.run(void 0, this);
    }
    return void 0 as any;
  }

  public generateIdentity(): { [field: string]: any } {
    return assign(super.generateIdentity(), { type: 'Arrow' });
  }
}
(Arrow.prototype.type as any) = ElementType.Arrow;


export class Pipe<T = any> extends Line<T> {
  public readonly type: ElementType.Pipe;

  public readonly ups: LinePort = new LinePort(this);
  public readonly dws: LinePort = new LinePort(this);
  public readonly id: string | undefined;
  public readonly classes: string[];
  constructor(
    ups: Node | null | undefined,
    dws: Node<T> | null | undefined,
    { id, classes }: { id?: string, classes?: string[] } = {}
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
        tip('the downstream of the line is empty', this);
      } else if (!opt || opt.caller !== node) {
        tip('the arrow is activited but not called by its upstream', this);
      }
    }
    if (node) {
      return node.run(data, this);
    }
    return void 0 as any;
  }

  public generateIdentity(): { [field: string]: any } {
    return assign(super.generateIdentity(), { type: 'Pipe' });
  }
}
(Pipe.prototype.type as any) = ElementType.Pipe;
