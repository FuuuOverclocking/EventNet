import { assign, noop } from '../util';
import { BasicNode } from './basicNode';

export enum AttrType {
  /** just as a key-value pair */
  value,
  /** perform an action after the construction */
  constructed,
  /** perform an action before running */
  run,
  /** perform an action when error happen */
  error,
}

interface AttrRunCtx {
  data: any;
  returnVal: any;
  state?: any;
  node: BasicNode;
  attrValue: { [i: string]: any; };
  [i: string]: any;
}

export type Attr = {
  type: AttrType.value;
  value: { [i: string]: any; };
} | {
  type: AttrType.constructed;
  action: (node: BasicNode, attrValue: { [i: string]: any; }) => void;
} | {
  type: AttrType.run;
  action: (
    ctx: AttrRunCtx,
    next: (cb: () => void) => void
  ) => void;
} | {
  type: AttrType.error;
  /** @return whether prevent default error handling */
  action: (
    err: any,
    node: BasicNode,
    attrValue: { [i: string]: any; }
  ) => boolean | void;
};

export class Attrs {
  public value: { [i: string]: any } = {};
  public sequence: Attr[];
  constructor(attrs?: Attr[]) {
    const seq = this.sequence = attrs || [];
    for (let i = 0, l = seq.length; i < l; ++i) {
      if (seq[i].type === AttrType.value) {
        assign(this.value, (seq[i] as any).value);
      }
    }
  }

  public onconstructed(node: BasicNode) {
    const seq = this.sequence;
    const val = this.value;
    for (let i = 0, l = seq.length; i < l; ++i) {
      if (seq[i].type === AttrType.constructed) {
        (seq[i] as any).action(node, val);
      }
    }
  }

  /**
   * @return whether prevent default error handling
   */
  public onerror(err: any, node: BasicNode) {
    const seq = this.sequence;
    const val = this.value;
    for (let i = 0, l = seq.length; i < l; ++i) {
      if (seq[i].type === AttrType.constructed) {
        if ((seq[i] as any).action(err, node, val)) return true;
      }
    }
    return false;
  }

  public onrun(ctx: AttrRunCtx, callback: () => void) {
    const seq = this.sequence;
    const seqLen = seq.length;
    let i = 0;
    let end = false;

    ctx.attrValue = this.value;

    function next(cb: () => void) {
      if (i === seqLen) {
        end = true;
      }
      while (!end && seq[i].type !== AttrType.run) {
        ++i;
        if (i === seqLen) {
          end = true;
        }
      }
      ++i;

      if (end) {
        callback();
      } else {
        (seq[i - 1] as any).action(ctx, next);
      }

      const result = ctx.returnVal;
      if (result instanceof Promise) {
        ctx.returnVal = result.then(() => {
          cb();
        });
      } else {
        cb();
      }
    }
    next(noop);
  }
}
