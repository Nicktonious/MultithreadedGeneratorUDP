import minimist from 'minimist';
import { Worker } from 'worker_threads';


// Конфигурация по умолчанию
const TOTAL_BUFFER_SIZE_B = 1_073_741_824; // 1GB in bytes
const GB_in_bytes = 1_073_741_824;
const DEFAULT_PORT_BASE = 40000;
const DEFAULT_PACKET_SIZE_KB = 8192; // 8KB
const DEFAULT_SPEED_Gbit = 1; // Gbit/s



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
        packetSize: DEFAULT_PACKET_SIZE_KB,
        sockets: 1
    }
});

const serverAddress = args.server;
const numSockets = parseInt(args.sockets);
const totalBufferSize = parseFloat(args.bufferSize) ? parseFloat(args.bufferSize)*GB_in_bytes : GB_in_bytes;
const portBase = parseInt(args.portBase);
const packetSize = parseInt(args.packetSize);
const isMaxSpeed = args.max;
const targetSpeed = isMaxSpeed ? 0 : parseFloat(args.speed);
const packetsPerSec = targetSpeed * 134217728 / packetSize;

if (!serverAddress) throw new Error('Server address required');
if (isNaN(numSockets)) throw new Error('Invalid sockets count');
if (isNaN(portBase)) throw new Error('Invalid port base');
if (isNaN(packetSize)) throw new Error('Invalid packet size');
if (!isMaxSpeed && isNaN(targetSpeed)) throw new Error('Invalid speed');

console.log(`Starting client with:
- Server: ${serverAddress}
- Total SendBuffeSize: ${(totalBufferSize / GB_in_bytes).toFixed(2)} GB
- Sockets: ${numSockets}
- Mode: ${isMaxSpeed ? 'MAX SPEED' : `${targetSpeed} Gbit (${packetsPerSec} Packets/s)`}
- Packet size: ${(packetSize / 1024).toFixed(2)} KB`);
const socketInfoList = Array(numSockets).fill().map((_, i) => ({
    port: portBase + i,
    portBase,
    packetSize,
    socketIndex: i,
    bufferSize: Math.floor(totalBufferSize / numSockets)
}));

const workers = [];
for (let i = 0; i < numSockets; i++) {
    // TODO предусмотреть для нечетного кол-ва сокетов
    let socketsOnThread = 1;

    let worker = new Worker('./js/client/thread_based/js/SenderMultiThreadWrapper.mjs', {
        workerData: {
            serverAddress,
            sockets: socketInfoList.splice(0, socketsOnThread),
            isMaxSpeed,
            targetSpeed: packetsPerSec/numSockets,
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
