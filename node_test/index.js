const nn = require("../lib").nn;
const nd1 = nn({}, {
  HP: 100,
  MP: 99,
}, (dws, ups, thisExec) => {
  thisExec.attrs();
  thisExec.allAttrs();
  thisExec.state.HP--;
  thisExec.state.MP++;
});

function fn(n) {console.log(n)}

const fn1 = fn.bind(null, 1);
const fn2 = fn.bind(null, 2);
const fn3 = fn.bind(null, 3);
const fn4 = fn.bind(null, 4);

nd1.watchMe('HP', (val, oldVal) => {
  console.log('hp')
  console.log(val, oldVal);
  fn1();
});

nd1.watchMe('MP', val => {
  console.log('mp')
  console.log(val)
  fn2();
}, { sync: true });

nd1.watchMe(state => {
  return state.HP + state.MP;
}, val => {
  console.log('hy')
  console.log(val);
  fn3();
});

nd1.watchMe(state => {
  return state.HP + state.MP;
}, () => {
  fn4();
}, { sync: true, immediate: true });

nd1.run();
