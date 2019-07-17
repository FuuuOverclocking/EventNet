import { domain, node } from 'eventnet';
import { type } from '../../helpers/util';

describe('EventNet core functions', () => {
   it('LocalNode constant attributes', async () => {
      const nd0 = node(({ $$ }) => {
         $$('Hello World~');
      });
      expect(nd0.uid).toBe(domain.LocalDomain.uidCounter - 1);
      expect(nd0.type).toBe('Node');
      expect(nd0.parent).toBe(undefined);
      expect(nd0.isSubnet).toBe(false);
      expect(nd0.domain).toBe(domain.LocalDomain);
      expect(nd0.toString()).toBe(`Node(local/${nd0.uid})`);
      const nd0Identity = nd0.getIdentity();
      for (const field of Object.keys(nd0Identity)) {
         const value = nd0Identity[field];
         expect(type(value)).toBe('string');
      }
      expect(type(nd0.originalNode)).toBe('object');
   });

   it('LocalNode state', () => {
      const nd1 = node({ foo: 0 },
         ({ state }) => {
            state.foo++;
         });
      expect(type(nd1.state)).toBe('object');
      expect(nd1.state.foo).toBe(0);
      expect(nd1.readState('.foo')).toBe(0);
      nd1.input();
      expect(nd1.state.foo).toBe(1);
      expect(nd1.readState('.foo')).toBe(1);
      nd1.input();
      expect(nd1.state.foo).toBe(2);
      expect(nd1.readState('.foo')).toBe(2);
   });
});
