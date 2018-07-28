/**
 * EventNet
 * Created by X.Y.Z. at March 3rd, 2018.
 * @version 0.0.2
 */
import {
  IDictionary,
  INodeCode,
} from './types';

import { _attrsStore, getAttrDefinition, installAttr } from './attr-manager';
import './install-default-attrs';

import { defaultState, NormalNode } from './normal-node';
import { RawNode } from './raw-node';

/**
 * Create a EventNet NormalNode.
 * @param {Object} attrs set the attributes of Node
 * @param {Object} states set the initial state of Node, the `attrs` must be set firstly to set this item
 * @param {Function} code set the code of Node
 * @return {NormalNode} a new EventNet NormalNode
 */
export function nn(attrs: IDictionary, state: IDictionary, code: INodeCode): NormalNode;
/**
 * Create a EventNet NormalNode.
 * @param {Object} attrs set the attributes of Node
 * @param {Function} code set the code of Node
 * @return {NormalNode} a new EventNet NormalNode
 */
export function nn(attrs: IDictionary, code: INodeCode): NormalNode;
/**
 * Create a EventNet NormalNode.
 * @param {Function} code set the code of Node
 * @return {NormalNode} a new EventNet NormalNode
 */
export function nn(code: INodeCode): NormalNode;

export function nn(attrs: any, state?: any, code?: any) {
  if (typeof attrs === 'object' && typeof state === 'object' && typeof code === 'function') {
    return new NormalNode(attrs, state, code);
  } else if (typeof attrs === 'object' && typeof state === 'function') {
    return new NormalNode(attrs, {}, state);
  } else {
    return new NormalNode({}, {}, attrs);
  }
}

/**
 * Create a EventNet RawNode.
 * @param {Function} code set the code of Node
 * @param {boolean} sync whether the Node running synchronously or asynchronously
 * @param {string} name set the name of Node
 * @returns {RawNode} a new EventNet RawNode
 */
export function raw(code: INodeCode, sync: boolean = true, name?: string): RawNode {
  return new RawNode(code, sync, name);
}

export { _attrsStore, installAttr, getAttrDefinition };
export { defaultState, NormalNode };
export { RawNode };
