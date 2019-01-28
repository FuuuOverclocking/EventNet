///////////////// short tool functions ///////////////////

export function noop() { }

export function def(obj: any, prop: string, value: any, enumerable = false) {
   Object.defineProperty(obj, prop, {
      value,
      enumerable,
   });
}

/**
 * Truncate a string that is too long
 */
export function truncate(str: string, maxLength: number = 40, replaceWith = '...') {
   return str.length > maxLength ? str.substr(0, maxLength) + replaceWith : str;
}

//////////////////////// env /////////////////////////////
export const canUseProxy = typeof Proxy !== 'undefined';
export const hasConsole = typeof console !== 'undefined';
