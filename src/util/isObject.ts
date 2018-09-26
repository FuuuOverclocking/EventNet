export function isObject(obj: any): obj is { [i: string]: any } {
  return obj !== null && typeof obj === 'object';
}
