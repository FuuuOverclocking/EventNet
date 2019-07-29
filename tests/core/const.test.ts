import { domain, node, Node } from 'eventnet';
import { type } from 'helpers/util';

describe('constant of Node', () => {
   test('Node in LoaclDomain', () => {
      const nd = node();
      expect(nd.uid).toBe(domain.LoaclDomain.uidCounter - 1);
      expect(nd.type).toBe('Node');
      expect(nd.isSubnet).toBe(false);
      expect(nd.parent).toBe(undefined);
      expect(nd.domain).toBe(domain.LoaclDomain);
      expect(nd.toString()).toBe(`Node(LocalDomain/${nd.uid})`);

      const ndIdentity = nd.getIdentity();
      expect(ndIdentity.domain).toBe('LocalDomain');
      expect(ndIdentity.uid).toBe(String(nd.uid));
      expect(ndIdentity.type).toBe('Node');

      Object.keys(nd.originNode).forEach(prop => {
         expect(nd.originNode[prop]).toBe(nd[prop]);
      });
   });
   test('Subnet in LocalDomain', () => {
      const sn = node.subnet();
      expect(sn.uid).toBe(domain.LoaclDomain.uidCounter - 1);
      expect(sn.type).toBe('Subnet');
      expect(sn.isSubnet).toBe(true);
      expect(sn.parent).toBe(undefined);
      expect(type(sn.children)).toBe('array');
      expect(sn.domain).toBe(domain.LoaclDomain);
      expect(sn.toString()).toBe(`Subnet(LocalDomain/${sn.uid})`);

      const snIdentity = sn.getIdentity();
      expect(snIdentity.domain).toBe('LocalDomain');
      expect(snIdentity.uid).toBe(String(sn.uid));
      expect(snIdentity.type).toBe('Subnet');

      Object.keys(sn.originNode).forEach(prop => {
         expect(sn.originNode[prop]).toBe(sn[prop]);
      });
   });
   test('Node of a subnet in LocalDomain', () => {
      let nd: Node = undefined as any;
      const sn = node.subnet(({ $$inner }) => {
         nd = node();
         $$inner.pipe(nd).pipe($$inner);
      });
      expect(nd.uid).toBe(domain.LoaclDomain.uidCounter - 1);
      expect(nd.type).toBe('Node');
      expect(nd.isSubnet).toBe(false);
      expect(nd.parent).toBe(sn);
      expect(nd.domain).toBe(domain.LoaclDomain);
      expect(nd.toString()).toBe(`Node(LocalDomain/${nd.uid})`);

      const ndIdentity = nd.getIdentity();
      expect(ndIdentity.domain).toBe('LocalDomain');
      expect(ndIdentity.uid).toBe(String(nd.uid));
      expect(ndIdentity.type).toBe('Node');

      Object.keys(nd.originNode).forEach(prop => {
         expect(nd.originNode[prop]).toBe(nd[prop]);
      });
   });
   test('Subnet of a subnet in LocalDomain', () => {
      let snInner: Subnet = undefined as any;
      const snOuter = node.subnet(({ $$inner }) => {
         snInner = node.subnet();
         $$inner.pipe(snInner).pipe($$inner);
      });
      expect(snInner.uid).toBe(domain.LoaclDomain.uidCounter - 1);
      expect(snInner.type).toBe('Subnet');
      expect(snInner.isSubnet).toBe(true);
      expect(snInner.parent).toBe(snOuter);
      expect(type(snInner.children)).toBe('array');
      expect(snInner.domain).toBe(domain.LoaclDomain);
      expect(snInner.toString()).toBe(`Subnet(LocalDomain/${snInner.uid})`);

      const snInnerIdentity = snInner.getIdentity();
      expect(snInnerIdentity.domain).toBe('LocalDomain');
      expect(snInnerIdentity.uid).toBe(String(snInner.uid));
      expect(snInnerIdentity.type).toBe('Subnet');

      Object.keys(snInner.originNode).forEach(prop => {
         expect(snInner.originNode[prop]).toBe(snInner[prop]);
      });
   });

   test('Node ');
});
