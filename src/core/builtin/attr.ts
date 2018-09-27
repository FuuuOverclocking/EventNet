import { NodeAttr, NodeAttrFn } from '../../types';
import { assign } from '../../util/assign';
import { nextMoment } from '../../util/nextMoment';
import { debug, fulfilledPromise, hasPromise } from '../debug';

export const attrManager = {
  attrStore: {} as { [name: string]: NodeAttr },
  registerAttr,
};

function registerAttr(
  this: typeof attrManager,
  name: string,
  val: NodeAttr,
) {
  if (process.env.NODE_ENV !== 'production') {
    if (typeof this.attrStore[name]) {
      debug('AttrDuplicate', void 0);
    }
  }
  if (val.before && typeof val.beforePriority !== 'number') {
    val.beforePriority = 9999;
  }
  if (val.after && typeof val.afterPriority !== 'number') {
    val.afterPriority = 9999;
  }
  this.attrStore[name] = {
    before: val.before,
    beforePriority: val.beforePriority,
    after: val.after,
    afterPriority: val.afterPriority,
  };
}

type NodeAttrVal = any;
type NodeAttrPriority = number;

export class Attrs {
  public inherited: { [i: string]: any | NodeAttr } = {};
  public own: { [i: string]: any | NodeAttr } = {};

  public all: { [i: string]: any | NodeAttr } = {};
  public setOwn(attrs: { [i: string]: any | NodeAttr }) {
    assign(this.own, attrs);
    assign(this.all, this.inherited);
    assign(this.all, this.own);
  }
  public setInherited(attrs: { [i: string]: any | NodeAttr }) {
    assign(this.inherited, attrs);
    assign(this.all, this.inherited);
    assign(this.all, this.own);
  }
  /**
   * The smaller the priority, the earlier `attrFn` is executed.
   * NOTE: This sequence is sorted in descending order of priority.
   * So it should be executed from the back to the front.
   */
  public beforeSeq: Array<[NodeAttrFn, NodeAttrVal, NodeAttrPriority]> = [];

  /**
   * The larger the priority, the earlier `attrFn` is executed.
   * NOTE: This sequence is sorted in ascending order of priority.
   * So it should be executed from the back to the front.
   */
  public afterSeq: Array<[NodeAttrFn, NodeAttrVal, NodeAttrPriority]> = [];

  /**
   * A flag to indicate whether `attrs` is about to sort.
   */
  public willSort = false;

  /**
   * `attrs` will be sorted at the next moment.
   */
  public toSort() {
    if (this.willSort) { return; }
    this.willSort = true;
    nextMoment(this.sort.bind(this));
  }

  public sort() {
    if (!this.willSort) { return; }
    this.willSort = false;
    this.beforeSeq.length = this.afterSeq.length = 0;

    const keys = Object.keys(this.all);
    let i = keys.length;
    while (--i) {
      const name = keys[i];
      let val = this.all[name];
      if (typeof val === 'undefined') { continue; }

      let attr: NodeAttr = attrManager.attrStore[name];
      if (!attr) {
        attr = val;
        val = void 0;
      }

      attr.before && this.beforeSeq.push([attr.before, val, attr.beforePriority!]);
      attr.after && this.afterSeq.push([attr.after, val, attr.afterPriority!]);
    }
    this.beforeSeq.sort((a, b) => b[2] - a[2]);
    this.afterSeq.sort((a, b) => a[2] - b[2]);
  }
}
