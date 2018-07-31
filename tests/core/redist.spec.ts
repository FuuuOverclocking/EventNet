import { raw } from '../../lib/';
import { RedistNode } from '../../lib/nodes';

test('RedistNode Test', () => {
  const nd1 = raw((dws, ups) => {
    dws[0](ups.data);
  });

  const rdn = nd1
    .pipe(new RedistNode())
    .alsoPipe(
      raw((dws, ups) => expect(ups.data).toBe(uid)),
    );

  let uid = 0;
  function f() {
    nd1.run(++uid);
  }
  f(); f();

  let uuid = 0;
  rdn.alsoPipe(
    raw((dws, ups) => {
      expect(ups.data).toBe(++uuid);
    }),
  );
  expect(() => rdn.pipeNext()).toThrow();
});
