const { nn } = require('../lib');
const nd1 = nn({
  sync: true,
}, (ups, dws) => {
  for(const i in dws) {
    console.log(i);
  }
});
nd1.run();
