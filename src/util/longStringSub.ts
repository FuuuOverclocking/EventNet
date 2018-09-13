export function longStringSub(str: string, maxLength: number = 40, replaceWith = '...') {
  return str.length > maxLength ? str.substr(0, maxLength) + replaceWith : str;
}
