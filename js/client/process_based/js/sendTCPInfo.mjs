import net from 'net';

/**
 * Устанавливает TCP соединение и отправляет JSON-пакет.
 * @param {string} host - IP-адрес или доменное имя сервера
 * @param {number} port - порт сервера
 * @param {number} packetsSend - число, которое будет передано в поле packets_send
 */
export default async function sendTcpInfo(host, port, packetsSend) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();

        client.connect(port, host, () => {
            const message = {
                group_id: 0,
                packets_send: packetsSend
            };

            // сериализация JSON + перенос строки для удобства
            const data = JSON.stringify(message) + '\n';

            client.write(data, 'utf8', () => {
                client.end(); // закрываем соединение сразу после отправки
            });
        });

        client.on('close', () => {
            resolve();
        });

        client.on('error', (err) => {
            reject(err);
        });
    });
}


