import { Events, node } from 'eventnet';
import { connectAndArgsTest } from './helpers/connect-and-args-test';
import { runTest } from './helpers/run-test';

describe('nodes of LocalDomain', () => {
   it('should run when calling input', () => {
      let str = '';
      const getter = () => node<string, void>(
         ({ data }) => {
            str = data;
         }
      );
      const checker = () => {
         expect(str).toBe('test');
         return Promise.resolve();
      };
      return runTest({ getter, checker, input: 'test' });
   });

   it('can connect to any Node and get correct args when run', () =>
      connectAndArgsTest((onRun: Events.OnRun) => {
         const getter = () => node(onRun);
         return { getter };
      })
   );
});
