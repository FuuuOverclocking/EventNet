import { node, Node } from 'eventnet';
import { type } from '../../helpers/util';

describe('LocalNode', () => {
   it('should run when calling input', () => {
      const fn = jest.fn();
      const nd = node(fn);
      nd.input('test');
      expect(fn.mock.calls.length).toBe(1);
      expect(type(fn.mock.calls[0][0])).toBe('object');
      expect(fn.mock.calls[0][0].data).toBe('test');
      expect(fn.mock.calls[0][0].entry.$I).toBe(true);
   });

   it('should be able to receive and send data', () => {
      const nd0 = node<void, string>(({ $$ }) => {
         $$('test');
      });

      nd0.pipe(
         node<string, string>(({ $$, data }) => {
            expect(data).toBe('test');
            $$(data + data);
         })
      ).pipe('$oneInputPort',
         node<{
            $oneInputPort: string;
            $oneOutputPort: number;
         }>(({ $$, data, entry }) => {
            expect(entry.$oneInputPort).toBe(true);
            expect(data).toBe('testtest');
            $$.$oneOutputPort(12345);
         })
      ).$oneOutputPort.pipe(
         node<number, void>(({ data }) => {
            expect(data).toBe(12345);
         })
      );

      nd0.input();

   });
});
