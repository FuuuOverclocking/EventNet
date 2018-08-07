import { BasicNode } from './basic-node';
import {
  ElementType,
  ILineHasDws,
  INodeCodeDWS,
  IRawNodeCode,
  NodeRunningStage,
} from './types';
import { nextTick } from './util';

export class RawNode extends BasicNode {
  public type = ElementType.RawNode;
  public readonly code: IRawNodeCode;
  public sync: boolean;
  constructor(code: IRawNodeCode, sync: boolean = true, name?: string) {
    super(code, name);
    this.sync = sync;
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
        return this.code(this.Out.wrappedStreams as INodeCodeDWS, { data, caller }, { origin: this });
      } catch (error) {
        this._errorHandler(NodeRunningStage.code, error);
      }
    } else {
      return nextTick().then(() => {
        return this.code(
          this.Out.wrappedStreams as INodeCodeDWS,
          { data, caller },
          { origin: this },
        );
      }).catch(error => {
        this._errorHandler(NodeRunningStage.code, error);
      });
    }
  }
}
