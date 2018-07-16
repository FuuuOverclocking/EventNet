/**
 * EventNet
 * Created by X.Y.Z. at March 3rd, 2018.
 * @version 0.0.2
 */
import { IAttrsStore, IDictionary, INodeCode, INormalAttr, INormalAttrFunc } from "./types";
import { NormalNode } from "./internal/dev/normal_node";
import debug = require("debug");
export declare const _debug: debug.IDebugger;
interface IEventNet {
    (attrs: IDictionary, state: IDictionary, code: INodeCode): NormalNode;
    (attrs: IDictionary, code: INodeCode): NormalNode;
    (code: INodeCode): NormalNode;
    installAttr: typeof installAttr;
    getAttrDefinition: typeof getAttrDefinition;
    defaultState: any;
    _attrsStore: IAttrsStore;
}
/**
 * Create a EventNet Node.
 * @param {Object} [attrs] set the attributes of Node
 * @param {Object} [states] set the initial state of Node, the `attrs` must be set firstly to set this item
 * @param {Function} code - set the code that is executed when the Node runs
 * @return {NormalNode} a new normal EventNet Node
 */
export declare const en: IEventNet;
export declare const _attrsStore: IAttrsStore;
export declare function installAttr(name: string, type: "number" | "string" | "object" | "symbol" | "boolean" | "function"): void;
export declare function installAttr(name: string, attr: INormalAttr): void;
export declare const getAttrDefinition: (name: string) => (INormalAttrFunc | undefined)[] | undefined;
export declare const defaultState: {
    data: {};
    error: null;
    runTimes: number;
    running: number;
};
export {};
