export function remove(arr: any[], item: any): any[] | void {
  if (arr.length) {
    const index = arr.indexOf(item);
    if (~index) {
      return arr.splice(index, 1);
    }
  }
}
