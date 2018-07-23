import { StreamOfNode } from "./stream_of_node";
import { ElementType, ICallableElementLike, ILine, INode, INodeCode, NodeRunningStage } from "./types";

export abstract class BasicNode {
    public abstract type: ElementType;
    public parentNode: INode | undefined = void 0;
    public upstream = new StreamOfNode();
    public downstream = new StreamOfNode();
    public abstract run(data: any, caller?: ILine): any;
    public readonly code: INodeCode;
    constructor(code: INodeCode) {
        this.code = code;
    }
    protected _errorReceiver: ILine | undefined = void 0;
    public set errorReceiver(element: ILine | INode) {
        if (!(element.type & 1)) {
            this._errorReceiver = this.createPipe(element as INode, { feature: "error" });
        } else if (element.type === ElementType.Pipe) {
            this._errorReceiver = element;
        } else {
            throw new Error("EventNet.Node.errorReceiver: errorReceiver must be assigned to an type of Node or Pipe.");
        }
    }
    protected errorHandler(when: NodeRunningStage, what?: any) {
        if (typeof this._errorReceiver === "undefined") {
            throw { when, what };
        } else {
            this._errorReceiver.run({ when, what }, this);
        }
    }
    public createLine(node: INode, options: any = {}, type: ElementType) {
        options.smart = !!(type & 0b10);
        if (type & 0b100) {
            if (type & 0b1000) {
                return this.createTwpipe(node, options);
            } else {
                return this.createPipe(node, options);
            }
        } else {
            return this.createArrow(node, options);
        }
    }
    public createArrow(node: INode, options?: {}): ILine {
        return {} as any;
    }
    public createPipe(node: INode, options?: {}): ILine {
        return {} as any;
    }
    public createTwpipe(node: INode, options?: {}): ILine {
        return {} as any;
    }
    public arrow(node: INode, options?: {}): INode {
        this.createArrow(node, options);
        return node;
    }
    public pipe(node: INode, options?: {}): INode {
        this.createPipe(node, options);
        return node;
    }
    public twpipe(node: INode, options?: {}): INode {
        this.createTwpipe(node, options);
        return node;
    }
    public alsoArrow(node: INode, options?: {}): INode {
        this.createArrow(node, options);
        return this;
    }
    public alsoPipe(node: INode, options?: {}): INode {
        this.createPipe(node, options);
        return this;
    }
    public alsoTwpipe(node: INode, options?: {}): INode {
        this.createTwpipe(node, options);
        return this;
    }
}
