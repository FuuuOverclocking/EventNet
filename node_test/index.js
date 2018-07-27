const en = require("../lib/core/index").en;
const debug = (s) => {
    console.log(s?s+Date.now():Date.now())
}
const nd1 = en((dws) => {
    const $0 = dws[0];
    $0(111);
    dws.ask("good-pipe", 235);
});

nd1.pipeNext();
const nd2 = en(
    { name: "goodnode" },
    (dws, ups, thisExec) => {
        dws.all(thisExec.origin.name);
    });

nd1.pipeNext({
    id: "good-pipe",
});
const nd3 = en(
    (dws, ups, thisExec) => {
        debug("end");
    });

nd2.pipeNext();
const nd4 = en(
    (dws, ups) => {
        console.log(ups.data);
        debug("end");
    });
debug();
debug();


debug();
debug();

debug();
debug();
debug();
debug("start");

debug("start");
debug("start");
debug("start");
debug("start");
nd1.run();