"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var child_process_1 = require("child_process");
var fs = require("fs");
var WebSocket = require("ws");
var wsServerPort = 2357;
/**
 * Note: the unit of `timeout` is second.
 */
function createEndA(filepath, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.timeout, timeout = _c === void 0 ? 10 : _c, _d = _b.silent, silent = _d === void 0 ? false : _d;
    return __awaiter(this, void 0, void 0, function () {
        var endA;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    endA = new EndA(filepath, { timeout: timeout, silent: silent });
                    return [4 /*yield*/, endA.readyPromise];
                case 1:
                    _e.sent();
                    return [2 /*return*/, endA];
            }
        });
    });
}
exports.createEndA = createEndA;
var EndA = /** @class */ (function () {
    function EndA(filepath, _a) {
        var _this = this;
        var timeout = _a.timeout, silent = _a.silent;
        this.filepath = filepath;
        this.connected = false;
        this.assertion = false;
        this.assertionPromise = {
            resolve: function () { },
            reject: function (r) { }
        };
        this.handlers = {};
        this.timeout = timeout;
        if (!fs.existsSync(filepath)) {
            throw new Error('JS file not exists.');
        }
        this.startWSServer();
        this.startClient(filepath, silent);
        this.setTimeout(function () {
            _this.readyPromiseReject();
            throw new Error('Failed to create client.');
        });
        this.readyPromise = new Promise(function (res, rej) {
            _this.readyPromiseResolve = res;
            _this.readyPromiseReject = rej;
        });
    }
    EndA.prototype.willReceive = function (msg) {
        var _this = this;
        if (this.assertion) {
            throw new Error('Reset assertion before last one was resolved.');
        }
        this.assertion = msg;
        this.setTimeout('Message not received in time.');
        return new Promise(function (resolve, reject) {
            _this.assertionPromise = {
                resolve: resolve,
                reject: reject
            };
        });
    };
    EndA.prototype.send = function (msg) {
        this.socket.send(msg);
    };
    EndA.prototype.onMessage = function (arg1, arg2) {
        if (typeof arg2 === 'undefined') {
            this.handlers["default"] = arg1;
        }
        else {
            this.handlers[arg1] = arg2;
        }
    };
    EndA.prototype.setTimeout = function (err) {
        this.timeoutId = setTimeout(function () {
            if (typeof err === 'function') {
                err();
            }
            else {
                throw new Error(err);
            }
        }, this.timeout);
    };
    EndA.prototype.unsetTimeout = function () {
        clearTimeout(this.timeoutId);
    };
    EndA.prototype.startWSServer = function () {
        var _this = this;
        var wss = this.wsServer = new WebSocket.Server({ port: wsServerPort });
        wss.on('connection', function (ws) {
            if (_this.connected) {
                throw new Error('Multiple clients connected to the server.');
            }
            _this.connected = true;
            _this.socket = ws;
            _this.unsetTimeout();
            ws.on('message', function (msg) {
                _this.receive(msg);
            });
            _this.readyPromiseResolve();
        });
    };
    EndA.prototype.receive = function (msg) {
        if (this.assertion) {
            this.unsetTimeout();
            if (msg === this.assertion) {
                this.assertionPromise.resolve();
            }
            else {
                this.assertionPromise.reject('expect "' + this.assertion + '", receive "' + msg + '"');
            }
            this.assertion = false;
        }
        if (this.handlers[msg]) {
            this.handlers[msg](msg);
        }
        else if (this.handlers["default"]) {
            this.handlers["default"](msg);
        }
    };
    EndA.prototype.startClient = function (filepath, silent) {
        var _this = this;
        var proc = this.process = child_process_1.spawn('node', [
            filepath,
        ]);
        if (!silent) {
            proc.stdout.pipe(process.stdout);
            proc.stderr.pipe(process.stdout);
        }
        proc.on('exit', function (code) {
            if (code !== 0) {
                throw new Error('Client exit with code ' + code);
            }
            else if (_this.assertion) {
                throw new Error('The client exits when there are still assertions');
            }
        });
    };
    return EndA;
}());
function createEndB() {
    return __awaiter(this, void 0, void 0, function () {
        var endB;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    endB = new EndB();
                    return [4 /*yield*/, endB.readyPromise];
                case 1:
                    _a.sent();
                    return [2 /*return*/, endB];
            }
        });
    });
}
exports.createEndB = createEndB;
var EndB = /** @class */ (function () {
    function EndB() {
        var _this = this;
        this.socket = new WebSocket('ws://127.0.0.1:' + wsServerPort);
        this.socket.on('open', function () {
            _this.readyPromiseResolve();
        });
        this.socket.on('error', function () {
            _this.readyPromiseReject();
            throw new Error('Fail to connect to server.');
        });
        this.socket.on('message', function (data) {
            if (_this.handlers[data]) {
                _this.handlers[data](data);
            }
            else {
                _this.handlers["default"](data);
            }
        });
        this.readyPromise = new Promise(function (res, rej) {
            _this.readyPromiseResolve = res;
            _this.readyPromiseReject = rej;
        });
    }
    EndB.prototype.send = function (msg) {
        this.socket.send(msg);
    };
    EndB.prototype.onMessage = function (arg1, arg2) {
        if (typeof arg2 === 'undefined') {
            this.handlers["default"] = arg1;
        }
        else {
            this.handlers[arg1] = arg2;
        }
    };
    return EndB;
}());
