import { exec, execSync, fork } from 'node:child_process';
import os from 'node:os';
import setQlen from './setqlen.mjs';
import ClockGenerator from './ClassZMQServer.mjs';
import parseArgs from './argsParser.mjs';
import sendTcpInfo from './sendTCPInfo.mjs';

const MAX_SOCKETS_ON_PROC = 10;
const GB_in_bytes = 1_073_741_824;

function incrementIp(strIp, i) {
    let arrIp = strIp.split('.');
    arrIp[3] = +arrIp[3] + i;
    return arrIp.join('.')
}

async function getTxSent(ifaceName) {
    return new Promise((res, rej) => {
        const command = `cat /sys/class/net/${ifaceName}/statistics/tx_packets`;
        // const command = `cat /proc/net/dev | grep enp1s0np1 | awk '{print $10}'`
        exec(command, (e, stdout, stderr) => {
            if (e) res(undefined);
            res(parseInt(stdout));
        });
    });
}

async function main() {
    const { dstIp, n, totalBufferSize, srcIp,
        portBase, packetSize, baseCPUIndex, freq } = parseArgs(process.argv.slice(2));

    console.log(`Starting client with:
    - Server: ${dstIp}
    - Total SendBufferSize: ${(totalBufferSize / GB_in_bytes).toFixed(2)} GB
    - Sockets: ${n}
    - Packet size: ${(packetSize / 1024).toFixed(2)} KB`);

    /*try {
        let res = await setQlen({ delayMs: 5, mps: packetsPerSec });
        console.log(`Set txqlen = ${res}`);
    } catch (e) {
        console.log(`Error trying to set txqlen: ${e}`);
    }*/

    const generator = new ClockGenerator(5555);
    const tx_sent_0 = await getTxSent('enp1s0np1');

    setTimeout(() => { generator.Start(freq); }, 1000);

    const socketInfoList = Array(n).fill().map((_, i) => ({
        port: portBase + i,
        srcIp: incrementIp(srcIp, i),
        portBase,
        socketIndex: i,
        bufferSize: Math.floor(totalBufferSize / n)
    }));

    const processes = [];
    for (let i = 0; i < 1 + Math.floor(n / MAX_SOCKETS_ON_PROC); i++) {
        let args = JSON.stringify({
            serverAddress: dstIp,
            sockets: socketInfoList.splice(0, MAX_SOCKETS_ON_PROC),
            threadIndex: i,
            baseCPUIndex,
            packetSize
        });
        const child = fork('./js/client/process_based/js/childProcess.mjs', [args], {
            stdio: ['inherit', 'inherit', 'inherit', 'ipc']
        });

        processes.push(child);
    }

    // Привязка к CPU-ядру через taskset (Linux)
    if (os.type() == 'Linux') {
        const { pid } = process;
        const cpu = baseCPUIndex;
        execSync(`taskset -cp ${cpu} ${pid}`);
    }

    // Обработка SIGINT
    process.on('SIGINT', async () => {
        console.log('Stop signal sent to all child processes.');
        processes.forEach(child => child.send({ type: 'SIGINT' }));
        setTimeout(async () => {
            processes.forEach(child => child.kill('SIGTERM'));
            generator.Stop()

            const tx_sent_1 = await getTxSent('enp1s0np1');
            const tx_sent = tx_sent_1 - tx_sent_0;
            console.log(`Sent ${tx_sent} packets`);
            await sendTcpInfo('10.120.100.51', 9999, tx_sent)

        }, 200);
    });
}

main();