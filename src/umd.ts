/**
 * This is the global export file for the UMD version of EventNet.
 */

import { config } from './config';
config.monitoring = true;

export { config };
export * from './monitor';
export * from './core';

import * as _nodes from './nodes';
export const nodes = _nodes;

import * as _lines from './lines';
export const lines = _lines;

import * as _attrs from './attrs';
export const attrs = _attrs;
