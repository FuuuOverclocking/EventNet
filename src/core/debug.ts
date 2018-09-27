import { config } from '../index';
import { NodeRunPhase } from '../types';
import { longStringSub } from '../util/longStringSub';
import { noop } from '../util/noop';
import { Element } from './element';
import { Node } from './node';

export const hasProto = { __proto__: [] } instanceof Array;
export const hasPromise =
  typeof Promise === 'function' &&
  typeof Promise.resolve === 'function' &&
  typeof Promise.prototype.then === 'function' &&
  typeof Promise.prototype.catch === 'function';
export const fulfilledPromise = hasPromise ? Promise.resolve() : null;

export let debug: (issueId: string, ...data: any[]) => void = noop;
export let tip: (msg: string, relatedElement?: Element) => void = noop;
export let warn: (msg: string, relatedElement?: Element) => void = noop;
export let generateElemTrace: (elem: Element) => string | void = noop;

let generateKeyValue: (o: any) => any = noop;

if (process.env.NODE_ENV !== 'production') {

  const issues = {
    ArrowPassData:      ['tip', (data: any) =>
      `data '${longStringSub(String(data))}' can not pass through an Arrow, replace with a Pipe`],
    LineEmptyDws:       ['tip', 'the downstream of the line is empty'],
    LineImproperCall:   ['tip', 'the arrow is activited but not called by its upstream'],
    ElementifyParam:    ['err', 'an Element-like object is expected', 'elementify'],
    ToMakerClone:       ['err', 'an Element with clone method is expected', 'Element.toMaker'],
    StreamSameEl:       ['err', 'the stream of the same id already exists', 'Stream.add'],
    NodeStreamAskQs:    ['err', 'invaild querystring', 'NodeStream.ask'],
    NodeStreamAskParam: ['err', 'the type of param is wrong', 'NodeStream.ask'],
    BN_NonexistDws:     ['err',
      'The elements meeting the condition(s) in the downstream do not exist.', 'BasicNodeDws'],
    BN_NonexistDwsWarn: ['warn',
    'The elements meeting the condition(s) in the downstream do not exist.', 'BasicNodeDws'],
    AttrDuplicate:      ['tip', 'duplicate attrs already exist'],
    SetDelReactiveOn:   ['err', (target: any) =>
      `Cannot set/delete reactive property on undefined, null, or primitive value: ${target}`,
      'Observer/set or Observer/del'],
    InvaildWatchingPath: ['err', (path: string) => `Failed watching path: "${path}" ` +
                        'Watcher only accepts simple dot-delimited paths. ' +
                        'For full control, use a function instead.', 'WatcherConstructor'],
  } as any;

  if (!config.silent && typeof console !== 'undefined') {
    tip = (msg: string, el?: Element) =>
      console.warn(msg + '\n' + (el ? generateElemTrace(el) : ''));
    warn = (msg: string, el?: Element) =>
      console.error(msg + '\n' + (el ? generateElemTrace(el) : ''));
  }

  /**
   * @example
   * debug('LineEmptyDws', related element)
   * debug('ArrowPassData', related element, arg_1, arg_2, ...)
   * debug('BN_NonexistDwsWarn', related element)
   * debug('ElementifyParam', void 0, new Error());
   * debug('SetDelReactiveOn', void 0, new Error(), arg_1, arg_2, ...)
   */
  debug = (issueId: string, ...data: any[]) => {
    const op = issues[issueId];
    if (!op) {
      throw new Error('invalid debug call');
    }

    let msg: string;
    if (op[0] === 'tip') {
      msg = typeof op[1] === 'function' ? op[1](...data.slice(1)) : op[1];
      tip(msg, data[0]);
    } else if (op[0] === 'warn') {
      msg = typeof op[1] === 'function' ? op[1](...data.slice(1)) : op[1];
      warn(msg, data[0]);
    } else if (op[0] === 'err') {
      msg = typeof op[1] === 'function' ? op[1](...data.slice(2)) : op[1];
      data[1].message = msg;
      handleError(data[1], op[2] || '', data[0]);
    }
  };

  generateKeyValue = (o: any) => {
    let result = '';
    for (const key of Object.keys(o)) {
      result += key + ' = "' + longStringSub(o[key], 20) + '", ';
    }
    return result;
  };

  generateElemTrace = (elem: Element) => {
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
  };

}

export function handleError(
  err: any,
  location?: string,
  relatedElement?: Element,
) {
  if (process.env.NODE_ENV !== 'production') {
    warn(`Error [${location}]: ${
      err.message || String(err)
      }`, relatedElement);
  }
  throw err;
}

export function handleNodeError(when: NodeRunPhase, what: any, where: Element[]) {
  if (process.env.NODE_ENV !== 'production') {
    const which = where[0];
    const errMsg = 'Unhandled Node error:' + '\n' +
      longStringSub(String(what), 100) + '\n' +
      '\t' + `in the run phase of '${NodeRunPhase[when]}' with characteristics:` + '\n' +
      '\t\t' + generateKeyValue(which.generateIdentity());

    warn(errMsg, which);
  }
  throw what;
}
