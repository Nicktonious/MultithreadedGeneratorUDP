import { exec, execSync, fork } from 'node:child_process';
import setQlen from './setqlen.mjs';
import ClockGenerator from './ClassZMQServer.mjs';
import parseArgs from './argsParser.mjs';
import { StartZMQGen, StopZMQGen } from './ClockGenWrapper.mjs';
import ControlChannel from './ClassControlChannel.mjs';
import { getTxSent, incrementIp, sleep, taskset } from './utils.mjs';
import createConfiguration from './createTempConf.mjs';
import { loadConfig } from './configParser.mjs';
import { StatsReceiver } from './Stats.mjs';

const GB_in_bytes = 1_073_741_824;

function getSocketsInfo({ n, srcIp, portBase, endPort, totalBufferSize }) {
    return Array(n).fill().map((_, i) => ({
        port: portBase + i % (endPort - portBase + 1),
        srcIp: incrementIp(srcIp, i),
        portBase,
        socketIndex: i,
        bufferSize: Math.floor(totalBufferSize / n)
    }));
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const { dstIp, n, totalBufferSize, srcIp,
        portBase, packetSize, baseCPUIndex,
        freq, spp, infoCh, endPort, time } = args;

    console.log(`Starting client with:
    - Server: ${dstIp}
    - Total SendBufferSize: ${(totalBufferSize / GB_in_bytes).toFixed(2)} GB
    - Sockets: ${n}
    - Packet size: ${(packetSize / 1024).toFixed(2)} KB`);

    /*try {
        let msgPerSec = freq * n;
        let res = await setQlen({ qlen: msgPerSec*1.2, iface: 'enp1s0np1' });
        console.log(`Set txqlen = ${res}`);
    } catch (e) {
        console.log(`Error trying to set txqlen: ${e}`);
    }*/
    
    const socketInfoList = getSocketsInfo(args);

    const processes = [];
    const packets = Array(Math.ceil(n / spp)).fill(-1);
    for (let i = 0; socketInfoList.length > 0; i++) {
        let args = JSON.stringify({
            serverAddress: dstIp,
            sockets: socketInfoList.splice(0, spp),
            threadIndex: i,
            baseCPUIndex,
            packetSize
        });
        const child = fork('./js/client/process_based/js/childProcess.mjs', [args], {
            stdio: ['inherit', 'inherit', 'inherit', 'ipc']
        });

        processes.push(child);
    }

    const stats = new StatsReceiver(processes).Start();

    taskset(baseCPUIndex, true);
    console.log(`Main Process ${process.pid} running on Core ${baseCPUIndex}`);

    const generator = await new ClockGenerator({ address: 'ipc:///tmp/zmq_clock.ipc' }).Init();
    
    let ctrlCh = infoCh ? new ControlChannel(infoCh) : undefined;

    if (ctrlCh) try {
        await ctrlCh.Connect();
        await ctrlCh.Register();

        console.log('Registered');

        const conf = createConfiguration(args);
        console.log(conf.groups[0].sensors.map(s => s.dst));
        await ctrlCh.Start(conf);
        
    } catch (e) {
        console.log(e);
    }
    

    // Обработка SIGINT
    process.on('SIGINT', async () => {
        // processes.forEach(child => child.send({ com: 'tx_packets' }));
        console.log('INTERRUPT signal');

        generator.Stop();

        setTimeout(async () => {
            processes.filter(child => !child.killed).forEach(child => {
                try {
                    child.kill('SIGINT');
                } catch (err) { }
            });

            const tx_stats = await stats.GetStats();
            const tx_sent = tx_stats.reduce((p, c) => p+c, 0);
            console.log(`Sent ${tx_sent} packets`);
            console.log(`Stats: ${stats.packets}\ntotal: ${tx_sent}`);

            if (ctrlCh) try {
                ctrlCh.Packets(tx_sent);
                await ctrlCh.Stop();
                ctrlCh.Close();
            } catch {
                console.log('Failed to send Stop command');
            }
            process.exit();
        }, 3000);
    });

    setTimeout(async () => {

        const tickLimit = time * freq;
        await generator.Run(freq, tickLimit, () => process.kill(process.pid, 'SIGINT'));
    }, 4000);
}

main();