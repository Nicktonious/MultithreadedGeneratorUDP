import minimist from "minimist";

const GB_in_bytes = 1_073_741_824;
const DEFAULT_PACKET_SIZE_B = 8192; // 8 KB
const DEFAULT_TOTAL_BUFFER_GB = 1;
const DEFAULT_SOCKETS = 1;
const DEFAULT_BASE_CPU = 0;

/**
 * @typedef {Object} ParsedArgs
 * @property {string} dstIp - IP-адрес сервера (обязательно).
 * @property {number} n - Количество сокетов.
 * @property {number} totalBufferSize - Размер буфера в байтах.
 * @property {string|undefined} srcIp - Локальный IP (опционально).
 * @property {number} portBase - Базовый порт.
 * @property {number} packetSize - Размер пакета в байтах.
 * @property {number} baseCPUIndex - Базовый индекс CPU.
 */

/**
 * Парсинг аргументов CLI
 * @param {string[]} argv
 * @returns {ParsedArgs}
 */
export default function parseArgs(argv) {
    const args = minimist(argv, {
        alias: {
            h: "help",
            d: "dst",
            s: "src",
            p: "portBase",
            n: "sockets",
            b: "bufferSize",
            c: "baseCPU",
            k: "packetSize",
            f: 'freq'
        },
        default: {
            sockets: DEFAULT_SOCKETS,
            packetSize: DEFAULT_PACKET_SIZE_B,
            bufferSize: DEFAULT_TOTAL_BUFFER_GB,
            baseCPU: DEFAULT_BASE_CPU,
        },
        string: ["dst", "src"],
    });

    // --- HELP ---
    if (args.help) {
        console.log(`Usage: node app.js [options]
    Options:
    -d, --dst <ip>         Server IP address (required)
    -s, --src <ip>         Source IP address (optional)
    -p, --portBase <num>   Base port (required)
    -n, --sockets <num>    Number of sockets (default: ${DEFAULT_SOCKETS})
    -b, --bufferSize <GB>  Buffer size in GB (default: ${DEFAULT_TOTAL_BUFFER_GB})
    -k, --packetSize <B>   Packet size in bytes (default: ${DEFAULT_PACKET_SIZE_B})
    -c, --baseCPU <num>    Base CPU index (default: ${DEFAULT_BASE_CPU})
    -h, --help             Show this help message
    -f, --freq             Frequency
    `);
        process.exit(0);
    }

    // --- CONVERSIONS ---
    const dstIp = args.dst;
    const srcIp = args.src || undefined;
    const n = parseInt(args.sockets);
    const portBase = parseInt(args.portBase);
    const packetSize = parseInt(args.packetSize);
    const baseCPUIndex = parseInt(args.baseCPU);
    const totalBufferSize = parseFloat(args.bufferSize) * GB_in_bytes;
    const freq = parseInt(args.freq);

    // --- VALIDATION ---
    if (!dstIp) throw new Error("Server address required (-d, --dst)");
    if (isNaN(n) || n <= 0) throw new Error("Invalid sockets count");
    if (isNaN(portBase) || portBase <= 0) throw new Error("Invalid port base");
    if (isNaN(packetSize) || packetSize <= 0) throw new Error("Invalid packet size");
    if (isNaN(baseCPUIndex) || baseCPUIndex < 0) throw new Error("Invalid base CPU index");

    return { dstIp, n, totalBufferSize, srcIp, portBase, packetSize, baseCPUIndex, freq };
}
