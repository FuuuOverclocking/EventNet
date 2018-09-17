export const setProto: (d: any, b: any) => void =
  (Object as any).setPrototypeOf ||
  ({ __proto__: [] } instanceof Array && ((d: any, b: any) => { d.__proto__ = b; }));
