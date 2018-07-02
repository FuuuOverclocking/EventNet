/** EventNet
 * Created by X.Y.Z. at March 3rd, 2018.
 * @version 0.0.2
 */
import { IDictionary, INode, INodeCode, INormalAttr, INormalAttrFunc } from "./types";
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
    installAttr?: typeof installAttr;
    getAttr?: (name: string) => string | [INormalAttrFunc | undefined, INormalAttrFunc | undefined] | false;
    defaultState?: any;
}
declare const en: IEventNet;
export default en;
declare function installAttr(name: string, type: "number" | "string" | "object" | "symbol" | "boolean" | "function"): void;
declare function installAttr(name: string, attr: INormalAttr): void;
export declare class Node implements INode {
    readonly numberOfLegs: number;
    constructor(attr: IDictionary, state: IDictionary, code: INodeCode);
}
