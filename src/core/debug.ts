import { config } from '../config';
import { NodeErr } from '../types';
import { Node } from './node';
import { hasConsole as has_console, noop, truncate } from './util';

export let debug: {
   err(err: any, node?: Node, location?: string): void;
   warn(msg: string, node?: Node, location?: string): void;
   tip(msg: string): void;
   handleNodeErr(err: NodeErr): void;
} = {} as any;

const user_handler = config.debug_handler;
const use_default_msg = has_console && !config.silent;

debug.err = (err: any, node?: Node, location?: string) => {
   if (user_handler.err && user_handler.err(err, node, location)) {
      return;
   } else if (use_default_msg) {
      const trace = node ? generateNodeTrace(node) : '    no node information';

      if (err instanceof Error) {
         const stack_msg =
            err.stack ||
            err.name + ': ' + err.message;
         console.error(`EventNet.debug.err: ${stack_msg}`);
         console.error(`EventNet Trace:${
            location ? 'Error occurred at' + location : ''
            }\n${trace}`);
      } else {
         console.error(
            'EventNet.debug.err:\n' +
               typeof err === 'string' ? err :
               ('[type] = ' + typeof err + '\n' +
                  '[value] = ' + String(err) + '\n')
         );
         console.trace();
         console.error(`EventNet Trace:${
            location ? ' Error occurred at' + location : ''
            }\n${trace}`);
      }
   }
};

debug.warn = (msg: string, node?: Node, location?: string) => {
   if (user_handler.warn && user_handler.warn(msg, node, location)) {
      return;
   } else if (use_default_msg) {
      const trace = node ? generateNodeTrace(node) : '    no node information';
      console.warn(msg);
      console.warn(`EventNet Trace:${
         location ? ' Warning from ' + location : ''
         }\n${trace}`);
   }
};

debug.tip = (msg: string) => {
   if (user_handler.tip && user_handler.tip(msg)) {
      return;
   } else if (use_default_msg) {
      console.log(msg);
   }
};

debug.handleNodeErr = (err: NodeErr) => {
   if (user_handler.handleNodeErr && user_handler.handleNodeErr(err)) {
      return;
   } else if (use_default_msg) {
      debug.err(err.what, err.where[0]);
      console.error(
         'call by port: ' +
         err.when.caller ? err.when.caller!.name : '(none)' + '\n' +
         'data on call: ' + String(err.when.data_on_call) + '\n' +
         'running stage: ' + err.when.stage + '\n' +
         typeof err.when.attr_index === 'undefined' ? '' :
         'attr index: ' + err.when.attr_index
      );
   }
};

let generateNodeTrace: (node: Node) => string = noop as any;
if (use_default_msg) {
   function obj2Str(o: any) {
      let result = '';
      for (const key of Object.keys(o)) {
         const val = o[key];
         if (typeof val === 'undefined') continue;
         result += `${key} = "${truncate(String(o[key]), 20)}", `;
      }
      return result;
   }
   generateNodeTrace = (node: Node) => {
      let result = '';
      let indent = '';
      do {
         result +=
            `${indent}-> node(${
            node.type ? node.type + ', ' : ''
            }uid = ${node.uid}): ${obj2Str(node.generateIdentity())}`;
         indent += '  ';
      } while (node = node.parent as any);

      return result;
   };
}
