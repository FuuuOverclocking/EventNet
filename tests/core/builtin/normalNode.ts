import { NormalNode } from '../../../dist/node_dev_test';

function time() {
  const diff = process.hrtime();
  return (diff[0] * 1e9 + diff[1]) / 1e6;
}
// Run many times to ensure that V8 optimizes it
for (let i = 0; i < 100; ++i) {
  time();
}

test('perf', () => {
  const start = time();
  let nd;
  // 12073.962551 ms on Intel i7 7700HQ
  for (let i = 0; i < 1000000; ++i) {
    nd = new NormalNode({
      $mode: 3,
      $attrs: {
        once: true,
      },
      [Math.random()]: 123,
    }, ({
      dws,
    }) => {
      dws.all(123);
    });
  }
  const end = time();
  console.log(end - start);


  const nd2 = new NormalNode({
    $mode: 1,
    $attrs: {
      once: true,
    },
    hahaha: 123,
  }, ({
    dws,
  }) => {
    dws.all(123);
  });
  const start2 = time();
  // 546.473341 ms on Intel i7 7700HQ
  for (let i = 0; i < 1000000; ++i) {
    nd2.run();
  }
  const end2 = time();
  console.log(end2 - start2);

});
