import { workerData, parentPort } from 'worker_threads';
import Sender from './Sender.mjs';

const sender = new Sender(workerData);
console.log(`Run worker ${workerData.threadIndex}`);

await sender.Init();
sender.RunFixedSpeed(workerData);