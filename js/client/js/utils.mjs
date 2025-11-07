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

function getIncrIPCAddress(addr, i) {
    let [a, b] = addr.split('.');
    a += `_${i}`;
    if (b) return [a, b].join('.');
    return a;
}

function prepareIPCDir(fullIPCAddr) {
    let i = fullIPCAddr.indexOf('ipc:/');
    let j = fullIPCAddr.indexOf('.ipc');
    let addr = fullIPCAddr.substr(i, j);
    if (!fs.existsSync(addr)) {
            fs.mkdirSync(addr, { recursive: true });
        }
}

/**
 * Устанавливает длину очереди txqueuelen на интерфейсе
 * @param {number} [delayMs=2] - Задержка в мс
 * @param {number} [messagesPerSecond=100000] - Сообщений в секунду
 * @param {string} [iface='eth0'] - Название интерфейса
 */
async function setQlen({ delayMs, mps, iface, qlen }) {

    const _setQlen = async (qlen) => new Promise((res, rej) => {
        const cmd = `sudo ip link set dev ${iface} txqueuelen ${qlen}`;
        exec(cmd, (err, stdout, stderr) => {
            if (err) rej(err);
            if (stderr) {
                console.warn(`Предупреждение: ${stderr}`);
            }
            res(qlen);
        });
    });

    if (qlen) return await _setQlen(qlen);
    if (delayMs < 0 || mps < 0) throw new Error('Invalid args');
    const delaySec = delayMs / 1000;
    qlen = Math.ceil(delaySec * mps);
    return await _setQlen(qlen);
}

export { incrementIp, getTxSent, sleep, taskset, getIncrIPCAddress }