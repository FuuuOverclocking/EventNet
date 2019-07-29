console.log('log 1');
const WebSocket = require('ws');

const ws = new WebSocket('ws://127.0.0.1:2357');
 
ws.on('open', function open() {
  ws.send('test 1');
});
 
ws.on('message', function incoming(data) {
  console.log(data);
  ws.send('test 33');
  ws.send('abc');
  ws.send('12345');
});
