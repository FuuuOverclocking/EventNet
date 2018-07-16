import { ElementType, IDictionary, IElementLike, ILine, INode, INodeCode } from "../../types";
import { StreamOfNode } from "./stream_of_node";
export declare class NormalNode implements INode {
    type: ElementType.NormalNode;
    upstream: StreamOfNode;
    downstream: StreamOfNode;
    parentNode: INode | undefined;
    state: IDictionary;
    private _watchers;
    readonly watchers: IDictionary;
    private _attrs;
    readonly attrs: IDictionary;
    readonly allAttrs: IDictionary;
    setAttrs(attrs: Array<{
        name: string;
        value: any;
    }>): void;
    _setInheritAttrs(attrs: Array<{
        name: string;
        value: any;
    }>): void;
    private sortAttrs;
    constructor(attrs: IDictionary, state: IDictionary, code: INodeCode);
    run(data: any, caller?: IElementLike): any;
    readonly code: INodeCode;
    private _errorReceiver;
    errorReceiver: ILine | INode;
    private errorHandler;
    private _codeAsync;
    private _codeSync;
    private codeParam;
    private static codeParamDws;
    private codeDwsDataAttrAfterProcess;
    createLine(node: INode, options: any, type: ElementType): ILine;
    createArrow(node: INode, options?: {}): ILine;
    createPipe(node: INode, options?: {}): ILine;
    createTwpipe(node: INode, options?: {}): ILine;
    arrow(node: INode, options?: {}): INode;
    pipe(node: INode, options?: {}): INode;
    twpipe(node: INode, options?: {}): INode;
    alsoArrow(node: INode, options?: {}): INode;
    alsoPipe(node: INode, options?: {}): INode;
    alsoTwpipe(node: INode, options?: {}): INode;
}
