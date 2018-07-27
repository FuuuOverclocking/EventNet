const en = require("../lib/core/index").en;
const nd1 = en((dws) => {
    const $0 = dws[0];
    $0(111);
    dws.ask("good-pipe", 235);
    console.log("12345")
});

nd1.pipeNext();
const nd2 = en(
    { name: "goodnode" },
    (dws, ups, thisExec) => {
        console.log(ups.data === 111);
        dws.all(thisExec.origin.name);
    });

nd1.pipeNext({
    id: "good-pipe",
});
const nd3 = en(
    (dws, ups, thisExec) => {
        console.log(ups.data === 235);
    });

nd2.pipeNext();
const nd4 = en(
    (dws, ups) => {
        console.log(ups.data === "goodnode");
    });
nd1.run();