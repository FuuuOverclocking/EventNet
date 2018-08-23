import { getElementProducer } from './element';
import { BasicNode } from './node';
import {
  ElementType,
  ILineLike,
  INodeCodeDWS,
  IRawNodeCode,
  NodeRunningStage,
} from './types';

const p = Promise.resolve();

// tslint:disable-next-line:class-name
interface raw {
  /**
   * Create a EventNet RawNode.
   * @param {Function} code set the code of Node
   * @returns {RawNode} a new EventNet RawNode
   */
  (code: IRawNodeCode): RawNode;
  /**
   * Create a EventNet RawNode.
   * @param {boolean} sync whether the Node running synchronously or asynchronously
   * @param {Function} code set the code of Node
   * @returns {RawNode} a new EventNet RawNode
   */
  (sync: boolean, code: IRawNodeCode): RawNode;

  /**
   * Create a EventNet RawNode.
   * @param {boolean} sync whether the Node running synchronously or asynchronously
   * @param {Function} code set the code of Node
   * @returns {RawNode} a new EventNet RawNode
   */
  ({ sync }: { sync?: boolean }, code: IRawNodeCode): RawNode;
}

export const raw = getElementProducer((arg1: any, arg2?: any): RawNode => {
  if (typeof arg1 === 'function') {
    return new RawNode({ sync: true }, arg1);
  } else if (typeof arg1 === 'boolean') {
    return new RawNode({ sync: arg1 }, arg2);
  } else {
    return new RawNode(arg1, arg2);
  }
}, 'RawNode') as raw;

export class RawNode extends BasicNode {
  public type = ElementType.RawNode;
  public readonly code: IRawNodeCode;
  public sync: boolean;
  constructor({ sync = true }, code: IRawNodeCode) {
    super(code);
    this.sync = sync;
  }

  public clone(): RawNode {
    const clonedNode = new RawNode({ sync: this.sync }, this.code);
    return clonedNode;
  }

  public destory() {
    for (const fn of this.ondestroy) {
      fn.call(this, this);
    }
    ////////////////////////////////////////////
  }

  public run(data?: any, caller?: ILineLike): any | Promise<any> {
    if (this.sync) {
      try {
        return this.code(
          { data, caller },
          this.downstream.wrappedElements as INodeCodeDWS,
          { origin: this },
        );
      } catch (error) {
        this._errorHandler(NodeRunningStage.code, error);
      }
    } else {
      return p.then(() => {
        return this.code(
          { data, caller },
          this.downstream.wrappedElements as INodeCodeDWS,
          { origin: this },
        );
      }).catch(error => {
        this._errorHandler(NodeRunningStage.code, error);
      });
    }
  }
}
