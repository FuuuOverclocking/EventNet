/**
 * This file will determine which facilities are included in
 * the built library. Thanks to Rollup, redundant code will be
 * automatically removed.
 * You can find a list of config files like `config.dev.ts` in
 * the same directory. Their name will be changed to `config.ts`
 * at build time.
 *
 * To customize the facilities included in the built library,
 * modify this file and run `npm run build --direct`.
 */
// [Abbreviation] CFG = configuration

import { DebugHandler } from './types';

export const CFG_enable_debug_msg = true;

export const CFG_enable_monitor = false;
// import { monitor as _monitor } from './monitor/index';
export const monitor: null | any = null;

//////////////// Configuraion For Users ///////////////////////
export const config: {
   silent: boolean;
   debug_handler: DebugHandler;
} = {
   silent: false,
   debug_handler: {},
};
