import { config } from '../index';
import { NodeRunPhase } from '../types';
import { Element } from './element';
import { Node } from './node';
import { hasConsole, noop, truncate } from './util/index';

export let tip: (msg: string, relatedElement?: Element) => void = noop;
export let warn: (msg: string, relatedElement?: Element) => void = noop;

if (!config.silent && hasConsole) {
  tip = (msg: string, el?: Element) =>
    console.warn(msg + '\n' + (el ? generateElemTrace(el) : ''));
  warn = (msg: string, el?: Element) =>
    console.error(msg + '\n' + (el ? generateElemTrace(el) : ''));
}

function generateKeyValue(o: any) {
  let result = '';
  for (const key of Object.keys(o)) {
    result += key + ' = "' + truncate(o[key], 20) + '", ';
  }
  return result;
}

export function generateElemTrace(elem: Element) {
  let result = '';
  let indent = '  ';
  if (elem.isLine &&
    (elem.ups.get() || elem.dws.get())) {
    elem = (elem.ups.get() || elem.dws.get()) as Node;
  }

  do {
    result += indent + '-> ' + (elem.isLine ? 'Line' : 'Node') + ' ' +
      generateKeyValue(elem.generateIdentity()) + '\n';
    indent += '  ';
  }
  while (elem = (elem as any).parent);
  return result;
}

export function handleError(
  err: any,
  location?: string,
  relatedElement?: Element
) {
  if (!config.silent && hasConsole) {
    warn(`EventNet Error [${location}]: ${
      err.message || err
      }`, relatedElement);
  } else {
    throw err;
  }
}

export function handleNodeError(when: NodeRunPhase, what: any, where: Element[]) {
  if (!config.silent && hasConsole) {
    const which = where[0];
    const errMsg = 'Unhandled Node error:' + '\n' +
      truncate(String(what), 100) + '\n' +
      '\t' + `in the run phase of '${NodeRunPhase[when]}' with characteristics:` + '\n' +
      '\t\t' + generateKeyValue(which.generateIdentity());

    warn(errMsg, which);
  }
  throw what;
}
