import { BasicNode } from './node';
import {
  ElementType,
  ILineHasDws,
  INodeCodeDWS,
  IRawNodeCode,
  NodeRunningStage,
} from './types';

const p = Promise.resolve();

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
    for (const fn of this.ondestory) {
      fn.call(this, this);
    }
    ////////////////////////////////////////////
  }

  public run(data?: any, caller?: ILineHasDws): any | Promise<any> {
    if (this.sync) {
      try {
        return this.code(
          this.Out.wrappedElements as INodeCodeDWS,
          { data, caller },
          { origin: this },
        );
      } catch (error) {
        this._errorHandler(NodeRunningStage.code, error);
      }
    } else {
      return p.then(() => {
        return this.code(
          this.Out.wrappedElements as INodeCodeDWS,
          { data, caller },
          { origin: this },
        );
      }).catch(error => {
        this._errorHandler(NodeRunningStage.code, error);
      });
    }
  }
}
