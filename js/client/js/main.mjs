import { fork } from 'node:child_process';
import parseArgs from './argsParser.mjs';
import ControlChannel from './ClassControlChannel.mjs';
import { loadConfig, toIPCConfig } from './configParser.mjs';
import { StatsReceiver } from './Stats.mjs';
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

// extract zips and save path to each group's data 
let filesDict = userConf.groups.reduce((pr, curr) => {
    pr[curr.name] = dataProvider.ExtractZipArchive(curr.filesPath, './temp');
    return pr;
}, {});

const ipcConf = toIPCConfig(userConf, filesDict, { baseCPUIndex: 0 });
writeFileSync('./etc/config.json', JSON.stringify(ipcConf));

const generator = fork('./bin/send', [JSON.stringify(ipcConf)], {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
});

const stats = new StatsReceiver([generator]).Start();

console.log(`Main Process ${process.pid} running on Core ${baseCPUIndex}`);
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

// Обработка SIGINT
process.on('SIGINT', async () => {
    await INT_handler({ generator, stats, ctrlCh });
});


async function INT_handler({ generator, stats, ctrlCh }) {
    // processes.forEach(child => child.send({ com: 'tx_packets' }));
    console.log('INTERRUPT signal');

    if (!generator.killed) generator.kill('SIGINT');

    setTimeout(async () => {
        const tx_stats = await stats.GetStats();
        const tx_sent = tx_stats.reduce((p, c) => p + c, 0);
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
}