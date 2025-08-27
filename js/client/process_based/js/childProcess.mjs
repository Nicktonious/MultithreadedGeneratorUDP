import os, { cpus } from 'os';
import Sender from './ClassSender.mjs';
import { argv } from 'process';
import { execSync } from 'child_process';

const [path, fn, args] = argv;
let workerData = JSON.parse(args);

// Привязка к CPU-ядру через taskset (Linux)
if (os.type() == 'Linux') {
    const { pid } = process;
    let i = workerData.threadIndex;
    let { baseCPUIndex } = workerData;
    const cpu = baseCPUIndex + ((i+1) % cpus().length);
    execSync(`taskset -cp ${cpu} ${pid}`);
    console.log(`Process ${process.pid} running on Core ${cpu}`);
}

const sender = new Sender(workerData, 5555);
await sender.Init();
sender.RunBrokerSpeed()

process.on('message', (msg) => {
    console.log(msg);
    if (msg.type === 'SIGINT') {
        sender.StartGracefulShutDown();
    }
});

// if (workerData.isTriang)
//     sender.RunTriangleSpeed(workerData);
// else 
//     sender.RunFixedSpeed(workerData);
