import { en } from "../lib/index";

test("basic test", (done) => {
    const nd1 = en((dws) => {
        const $0 = dws[0];
        $0(111);
        dws.ask("good-pipe", 235);
    });

    nd1.pipeNext();
    const nd2 = en(
        { name: "goodnode" },
        (dws, ups, thisExec) => {
            expect(ups.data).toBe(111);
            dws.all(thisExec.origin.name);
        });

    nd1.pipeNext({
        id: "good-pipe",
    });
    const nd3 = en(
        (dws, ups, thisExec) => {
            expect(ups.data).toBe(235);
            done();
        });

    nd2.pipeNext();
    const nd4 = en(
        (dws, ups) => {
            expect(ups.data).toBe("goodnode");
        });
}, 100);
