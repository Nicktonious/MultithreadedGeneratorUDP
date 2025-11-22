import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { start, stop } = require('./build/Release/zmq_clock_gen.node');

let interval;
function StartZMQGen(freq) {
    start(freq);
    interval = setInterval(() => { }, 1000);
}

function StopZMQGen() {
    stop();
    if (interval) 
        clearInterval(interval);
}

export { StartZMQGen, StopZMQGen }