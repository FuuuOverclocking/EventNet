import { IElementStream, IStreamOfLine, IStreamOfNode } from './types';

export function weld(stream1: IStreamOfNode, stream2: IStreamOfLine): void;
export function weld(stream1: IStreamOfLine, stream2: IStreamOfNode): void;
export function weld(stream1: any, stream2: any) {
  stream1.add(stream2.owner);
  stream2.add(stream1.owner);
}

export function deweld(stream1: IStreamOfNode, stream2: IStreamOfLine): void;
export function deweld(stream1: IStreamOfLine, stream2: IStreamOfNode): void;
export function deweld(stream1: any, stream2: any) {
  stream1.del(stream2.owner);
  stream2.del(stream1.owner);
}
