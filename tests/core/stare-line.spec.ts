import { nn, raw } from '../../lib';

test('StareLine Test', done => {
  const nd1 = nn({}, {
    HP: 100,
    MP: 100,
  }, (dws, ups, me) => {
    me.state.HP -= 50;
    me.state.MP--;
  });

  const fn = jest.fn();
  const nd2 = raw((dws, ups) => {
    fn();
    expect(ups.data).toBe(50);
  });
  nd1.starePipe(nd2, 'HP', (val, dws) => {
    dws(val);
    return val;
  }, { sync: true });

  nd1.run();

  setTimeout(() => {
    expect(fn).toHaveBeenCalledTimes(2);
    done();
  }, 10);
});
