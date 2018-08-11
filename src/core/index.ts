/**
 * EventNet
 * Created by X.Y.Z. at March 3rd, 2018.
 * @version 0.0.2
 */
import { _attrsStore, getAttrDefinition, installAttr } from './attr-manager';
import './install-default-attrs';

import { IDictionary, INormalNodeCode, IRawNodeCode } from './types';

import { defaultState, NormalNode } from './normal-node';
import { RawNode } from './raw-node';

/**
 * Create a EventNet NormalNode.
 * @param {Object} attrs set the attributes of Node
 * @param {Object} states set the initial state of Node, the `attrs` must be set firstly to set this item
 * @param {Function} code set the code of Node
 * @return {NormalNode} a new EventNet NormalNode
 */
export function nn(attrs: IDictionary, state: IDictionary, code: INormalNodeCode): NormalNode;
/**
 * Create a EventNet NormalNode.
 * @param {Object} attrs set the attributes of Node
 * @param {Function} code set the code of Node
 * @return {NormalNode} a new EventNet NormalNode
 */
export function nn(attrs: IDictionary, code: INormalNodeCode): NormalNode;
/**
 * Create a EventNet NormalNode.
 * @param {Function} code set the code of Node
 * @return {NormalNode} a new EventNet NormalNode
 */
export function nn(code: INormalNodeCode): NormalNode;

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
 * @returns {RawNode} a new EventNet RawNode
 */
export function raw(code: IRawNodeCode): RawNode;
/**
 * Create a EventNet RawNode.
 * @param {boolean} sync whether the Node running synchronously or asynchronously
 * @param {Function} code set the code of Node
 * @returns {RawNode} a new EventNet RawNode
 */
export function raw(sync: boolean, code: IRawNodeCode): RawNode;

/**
 * Create a EventNet RawNode.
 * @param {boolean} sync whether the Node running synchronously or asynchronously
 * @param {Function} code set the code of Node
 * @returns {RawNode} a new EventNet RawNode
 */
// tslint:disable-next-line:unified-signatures
export function raw({ sync }: { sync?: boolean }, code: IRawNodeCode): RawNode;

export function raw(arg1: any, arg2?: any): RawNode {
  if (typeof arg1 === 'function') {
    return new RawNode({ sync: true }, arg1);
  } else if (typeof arg1 === 'boolean') {
    return new RawNode({ sync: arg1 }, arg2);
  } else {
    return new RawNode(arg1, arg2);
  }
}

export { _attrsStore, installAttr, getAttrDefinition };
export { defaultState, NormalNode };
export { RawNode };

export { weld, deweld } from './weld';

// temporary /////////////////////////////////////
export * from './lines';
export * from './nodes';
