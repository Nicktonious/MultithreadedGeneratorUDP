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
 * @property {number} endPort
 * @property {number} packetSize - Размер пакета в байтах.
 * @property {number} baseCPUIndex - Базовый индекс CPU.
 * @property {number} time - Время генерации 
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
            i: "infoCh",
            d: "dst",
            s: "src",
            p: "portBase",
            e: "endPort",
            n: "sockets",
            b: "bufferSize",
            c: "baseCPU",
            k: "packetSize",
            f: 'freq',
            m: 'sockPerProc',
            t: 'time'
        },
        default: {
            sockets: DEFAULT_SOCKETS,
            packetSize: DEFAULT_PACKET_SIZE_B,
            bufferSize: DEFAULT_TOTAL_BUFFER_GB,
            baseCPU: DEFAULT_BASE_CPU,
            sockPerProc: 5,
            time: Infinity
        },
        string: ["dst", "src"], 
    });

    // --- HELP ---
    if (args.help) {
        console.log(`Usage: node app.js [options]
    Options:
    -d, --dst <ip>         Server IP address (required)
    -i, --infoCh
    -s, --src <ip>         Source IP address (optional)
    -p, --portBase <num>   Base port (required)
    -e, --endPort <num>    Max port value
    -n, --sockets <num>    Number of sockets (default: ${DEFAULT_SOCKETS})
    -b, --bufferSize <GB>  Buffer size in GB (default: ${DEFAULT_TOTAL_BUFFER_GB})
    -k, --packetSize <B>   Packet size in bytes (default: ${DEFAULT_PACKET_SIZE_B})
    -c, --baseCPU <num>    Base CPU index (default: ${DEFAULT_BASE_CPU})
    -h, --help             Show this help message
    -f, --freq             Frequency
    -m, --sockPerProc      Number of sockets per single process (default: 5)
    -t, --time
    `);
        process.exit(0);
    }

    // --- CONVERSIONS ---
    const dstIp = args.dst;
    const srcIp = args.src;
    const n = parseInt(args.sockets);
    const portBase = parseInt(args.portBase);
    const endPort = parseInt(args.endPort) ?? (portBase + n - 1);
    const packetSize = parseInt(args.packetSize);
    const baseCPUIndex = parseInt(args.baseCPU);
    const totalBufferSize = parseFloat(args.bufferSize) * GB_in_bytes;
    const freq = parseInt(args.freq);
    const spp = parseInt(args.sockPerProc);
    const time = parseInt(args.time);
    const [infoIp, infoPort] = args.infoCh?.split(':') ?? [];

    // --- VALIDATION ---
    if (!dstIp) throw new Error("Server address required (-d, --dst)");
    if (isNaN(n) || n <= 0) throw new Error("Invalid sockets count");
    if (isNaN(portBase) || portBase <= 0) throw new Error("Invalid port base");
    if (isNaN(packetSize) || packetSize <= 0) throw new Error("Invalid packet size");
    if (isNaN(baseCPUIndex) || baseCPUIndex < 0) throw new Error("Invalid base CPU index");
    if (isNaN(freq) || freq < 0) throw new Error("Invalid freq value");
    if (isNaN(spp) || spp < 0) throw new Error("Invalid sockPerProc");

    let infoCh = (infoIp && infoPort) ? { ip: infoIp, port: parseInt(infoPort) } : undefined;

    return { dstIp, n, totalBufferSize, srcIp, portBase, endPort, packetSize, baseCPUIndex, freq, spp, time, infoCh };
}
