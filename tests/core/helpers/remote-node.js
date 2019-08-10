const { createEndB } = require('../../helpers/e2e-helper');
const { node, domain } = require('../../indexes/eventnet');
const { WebSocketServer: wss } = require('../../indexes/connectors');

main().catch(r => console.error(r));
async function main() {
   const endB = await createEndB();
   endB.send('ping');

   configAndListen();
   domain.LocalDomain.export(generateNodes());
}

function configAndListen() {
   const { LocalDomain } = domain;
   LocalDomain.config({
      name: 'domain8888',
      receivers: wss({ port: 8888 }),
   });
   LocalDomain.on('connect', (msg, res) => {
      if (msg && msg.key === 'test-password') {
         res.accept();
      }
      else {
         res.refuse();
      }
   });
   LocalDomain.listen();
}

function generateNodes() {
   const nd1 = node();
   return { nd1 };
}
