import { config } from './config';
import { monitor } from './monitor/index';

config.silent = false;
config.monitoring = true;
config.monitor = monitor;

export { config };
export * from './core/index';
