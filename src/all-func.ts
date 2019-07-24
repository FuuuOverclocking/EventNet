/*
   This is the global export file that exports all the
   functionality of EventNet for UMD and esm-browser version.
*/

/* eventnet */
export * from './entry';

/* eventnet.attrs */
import * as attrs from './attrs/index';
export { attrs };

/* eventnet.connectors */
import * as connectors from './connectors/index';
export { connectors };

/* eventnet.monitor */
///// enable-next-line-if-entry = default, dev
// import * as monitor from './monitor/index';
///// enable-next-line-if-entry = default, dev
// export { monitor };

/* eventnet.nodes */
import * as nodes from './nodes/index';
export { nodes };
