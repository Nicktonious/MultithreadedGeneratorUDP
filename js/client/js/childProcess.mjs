import { cpus } from 'os';
import Sender from './ClassSender.mjs';
import { argv, send } from 'process';
import { taskset } from './utils.mjs';

/**
 * @typedef TypeSensorOpts
 * @property {string} name
 * @property {string} src "10.110.100.2:40000",
 * @property {string} dst
 * @property {number} socketIndex
 * @property {number} bufferSize
 */

/**
 * @typedef TypeWorkArgs 
 * @property {string} groupName
 * @property {number} packetSize
 * @property {TypeSensorOpts} sensors
 * @property {number} baseCPUIndex,
 * @property {number} threadIndex
*/

function sendTxStats(value) {
    process.send({ com: 'tx_packets', value });
}


/**
 * @function
 * @param {TypeWorkArgs} workerData 
 */
function main(workerData) {

    const cpu = workerData.baseCPUIndex + ((workerData.threadIndex + 1) % cpus().length);
    taskset(cpu, false);
    const sender = new Sender(workerData, 
        'ipc:///tmp/zmq_clock.ipc', 
        `ipc:///tmp/zmq_data_${workerData.threadIndex}.ipc`);

    console.log(`Process ${process.pid} running on Core ${cpu}, ${workerData.sensors.length} sockets`);

    process.on('message', (msg) => {
        if (msg.type === 'SIGINT') {
            sender.StartGracefulShutDown();
        }
    });

    process.on('SIGINT', () => {
        console.log(`${process.pid}: ${sender.messageCount}, late = ${sender.late}`);
        sendTxStats(sender.messageCount);
        // console.log(`${sender.workerData.threadIndex} : ${sender.ticks}, ${sender.messageCount}`);
        process.exit();
    });

    process.on('message', msg => {
        if (msg.com == 'tx_packets') sendTxStats(sender.messageCount);
    });
    
    console.log(`${process.pid} - RunBrokerSpeed()`);
    sender.RunBrokerSpeed();
}

const [path, fn, args] = argv;
let workerData = JSON.parse(args);
main(workerData);