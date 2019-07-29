"use strict";
exports.__esModule = true;
var child_process_1 = require("child_process");
var fs = require("fs");
var WebSocket = require("ws");
var Client = /** @class */ (function () {
    function Client(filepath, _a) {
        var _b = _a.timeout, timeout = _b === void 0 ? 5 : _b, _c = _a.silent, silent = _c === void 0 ? false : _c, _d = _a.onConnected, onConnected = _d === void 0 ? void 0 : _d;
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
        this.startWebSocketListen(onConnected);
        this.startClient(filepath, silent);
        this.setTimeout('Failed to create client.');
    }
    Client.prototype.willReceive = function (msg) {
        var _this = this;
        this.assertion = msg;
        this.setTimeout('Message not received in time.');
        return new Promise(function (resolve, reject) {
            _this.assertionPromise = {
                resolve: resolve,
                reject: reject
            };
        });
    };
    Client.prototype.send = function (msg) {
        this.socket.send(msg);
    };
    Client.prototype.onReceive = function (arg1, arg2) {
        if (typeof arg2 === 'undefined') {
            this.handlers["default"] = arg1;
        }
        else {
            this.handlers[arg1] = arg2;
        }
    };
    Client.prototype.setTimeout = function (err) {
        this.timeoutId = setTimeout(function () {
            throw new Error(err);
        }, this.timeout);
    };
    Client.prototype.unsetTimeout = function () {
        clearTimeout(this.timeoutId);
    };
    Client.prototype.startWebSocketListen = function (onConnected) {
        var _this = this;
        var wss = this.wsServer = new WebSocket.Server({ port: 2357 });
        wss.on('connection', function (ws) {
            if (_this.connected) {
                throw new Error('Multiple clients connected to the server.');
            }
            _this.unsetTimeout();
            _this.connected = true;
            onConnected(_this);
            ws.on('message', function (msg) {
                _this.receive(msg);
            });
            _this.socket = ws;
        });
    };
    Client.prototype.receive = function (msg) {
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
    Client.prototype.startClient = function (filepath, silent) {
        var _this = this;
        var pr = this.process = child_process_1.spawn('node', [
            filepath,
        ]);
        if (!silent) {
            pr.stdout.pipe(process.stdout);
            pr.stderr.pipe(process.stdout);
        }
        pr.on('exit', function (code) {
            if (code !== 0) {
                throw new Error('Client exit with code ' + code);
            }
            else if (_this.assertion) {
                throw new Error('The client exits when there are still assertions');
            }
        });
    };
    return Client;
}());
function createClient(filepath, _a) {
    var _b = _a.timeout, timeout = _b === void 0 ? 5 : _b, _c = _a.silent, silent = _c === void 0 ? false : _c;
    return new Promise(function (resolve, reject) {
        var client = new Client(filepath, { timeout: timeout, silent: silent, onConnected: resolve });
        setTimeout(reject, timeout);
    });
}
exports.createClient = createClient;
