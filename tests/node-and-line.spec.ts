import { nn, raw } from '../lib';
import { NodeRunningStage } from '../lib/core/types';

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
  }, (ups, dws) => {
    dws.all(null);

    expect(dws.id('nonexistent')).toBeUndefined();
  });
  nd1.arrowNext();
  const nd2 = nn((ups, dws) => {
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
  const nd3 = nn(({data}) => expect(data).toBe('test 1'));

  const nd4 = nn(({data}) => expect(data).toBe('test 2'));
  const nd5 = nn(({data}) => expect(data).toBe('test 3'));
  nd2.alsoPipe(nd4).pipe(nd5, {
    id: 'goodpipe',
  });

  const fn1 = jest.fn();

  nd2.arrowNext({
    id: 'goodarrow',
  });
  const nd6 = nn(() => fn1());

  nd2.pipeNext({
    id: 'badpipe',
  });
  const nd7 = nn(({data}) => expect(data).toBe('bad'));

  nd2.pipeNext({
    classes: ['hot'],
  });
  const nd8 = nn(({data}) => expect(data).toBe('heat'));

  nd2.arrowNext({
    id: 'next',
  });
  const ndNext = nn(({data, caller}, dws) => {
    if (caller.id === 'next') {
      dws[0]('Twpipe test 1');
    } else {
      expect(data).toBe('Twpipe test 2');
      done();
    }
  });

  ndNext.twpipeNext();
  const nd9 = nn(({data}, dws) => {
    expect(data).toBe('Twpipe test 1');
    dws[0]('Twpipe test 2');
  });

  nd1.run();
}, 50);

test('NormalNode Error Test', done => {
  const nd1 = nn({
    sync: true,
  }, () => {
    throw new Error('ouch :(');
  });

  nd1.pipeNext({classes: ['error']});
  const nd2 = nn({
    sync: false,
  }, ({data}) => {
    expect(data.when).toBe(NodeRunningStage.code);
    expect(data.what.message).toBe('ouch :(');
    throw new Error('OMG');
  });

  nd2.pipeNext({classes: ['error']});
  const nd3 = nn(({data}, dws) => {
    expect(data.when).toBe(NodeRunningStage.code);
    expect(data.what.message).toBe('OMG');
    done();
  });

  nd1.run();
});

test('NormalNode Watch Test', () => {
  const nd1 = nn({}, {
    HP: 100,
    MP: 99,
  }, (ups, dws, me) => {
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
  const nd1 = raw((ups, dws) => {
    dws.all(null);

    expect(dws.id('nonexistent')).toBeUndefined();
  });

  nd1.arrowNext();
  const nd2 = raw(false, (ups, dws) => {
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
  const nd3 = raw(false, ({data}) => expect(data).toBe('test 1'));

  const nd4 = raw(false, ({data}) => expect(data).toBe('test 2'));
  const nd5 = raw(false, ({data}) => expect(data).toBe('test 3'));
  nd2.alsoPipe(nd4).pipe(nd5, {
    id: 'goodpipe',
  });

  const fn1 = jest.fn();

  nd2.arrowNext({
    id: 'goodarrow',
  });
  const nd6 = raw(() => fn1());

  nd2.pipeNext({
    id: 'badpipe',
  });
  const nd7 = raw(false, ({data}) => expect(data).toBe('bad'));

  nd2.pipeNext({
    classes: ['hot'],
  });
  const nd8 = raw(false, ({data}) => expect(data).toBe('heat'));

  nd2.arrowNext({
    id: 'next',
  });
  const ndNext = raw(false, ({data, caller}, dws) => {
    if (caller.id === 'next') {
      dws[0]('Twpipe test 1');
    } else {
      expect(data).toBe('Twpipe test 2');
      done();
    }
  });

  ndNext.twpipeNext();
  const nd9 = raw(false, ({data}, dws) => {
    expect(data).toBe('Twpipe test 1');
    dws[0]('Twpipe test 2');
  });

  nd1.run();
}, 50);

test('RawNode Error Test', done => {
  const nd1 = raw(dws => {
    throw new Error('ouch :(');
  });

  nd1.pipeNext({classes: ['error']});
  const nd2 = raw(false, ({data}) => {
    expect(data.when).toBe(NodeRunningStage.code);
    expect(data.what.message).toBe('ouch :(');
    throw new Error('OMG');
  });

  nd2.pipeNext({classes: ['error']});
  const nd3 = raw(false, ({data}, dws) => {
    expect(data.when).toBe(NodeRunningStage.code);
    expect(data.what.message).toBe('OMG');

    done();
  });

  nd1.run();
});
