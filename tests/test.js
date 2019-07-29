const { createClient } = require('./createClient');

main().catch(r => console.log(r));

async function main() {
   const client = await createClient('tmp/test2.js', {
      timeout: 3000,
   });
   client.onReceive(data => {
      console.log('receive ' + data);
   });
   await client.willReceive('test 1');
   client.send('test 2');
   await client.willReceive('test 3');
   client.onReceive('abc', () => {
      console.log('receive abc');
   });
}
