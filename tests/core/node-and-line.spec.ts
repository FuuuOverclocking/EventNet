import { nn, raw } from '../../lib';
import { Pipe, Twpipe } from '../../lib/core/line';
import { NodeRunningStage } from '../../lib/core/types';

test('NormalNode invalid args test', () => {
  expect(() => {
    const nd = nn({
      sync: '123',
    }, () => { });
  }).toThrow();

  const nd1 = nn({
    attrNotExist: null,
  }, () => { });

  expect(() => {
    const nd = nn({
      fold: 'should be number',
    }, () => { });
  }).toThrow();
});

test('NormalNode Basic Test', done => {
  const nd1 = nn({
    sync: true,
  }, dws => {
    dws.all(null);

    expect(dws.id('nonexistent')).toBeUndefined();
  });

  nd1.arrowNext();
  const nd2 = nn(dws => {
    dws[0]('test 1');
    dws[1]('test 2');
    dws.id('goodpipe')('test 3');
    dws.dispense(['test 1', 'test 2']);
    dws.dispense({
      goodarrow: null,
      badpipe: 'bad',
    });
    const $ = dws.ask(['hot'], 'heat');
    $[0]('heat');
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
    classes: 'hot',
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
}, 50);

test('NormalNode Error Test', done => {
  const nd1 = nn({
    sync: true,
  }, dws => {
    throw new Error('ouch :(');
  });

  const nd2 = nn({
    sync: false,
  }, (dws, ups) => {
    expect(ups.data.when).toBe(NodeRunningStage.code);
    expect(ups.data.what.message).toBe('ouch :(');
    throw new Error('OMG');
  });

  const nd3 = nn((dws, ups) => {
    expect(ups.data.when).toBe(NodeRunningStage.code);
    expect(ups.data.what.message).toBe('OMG');

    dws[0]();
  });
  const pipe1 = new Pipe(null, nd3);

  nd1.setErrorReceiver(null);
  nd1.setErrorReceiver(nd1);
  nd1.setErrorReceiver(nd2);
  nd2.setErrorReceiver(pipe1);

  nd3.arrowNext();
  const nd4 = nn((dws, ups) => {
    if (ups.data) {
      expect(ups.data).toBe('2');
      throw new Error('3');
    } else {
      throw new Error('1');
    }
  });

  const nd5 = nn((dws, ups) => {
    if (ups.data.what.message === '1') {
      dws[0]('2');
    } else if (ups.data.what.message === '3') {
      nd4.setErrorReceiver(null);
      done();
    }
  });
  const twpipe = new Twpipe(null, nd5);
  nd4.setErrorReceiver(twpipe);

  nd1.run();
});

test('NormalNode Watch Test', () => {
  const nd1 = nn({}, {
    HP: 100,
    MP: 99,
  }, (dws, ups, me) => {
    me.attrs();
    me.allAttrs();
    me.state.HP--;
    me.state.MP++;
  });

  const fn1 = jest.fn();
  const fn2 = jest.fn();
  const fn3 = jest.fn();
  const fn4 = jest.fn();

  nd1.watchMe('HP', (val, oldVal) => {
    expect(val).toBe(99);
    expect(oldVal).toBe(100);
    fn1();
  });

  nd1.watchMe('MP', val => {
    expect(val).toBe(100);
    fn2();
  }, { sync: true });

  nd1.watchMe(state => {
    return state.HP + state.MP;
  }, val => {
    expect(val).toBe(199);
    fn3();
  });

  nd1.watchMe(state => {
    return state.HP + state.MP;
  }, () => {
    fn4();
  }, { sync: true, immediate: true });


  setTimeout(() => {
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn3).toHaveBeenCalledTimes(0);
    expect(fn4).toHaveBeenCalledTimes(3);
  }, 20);

  nd1.run();
});

test('RawNode Basic Test', done => {
  const nd1 = raw(dws => {
    dws.all(null);

    expect(dws.id('nonexistent')).toBeUndefined();
  }, true);

  nd1.arrowNext();
  const nd2 = raw(dws => {
    dws[0]('test 1');
    dws[1]('test 2');
    dws.id('goodpipe')('test 3');
    dws.dispense(['test 1', 'test 2']);
    dws.dispense({
      goodarrow: null,
      badpipe: 'bad',
    });
    const $ = dws.ask(['hot'], 'heat');
    $[0]('heat');
    dws.id('next')();
  }, false);

  nd2.pipeNext();
  const nd3 = raw((dws, ups) => expect(ups.data).toBe('test 1'), false);

  const nd4 = raw((dws, ups) => expect(ups.data).toBe('test 2'), false);
  const nd5 = raw((dws, ups) => expect(ups.data).toBe('test 3'), false);
  nd2.alsoPipe(nd4).pipe(nd5, {
    id: 'goodpipe',
  });

  const fn1 = jest.fn();

  nd2.arrowNext({
    id: 'goodarrow',
  });
  const nd6 = raw((dws, ups) => fn1());

  nd2.pipeNext({
    id: 'badpipe',
  });
  const nd7 = raw((dws, ups) => expect(ups.data).toBe('bad'), false);

  nd2.pipeNext({
    classes: 'hot',
  });
  const nd8 = raw((dws, ups) => expect(ups.data).toBe('heat'), false);

  nd2.arrowNext({
    id: 'next',
  });
  const ndNext = raw((dws, ups) => {
    if (ups.caller.id === 'next') {
      dws[0]('Twpipe test 1');
    } else {
      expect(ups.data).toBe('Twpipe test 2');
      done();
    }
  }, false);

  ndNext.twpipeNext();
  const nd9 = raw((dws, ups) => {
    expect(ups.data).toBe('Twpipe test 1');
    dws[0]('Twpipe test 2');
  }, false);

  nd1.run();
}, 50);

test('RawNode Error Test', done => {
  const nd1 = raw(dws => {
    throw new Error('ouch :(');
  });

  const nd2 = raw((dws, ups) => {
    expect(ups.data.when).toBe(NodeRunningStage.code);
    expect(ups.data.what.message).toBe('ouch :(');
    throw new Error('OMG');
  }, false);

  const nd3 = raw((dws, ups) => {
    expect(ups.data.when).toBe(NodeRunningStage.code);
    expect(ups.data.what.message).toBe('OMG');

    dws[0]();
  }, false);
  const pipe1 = new Pipe(null, nd3);

  nd1.setErrorReceiver(null);
  nd1.setErrorReceiver(nd1);
  nd1.setErrorReceiver(nd2);
  nd2.setErrorReceiver(pipe1);

  nd3.arrowNext();
  const nd4 = raw((dws, ups) => {
    if (ups.data) {
      expect(ups.data).toBe('2');
      throw new Error('3');
    } else {
      throw new Error('1');
    }
  });

  const nd5 = raw((dws, ups) => {
    if (ups.data.what.message === '1') {
      dws[0]('2');
    } else if (ups.data.what.message === '3') {
      nd4.setErrorReceiver(null);
      done();
    }
  });
  const twpipe = new Twpipe(null, nd5);
  nd4.setErrorReceiver(twpipe);

  nd1.run();
});
