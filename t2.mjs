
const IF = 'enp1s0np0';
/**
 * Устанавливает длину очереди txqueuelen на интерфейсе
 * @param {number} [delayMs=2] - Задержка в мс
 * @param {number} [messagesPerSecond=100000] - Сообщений в секунду
 * @param {string} [iface='eth0'] - Название интерфейса
 */
async function setQlen({ delayMs, mps, iface = IF, qlen }) {

    const _setQlen = async (qlen) => new Promise((res, rej) => {
        const cmd = `sudo ip link set dev ${iface} txqueuelen ${qlen}`;
        res(cmd)
    });

    if (qlen) return await _setQlen(qlen);
    if (delayMs < 0 || mps < 0) throw new Error('Invalid args');
    const delaySec = delayMs / 1000;
    qlen = Math.ceil(delaySec * mps);
    return await _setQlen(qlen);
}

let r = await setQlen({ delayMs: 5, mps: 100055000});
console.log(r);