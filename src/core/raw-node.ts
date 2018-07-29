import { BasicNode } from './basic-node';
import {
  ElementType,
  ILineHasDws,
  IRawNodeCode,
  NodeRunningStage,
} from './types';
import { nextTick } from './util';

export class RawNode extends BasicNode {
  public type = ElementType.RawNode;
  public code: IRawNodeCode;
  public sync: boolean;
  constructor(code: IRawNodeCode, sync: boolean = true, name?: string) {
    super(code, name);
    this.sync = sync;
  }

  public run(data?: any, caller?: ILineHasDws): any | Promise<any> {
    if (this.sync) {
      try {
        return this.code(this.Out.wrappedContent, { data, caller }, { origin: this });
      } catch (error) {
        this.errorHandler(NodeRunningStage.code, error);
      }
    } else {
      return nextTick().then(() => {
        return this.code(
          this.Out.wrappedContent,
          { data, caller },
          { origin: this },
        );
      }).catch(error => {
          this.errorHandler(NodeRunningStage.code, error);
        });
    }
  }
}
