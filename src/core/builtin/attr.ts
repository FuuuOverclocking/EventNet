import { assign, noop, tryCatch, unchangingPromise } from '../util/index';
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

export interface AttrRunCtx {
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
  public value: { [i: string]: any };
  public sequence: Attr[];
  constructor(attrs?: Attr[]) {
    this.init(attrs);
  }
  public init(attrs?: Attr[]) {
    this.value = {};
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

  /**
   *
   * @param ctx
   * @param callback
   * @param onerror
   */
  public onrun(
    ctx: AttrRunCtx,
    callback: () => void,
    onerror: (err: any, index: number) => void
  ) {
    const seq = this.sequence;
    const seqLen = seq.length;
    const indexList = [] as number[];

    for (let i = 0; i < seqLen; ++i) {
      if (seq[i].type === AttrType.run) {
        indexList.push(i);
      }
    }

    let j = 0; // for indexList

    ctx.attrValue = this.value;

    function onErr(err: any) {
      if (!err) return;
      if (j === seqLen) {
        j = -1;
      }
      onerror(err, j);
      return unchangingPromise;
    }

    function next(cb: () => void) {
      if (j !== seqLen) {
        (seq[indexList[j]] as any).action(ctx, next);
        ++j;
      } else {
        callback();
      }

      const result = ctx.returnVal;
      if (result instanceof Promise) {
        ctx.returnVal = result.then(() => {
          --j;
          cb();
        }, onErr as any);
      } else {
        --j;
        cb();
      }
    }

    tryCatch(() => {
      next(noop);
    });
    onErr(tryCatch.getErr());
  }
}
