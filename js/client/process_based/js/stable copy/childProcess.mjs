import os, { cpus } from 'os';
import Sender from './ClassSender.mjs';
import { argv, send } from 'process';
import { execSync } from 'child_process';
import { taskset } from './utils.mjs';

const [path, fn, args] = argv;
let workerData = JSON.parse(args);

function sendTxStats() {
    process.send({ com: 'tx_packets', value: sender.messageCount });
}

const cpu = workerData.baseCPUIndex + ((workerData.threadIndex + 1) % cpus().length);
taskset(cpu, false);
console.log(`Process ${process.pid} running on Core ${cpu}, ${workerData.sockets.length} sockets`);

process.on('message', (msg) => {
    console.log(msg);
    if (msg.type === 'SIGINT') {
        sender.StartGracefulShutDown();
    }
});

process.on('SIGINT', () => {
    sendTxStats();
    // console.log(`${sender.workerData.threadIndex} : ${sender.ticks}, ${sender.messageCount}`);
    process.exit();
});
process.on('message', msg => {
    if (msg.com == 'tx_packets') sendTxStats();
});
const sender = new Sender(workerData, "ipc:///tmp/zmq_clock.ipc");
console.log(`${process.pid} - RunBrokerSpeed()`);
sender.RunBrokerSpeed();