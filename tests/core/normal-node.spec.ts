import { nn } from '../../lib';

test('NormalNode Basic Test', done => {
  const nd1 = nn(dws => {
    dws.all(null);
  });

  nd1.arrowNext();
  const nd2 = nn(dws => {
    dws[0]('test 1');
    dws[1]('test 2');
    dws.id('goodpipe')('test 3');
    dws.dispense({
      goodarrow: null,
      badpipe: 'bad',
    });
    dws.ask(['hot'], 'heat');
    dws.id('next')();
  });

  nd2.pipeNext();
  const nd3 = nn((dws, ups) => expect(ups.data).toBe('test 1'));

  const nd4 = nn((dws, ups) => expect(ups.data).toBe('test 2'));
  const nd5 = nn((dws, ups) => expect(ups.data).toBe('test 3'));
  nd2.alsoPipe(nd4).pipe(nd5, {
    id: 'goodpipe',
  });

  const fn1 = jest.fn();

  nd2.arrowNext({
    id: 'goodarrow',
  });
  const nd6 = nn((dws, ups) => fn1());

  nd2.pipeNext({
    id: 'badpipe',
  });
  const nd7 = nn((dws, ups) => expect(ups.data).toBe('bad'));

  nd2.pipeNext({
    classes: 'heat',
  });
  const nd8 = nn((dws, ups) => expect(ups.data).toBe('heat'));

  nd2.arrowNext({
    id: 'next',
  });
  const ndNext = nn((dws, ups) => {
    if (ups.caller.id === 'next') {
      dws[0]('Twpipe test 1');
    } else {
      expect(ups.data).toBe('Twpipe test 2');
      done();
    }
  });

  ndNext.twpipeNext();
  const nd9 = nn((dws, ups) => {
    expect(ups.data).toBe('Twpipe test 1');
    dws[0]('Twpipe test 2');
  });

  nd1.run();
}, 1000);
