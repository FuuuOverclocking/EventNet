// tslint:disable-next-line:variable-name
let CompatWeakSet: any;
(() => {
    if (typeof WeakSet !== "undefined") { CompatWeakSet = WeakMap; return; }

    // tslint:disable-next-line:only-arrow-functions
    CompatWeakSet = function(this: { set: any[] }) {
        this.set = [];
    } as any;
    CompatWeakSet.prototype.add = function(this: { set: any[] }, item: any) {
        this.set.push(item);
        return this;
    };
    CompatWeakSet.prototype.delete = function(this: { set: any[] }, item: any) {
        for (const i in this.set) {
            if (this.set[i] === item) {
                this.set.splice(Number(i), 1);
                return true;
            }
        }
        return false;
    };
    CompatWeakSet.prototype.has = function(this: { set: any[] }, item: any) {
        for (const i in this.set) {
            if (this.set[i] === item) {
                return true;
            }
        }
        return false;
    };
})();

export { CompatWeakSet };
