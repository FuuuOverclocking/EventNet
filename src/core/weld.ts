import { IElementStream } from './types';

export function weld(stream1: IElementStream, stream2: IElementStream) {
  stream1.add(stream2.owner);
  stream2.add(stream1.owner);
}

export function deweld(stream1: IElementStream, stream2: IElementStream) {
  stream1.del(stream2.owner);
  stream2.del(stream1.owner);
}
