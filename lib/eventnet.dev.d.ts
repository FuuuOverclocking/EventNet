/** EventNet
 * Created by X.Y.Z. at March 3rd, 2018.
 * @version 0.0.2
 */
import { IDictionary, INode, INodeCode, INormalAttr, INormalAttrFunc, IStreamOfElement } from "./types";
/**
 * Create a EventNet Node
 * @param attrs - add attributes to Node.
 * @param states - add initial state to Node.
 * @param code - set the code that is executed when the Node runs.
 */
interface IEventNet {
    (attrs: IDictionary, states: IDictionary, code: INodeCode): Node;
    (attrs: IDictionary, code: INodeCode): Node;
    (codes: INodeCode): Node;
    installAttr: typeof installAttr;
    getAttrDefinition: (name: string) => string | [INormalAttrFunc | undefined, INormalAttrFunc | undefined] | false;
    defaultState: any;
}
declare const en: IEventNet;
export = en;
declare function installAttr(name: string, type: "number" | "string" | "object" | "symbol" | "boolean" | "function"): void;
declare function installAttr(name: string, attr: INormalAttr): void;
declare class Node implements INode {
    parentNode: INode | undefined;
    upstream: IStreamOfElement;
    downstream: IStreamOfElement;
    private _watchers;
    readonly watchers: IDictionary;
    state: IDictionary;
    readonly code?: INodeCode;
    private attrBeforeSequence;
    private attrAfterSequence;
    private _attr;
    private _inheritAttr;
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
    run(): Promise<void>;
    private _code;
}
