import { cpus } from 'os';
import Sender from './ClassSender.mjs';
import { argv, send } from 'process';
import { taskset } from './utils.mjs';
import DataAsm from './ClassDataAsm.mjs';
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
async function main(workerData) {

    const cpu = workerData.baseCPUIndex + ((workerData.threadIndex + 1) % cpus().length);
    taskset(cpu, false);

    let asm = new DataAsm(workerData, 
        'ipc:///tmp/zmq_clock.ipc', 
        `ipc:///tmp/zmq_data_${workerData.threadIndex}.ipc`);
    await asm.Init();

    console.log(`Process ${process.pid} running on Core ${cpu}, preparing data for ${workerData.sensors.length} sockets`);
    let { packetSize } = workerData;
    asm.Run({ packetSize });

    process.on('SIGINT', () => {
        console.log(`[ASM] asm.messageCounter = ${asm.messageCounter}, time =${(asm.t_1-asm.t_0)/1000} sec`);
        process.exit();
    });
}

const [path, fn, args] = argv;
let workerData = JSON.parse(args);
await main(workerData);