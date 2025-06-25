import minimist from 'minimist';
import { Worker } from 'worker_threads';


// Конфигурация по умолчанию
const TOTAL_BUFFER_SIZE_B = 1_073_741_824; // 1GB in bytes
const DEFAULT_PORT_BASE = 40000;
const DEFAULT_PACKET_SIZE_KB = 8192; // 8KB
const DEFAULT_SPEED_Gbit = 10; // Gbit/s
const DEFAULT_MODE = 'sthread';
const MODE_MULTITHREAD = 'mthread';


// Парсинг аргументов
const args = minimist(process.argv.slice(2), {
    alias: {
        s: 'server',
        p: 'portBase',
        z: 'packetSize',
        c: 'sockets',
        r: 'speed',
        m: 'mode'
    },
    default: {
        numThreads: 1,
        portBase: DEFAULT_PORT_BASE,
        packetSize: DEFAULT_PACKET_SIZE_KB,
        sockets: 1,
        speed: DEFAULT_SPEED_Gbit,
        mode: DEFAULT_MODE
    }
});

const numThreads = parseInt(args.threads);
const serverAddress = args.server;
const numSockets = parseInt(args.sockets);
const portBase = parseInt(args.portBase);
const packetSize = parseInt(args.packetSize);
const isMaxSpeed = args.max;
const targetSpeed = isMaxSpeed ? 0 : parseFloat(args.speed);
const packetsPerSec = targetSpeed * 134217728 / packetSize;
const mode = args.mode;

if (!serverAddress) throw new Error('Server address required');
if (isNaN(numSockets)) throw new Error('Invalid sockets count');
if (isNaN(portBase)) throw new Error('Invalid port base');
if (isNaN(packetSize)) throw new Error('Invalid packet size');
if (!isMaxSpeed && isNaN(targetSpeed)) throw new Error('Invalid speed');

console.log(`Starting client with:
- Server: ${serverAddress}
- Sockets: ${numSockets}
- Mode: ${isMaxSpeed ? 'MAX SPEED' : `${targetSpeed} Gbit (${packetsPerSec} Packets/s`}
- Packet size: ${(packetSize / 1024).toFixed(2)} KB`);
const socketInfoList = Array(numSockets).fill().map((_, i) => ({
    port: portBase + i,
    packetSize,
    socketIndex: i,
    bufferSize: Math.floor(TOTAL_BUFFER_SIZE_B / numSockets)
}));

const workers = [];
for (let i = 0; i < numThreads; i++) {
    // TODO предусмотреть для нечетного кол-ва сокетов
    let socketsOnThread = (numThreads == 1) ? numSockets : 2;

    let worker = new Worker('./js/client/thread_based/js/SenderMultiThreadWrapper.mjs', {
        workerData: {
            serverAddress,
            sockets: socketInfoList.splice(0, socketsOnThread),
            isMaxSpeed,
            targetSpeed: packetsPerSec,
            threadIndex: i,
            packetSize
        }
    });
    worker.on('error', (err) => console.error(`Worker ${i} error:`, err));
    worker.on('exit', (code) => {
        if (code !== 0) console.error(`Worker ${i} exited with code ${code}`);
    });
    workers.push(worker);
}
process.on('SIGINT', () => {
    console.log('SIGINT');
    workers.forEach(child => child.terminate());
    process.exit();
});
