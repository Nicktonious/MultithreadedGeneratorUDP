import { execSync, exec } from "node:child_process";
import os from 'os'

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

async function getTxCounter(ifaceName) {
    let tx_0 = await getTxSent(ifaceName);
    return async () => {
        let tx_1 = await getTxSent(ifaceName);
        let d = tx_1 - tx_0;
        tx_0 = tx_1;
        return d;
    }
}

async function sleep(time) {
    return new Promise((res) => setTimeout(res, time));
}

async function taskset(cpu, isMain) {
    // Привязка к CPU-ядру через taskset (Linux)
    if (os.type() == 'Linux') {
        const { pid } = process;
        execSync(`taskset -cp ${cpu} ${pid}`);
    }
}

export { incrementIp, getTxSent, sleep, taskset }