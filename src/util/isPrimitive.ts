/**
 * Check if value is primitive
 */
export function isPrimitive(value: any): boolean {
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'symbol' ||
    typeof value === 'boolean';
}
