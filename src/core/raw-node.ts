import { BasicNode } from "./basic-node";
import {
    ElementType, ICallableElementLike, IDictionary,
    IElement, ILineLike, INodeCode,
    INodeCodeDWS, INodeLike, NodeRunningStage,
} from "./types";
import { handleError } from "./util";

export class RawNode extends BasicNode {
    public type = ElementType.RawNode;
    public sync: boolean;
    constructor(code: INodeCode, sync: boolean = true, name?: string) {
        super(code, name);
        this.sync = sync;
    }

    public run(data: any, caller?: ILineLike): any | Promise<any> {
        if (this.sync) {
            try {
                return this.code(this.downstream.wrappedContent, { data, caller }, { origin: this });
            } catch (error) {
                this.errorHandler(NodeRunningStage.code, error);
            }
        } else {
            return (this.code(
                this.downstream.wrappedContent,
                { data, caller },
                { origin: this },
            ) as Promise<any>).catch(
                (error) => {
                    this.errorHandler(NodeRunningStage.code, error);
                });
        }
    }
}
