import { exec, execSync, fork, spawn } from 'node:child_process';
import parseArgs from './argsParser.mjs';
import ControlChannel from './ClassControlChannel.mjs';
import { loadConfig, toIPCConfig } from './configParser.mjs';
import { StatsReceiver, StatsStream } from './Stats.mjs';
import DataProvider from './ClassDataProvider.mjs';
import { writeFileSync } from 'node:fs';
const SYSCONF_PATH = './sysconf.json';
// MAIN
const args = parseArgs(process.argv.slice(2));
const { config: configPath } = args;

// const sysConf = loadConfig(SYSCONF_PATH) ?? { coreProc: '' };
/**
 * @type {import('./configParser.mjs').Config}
 */
const userConf = loadConfig(configPath);
const dataProvider = new DataProvider();

let filesDict = userConf.groups.reduce((pr, curr) => {
    pr[curr.name] = dataProvider.ExtractZipArchive(curr.filesPath, './temp');
    return pr;
}, {});

const ipcConf = toIPCConfig(userConf, filesDict, { baseCPUIndex: 0 });
writeFileSync('./etc/config.json', JSON.stringify(ipcConf));

// process.exit();

let res1 = execSync('cmake --fresh --preset linux');
console.log(`'cmake --fresh --preset linux' finished with ${res1.toLocaleString()}`);
let res2 = execSync('cmake --build --preset linux -j');
console.log(`'cmake --build --preset linux -j' finished with ${res2.toLocaleString()}`);

const generator = spawn('./bin/send', [], {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
});
generator.on('spawn', () => {
    console.log('`bin/send` spawned!');
});

console.log(`Main Process ${process.pid} is running`);
let ctrlCh = null;

if (userConf.sysChannel) try {
    const [infoIp, infoPort] = userConf.sysChannel.host.split(':');
    ctrlCh = new ControlChannel({ ip: infoIp, port: +infoPort });
} catch (e) {
    console.log(`Failed to init info channel on ${userConf.sysChannel}`);
}

if (ctrlCh) try {
    await ctrlCh.Connect();
    await ctrlCh.Register();

    console.log('Registered');

    console.log(userConf.groups[0].sensors.map(s => s.dst));
    await ctrlCh.Start(userConf);

} catch (e) {
    console.log(e);
}

const statsReceiver = new StatsReceiver(generator);

/*statsReceiver.OnStats = stats => {
    if (typeof stats?.packets == 'number') ctrlCh.Packets(stats.packets);
}*/

// Обработка SIGINT
process.on('SIGINT', async () => {
    await INT_handler({ generator, statsReceiver, ctrlCh });
});

async function INT_handler({ generator, statsReceiver, ctrlCh }) {
    // processes.forEach(child => child.send({ com: 'tx_packets' }));
    console.log('INTERRUPT signal');

    if (!generator.killed) generator.kill('SIGINT');

    setTimeout(async () => {
        const tx_sent = statsReceiver.packets;
        console.log(`Sent ${tx_sent} packets`);

        if (ctrlCh) try {
            ctrlCh.Packets(tx_sent);
            await ctrlCh.Stop();
            ctrlCh.Close();
        } catch {
            console.log('Failed to send Stop command');
        }
        process.exit();
    }, 3000);
}