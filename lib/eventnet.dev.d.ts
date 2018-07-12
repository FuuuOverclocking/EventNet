/**
 * EventNet
 * Created by X.Y.Z. at March 3rd, 2018.
 * @version 0.0.2
 */
import { IDictionary, IElementLike, ILine, INode, INodeCode, INormalAttr, INormalAttrFunc, IStreamOfElement, ITypedDictionary } from "./types";
interface IEventNet {
    (attrs: IDictionary, states: IDictionary, code: INodeCode): Node;
    (attrs: IDictionary, code: INodeCode): Node;
    (code: INodeCode): Node;
    installAttr: typeof installAttr;
    getAttrDefinition: (name: string) => string | [INormalAttrFunc | undefined, INormalAttrFunc | undefined, INormalAttrFunc | undefined] | undefined;
    defaultState: any;
}
/**
 * Create a EventNet Node.
 * @param {Object} [attrs] set the attributes of Node
 * @param {Object} [states] set the initial state of Node, the `attrs` must be set firstly to set this item
 * @param {Function} code - set the code that is executed when the Node runs
 * @return {Node} a new normal EventNet Node
 */
declare const en: IEventNet;
export = en;
declare function installAttr(name: string, type: "number" | "string" | "object" | "symbol" | "boolean" | "function"): void;
declare function installAttr(name: string, attr: INormalAttr): void;
declare class StreamOfNode implements IStreamOfElement {
    add(stream: ILine): void;
    get(index?: number): ILine | ILine[] | undefined;
    getById(id?: string): ILine | ITypedDictionary<ILine> | undefined;
    private content;
    private contentById;
    wrappedContent: any;
    private wrapper;
    constructor(wrapper?: (line: ILine) => any);
}
declare class Node implements INode {
    upstream: StreamOfNode;
    downstream: StreamOfNode;
    parentNode: INode | undefined;
    private _watchers;
    readonly watchers: IDictionary;
    state: IDictionary;
    private _attr;
    private _inheritAttr;
    private attrBeforeSequence;
    private attrAfterSequence;
    private attrFinishSequence;
    readonly attr: IDictionary;
    setAttr(attrs: Array<{
        name: string;
        value: any;
    }>): void;
    setInheritAttr(attrs: Array<{
        name: string;
        value: any;
    }>): void;
    private sortAttr;
    constructor(attr: IDictionary, state: IDictionary, code: INodeCode);
    run(data: any, caller?: IElementLike): any;
    readonly code: INodeCode;
    private errorHandler;
    private _codeAsync;
    private _codeSync;
    private codeParam;
    private static codeParamDws;
    private codeDwsDataAttrAfterProcess;
}
