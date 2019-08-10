import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as WebSocket from 'ws';

const wsServerPort = 2357;

/**
 * Note: the unit of `timeout` is second.
 */
export async function createEndA(
   filepath: string,
   {
      timeout = 10,
      silent = false,
   } = {}
) {
   const endA = new EndA(filepath, { timeout, silent });
   await endA.readyPromise;
   return endA;
}

class EndA {
   public process: ChildProcess;
   public wsServer: WebSocket.Server;
   public socket: WebSocket;
   public readyPromise: Promise<void>;
   private readyPromiseResolve: () => void;
   private readyPromiseReject: () => void;
   private timeout: number;
   private timeoutId: NodeJS.Timeout;
   private connected = false;
   private assertion: string | false = false;
   private assertionPromise = {
      resolve: () => { },
      reject: (r: string) => { },
   };
   private handlers: {
      default?: (msg: string) => void;
      [k: string]: undefined | ((msg: string) => void);
   } = {};

   constructor(
      public filepath: string,
      {
         timeout,
         silent,
      }: {
         timeout: number;
         silent: boolean;
      }
   ) {
      this.timeout = timeout;
      if (!fs.existsSync(filepath)) {
         throw new Error('JS file not exists.');
      }

      this.startWSServer();
      this.startClient(filepath, silent);
      this.setTimeout(() => {
         this.readyPromiseReject();
         throw new Error('Failed to create client.');
      });
      this.readyPromise = new Promise((res, rej) => {
         this.readyPromiseResolve = res;
         this.readyPromiseReject = rej;
      });
   }

   public willReceive(msg: string) {
      if (this.assertion) {
         throw new Error('Reset assertion before last one was resolved.');
      }
      this.assertion = msg;
      this.setTimeout('Message not received in time.');
      return new Promise((resolve, reject) => {
         this.assertionPromise = {
            resolve,
            reject,
         };
      });
   }
   public send(msg: string) {
      this.socket.send(msg);
   }
   public onMessage(msg: string, handler: (msg: string) => {}): void;
   public onMessage(handler: (msg: string) => {}): void;
   public onMessage(arg1: any, arg2?: any) {
      if (typeof arg2 === 'undefined') {
         this.handlers.default = arg1;
      } else {
         this.handlers[arg1] = arg2;
      }
   }

   private setTimeout(err: string | (() => any)) {
      this.timeoutId = setTimeout(() => {
         if (typeof err === 'function') {
            err();
         } else {
            throw new Error(err);
         }
      }, this.timeout);
   }
   private unsetTimeout() {
      clearTimeout(this.timeoutId);
   }

   private startWSServer() {
      const wss = this.wsServer = new WebSocket.Server({ port: wsServerPort });

      wss.on('connection', ws => {
         if (this.connected) {
            throw new Error('Multiple clients connected to the server.');
         }
         this.connected = true;

         this.socket = ws;
         this.unsetTimeout();
         ws.on('message', (msg: string) => {
            this.receive(msg);
         });

         this.readyPromiseResolve();
      });
   }

   private receive(msg: string) {
      if (this.assertion) {
         this.unsetTimeout();
         if (msg === this.assertion) {
            this.assertionPromise.resolve();
         } else {
            this.assertionPromise.reject(
               'expect "' + this.assertion + '", receive "' + msg + '"');
         }
         this.assertion = false;
      }
      if (this.handlers[msg]) {
         this.handlers[msg]!(msg);
      } else if (this.handlers.default) {
         this.handlers.default(msg);
      }
   }
   private startClient(filepath: string, silent: boolean) {
      const proc = this.process = spawn('node', [
         filepath,
      ]);
      if (!silent) {
         proc.stdout.pipe(process.stdout);
         proc.stderr.pipe(process.stdout);
      }
      proc.on('exit', code => {
         if (code !== 0) {
            throw new Error('Client exit with code ' + code);
         } else if (this.assertion) {
            throw new Error('The client exits when there are still assertions');
         }
      });
   }
}

export async function createEndB() {
   const endB = new EndB();
   await endB.readyPromise;
   return endB;
}

class EndB {
   public socket: WebSocket;
   public readyPromise: Promise<void>;
   private readyPromiseResolve: () => void;
   private readyPromiseReject: () => void;

   constructor() {
      this.socket = new WebSocket('ws://127.0.0.1:' + wsServerPort);
      this.socket.on('open', () => {
         this.readyPromiseResolve();
      });
      this.socket.on('error', () => {
         this.readyPromiseReject();
         throw new Error('Fail to connect to server.');
      });
      this.socket.on('message', (data: string) => {
         if (this.handlers[data]) {
            this.handlers[data]!(data);
         } else {
            this.handlers.default!(data);
         }
      });
      this.readyPromise = new Promise((res, rej) => {
         this.readyPromiseResolve = res;
         this.readyPromiseReject = rej;
      });
   }
   public send(msg: string) {
      this.socket.send(msg);
   }
   private handlers: {
      default?: (msg: string) => void;
      [k: string]: undefined | ((msg: string) => void);
   };

   public onMessage(
      msg: string,
      handler: (msg: string) => void
   ): void;
   public onMessage(
      handler: (msg: string) => void
   ): void;
   public onMessage(arg1: any, arg2?: any) {
      if (typeof arg2 === 'undefined') {
         this.handlers.default = arg1;
      } else {
         this.handlers[arg1] = arg2;
      }
   }
}
