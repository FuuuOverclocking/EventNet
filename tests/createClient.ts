import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as WebSocket from 'ws';

class Client {
   public process: ChildProcess;
   public wsServer: WebSocket.Server;
   public socket: WebSocket;
   protected timeout: number;
   protected timeoutId: NodeJS.Timeout;
   protected connected = false;
   protected assertion: string | false = false;
   protected assertionPromise = {
      resolve: () => { },
      reject: (r: string) => { },
   };
   protected handlers: {
      default?: (msg: string) => void;
      [k: string]: (msg: string) => void;
   } = {};

   constructor(
      public filepath: string,
      {
         timeout = 5,
         silent = false,
         onConnected = void 0 as any,
      }
   ) {
      this.timeout = timeout;
      if (!fs.existsSync(filepath)) {
         throw new Error('JS file not exists.');
      }

      this.startWebSocketListen(onConnected);
      this.startClient(filepath, silent);
      this.setTimeout('Failed to create client.');
   }

   public willReceive(msg: string) {
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
   public onReceive(msg: string, handler: (msg: string) => {}): void;
   public onReceive(handler: (msg: string) => {}): void;
   public onReceive(arg1: any, arg2?: any) {
      if (typeof arg2 === 'undefined') {
         this.handlers.default = arg1;
      } else {
         this.handlers[arg1] = arg2;
      }
   }

   protected setTimeout(err: string) {
      this.timeoutId = setTimeout(() => {
         throw new Error(err);
      }, this.timeout);
   }
   protected unsetTimeout() {
      clearTimeout(this.timeoutId);
   }

   protected startWebSocketListen(onConnected: (client: this) => void) {
      const wss = this.wsServer = new WebSocket.Server({ port: 2357 });

      wss.on('connection', ws => {
         if (this.connected) {
            throw new Error('Multiple clients connected to the server.');
         }
         this.unsetTimeout();
         this.connected = true;
         onConnected(this);
         ws.on('message', msg => {
            this.receive(msg as string);
         });

         this.socket = ws;
      });
   }
   protected receive(msg: string) {
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
         this.handlers[msg](msg);
      } else if (this.handlers.default) {
         this.handlers.default(msg);
      }
   }
   protected startClient(filepath: string, silent: boolean) {
      const pr = this.process = spawn('node', [
         filepath,
      ]);
      if (!silent) {
         pr.stdout.pipe(process.stdout);
         pr.stderr.pipe(process.stdout);
      }
      pr.on('exit', code => {
         if (code !== 0) {
            throw new Error('Client exit with code ' + code);
         } else if (this.assertion) {
            throw new Error('The client exits when there are still assertions');
         }
      });
   }
}

export function createClient(
   filepath: string,
   {
      timeout = 5,
      silent = false,
   }
) {
   return new Promise((resolve, reject) => {
      const client = new Client(
         filepath,
         { timeout, silent, onConnected: resolve }
      );
      setTimeout(reject, timeout);
   });
}
