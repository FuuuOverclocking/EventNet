import {raw} from '../../lib';
import { fromPromise } from '../../lib/nodes';

test('fromPromise Test', done => {
  const p1 = Promise.resolve('OK');
  const p2 = Promise.reject('ouch');

  const fp1 = fromPromise(() => p1);
  const fp2 = fromPromise(p2);

  fp1
    .alsoPipe(
      raw((dws, ups) => expect(ups.data).toBe('OK')),
    );
  fp2.setErrorReceiver(
    raw((dws, ups) => expect(ups.data.what).toBe('ouch')),
  );

  setTimeout(() => {
    fp1.alsoPipe(
      raw((dws, ups) => {
        expect(ups.data).toBe('OK');
        done();
      }),
    );
  }, 10);
});
