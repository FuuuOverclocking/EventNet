/**
 * EventNet
 * Created by X.Y.Z. at March 3rd, 2018.
 * @version 0.0.2
 */

import { _attrsStore, getAttrDefinition, installAttr } from "./attr-manager";
import "./install_default_attrs";
import { NormalNode } from "./normal-node";
export { NormalNode };
import {
    ElementType, IAttrFuncCondition, IAttrsStore, ICallableElementLike, IDictionary, IElement, ILineLike,
    INodeCode, INodeCodeDWS, INodeLike, INormalAttr, INormalAttrFunc,
    IStreamOfElement, ITypedDictionary, NodeRunningStage,
} from "./types";

interface IEventNet {
    (attrs: IDictionary, state: IDictionary, code: INodeCode): NormalNode;
    (attrs: IDictionary, code: INodeCode): NormalNode;
    (code: INodeCode): NormalNode;
    installAttr: typeof installAttr;
    getAttrDefinition: typeof getAttrDefinition;
    defaultState: any;
    _attrsStore: typeof _attrsStore;
}

/**
 * Create a EventNet NormalNode.
 * @param {Object} [attrs] set the attributes of Node
 * @param {Object} [states] set the initial state of Node, the `attrs` must be set firstly to set this item
 * @param {Function} code - set the code that is executed when the Node runs
 * @return {NormalNode} a new EventNet NormalNode
 */
export const en = ((attrs: any, state?: any, code?: any) => {
    if (typeof attrs === "object" && typeof state === "object" && typeof code === "function") {
        return new NormalNode(attrs, state, code);
    } else if (typeof attrs === "object" && typeof state === "function") {
        return new NormalNode(attrs, {}, state);
    } else {
        return new NormalNode({}, {}, attrs);
    }
}) as IEventNet;

export { _attrsStore, installAttr, getAttrDefinition};
en._attrsStore = _attrsStore;
en.installAttr = installAttr;
en.getAttrDefinition = getAttrDefinition;

// The default state of each new Node.
// The states of Node created by calling en() is the result
// of assigning parameter `states` to the default state.
export const defaultState = {
    data: {},
    error: null,
    runningTimes: 0,
    running: 0,
};

en.defaultState = defaultState;
