import { exec } from 'child_process';
import { createSocket } from 'dgram';
/*
port
srcIp
portBase
socketIndex
bufferSize*/
class SocketClient {
    constructor(socketInfo, serverAddress) {
        const { portBase, socketIndex, port } = socketInfo;
        this.socketInfo = socketInfo;
        this.socket = this.socket = createSocket('udp4');
        this.port = port;
        this.portBase = portBase;
        this.serverAddress = serverAddress;
        this.bufferSize = socketInfo.bufferSize;
    }
    async Init() {
        /*try {
            await this.CreateSubinterface('enp1s0np1', this.socketInfo.socketIndex, `${this.socketInfo.srcIp}/24`)
        } catch (e) {
            console.log('Failed to create interface ', e);
        }*/
        return new Promise((res, rej) => {
            this.socket.bind(/*this.socketInfo.port*/0, this.socketInfo.srcIp, () => {
                this.socket.setSendBufferSize(this.bufferSize);
                // socket.setRecvBufferSize(this.bufferSize);
                res();
            });
        }).then(() => {
            let { port, address } = this.socket.address();
            console.log(`${address}:${port} -> ${this.socketInfo.port}`);
        });
    }

    /**
     * Создает субинтерфейс и присваивает ему IP-адрес.
     * 
     * ВНИМАНИЕ: Эта функция выполняет команды оболочки с правами суперпользователя.
     * Убедитесь, что все входные данные должным образом проверены, чтобы избежать
     * уязвимостей, связанных с внедрением команд.
     *
     * @param {string} parentInterface Имя родительского интерфейса (например, 'eth0').
     * @param {number} subinterfaceIndex Индекс для нового субинтерфейса (например, 1).
     * @param {string} ipAddressWithMask IP-адрес с маской подсети (например, '192.168.1.10/24').
     * @returns {Promise<string>} Промис, который разрешается стандартным выводом в случае успеха.
     */
    async CreateSubinterface(parentInterface, subinterfaceIndex, ipAddressWithMask) {
        console.log(ipAddressWithMask);
        // Валидация входных данных для предотвращения внедрения команд
        if (!/^[a-zA-Z0-9]+$/.test(parentInterface) || !/^\d+$/.test(subinterfaceIndex)) {
            throw new Error('Недопустимые имена интерфейса или индекса.');
        }

        // Простая проверка формата IP-адреса. Для более надежной проверки рекомендуется
        // использовать специализированные библиотеки.
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
        if (!ipRegex.test(ipAddressWithMask)) {
            throw new Error('Недопустимый формат IP-адреса или маски подсети.');
        }

        const subinterfaceName = `${parentInterface}:${subinterfaceIndex}`;
        const command = `sudo ip addr add ${ipAddressWithMask} dev ${subinterfaceName}`;
        const hasIf = () => new Promise((res, rej) => {
            exec(`ip addr | grep ${ipAddressWithMask}`, (error, stdout, stderr) => {
                if (error) {
                    res(false)
                }
                if (stderr) {
                    console.warn(`stderr: ${stderr}`);
                }
                if (stdout?.length) res(true);
                else res(false);
                // resolve(`Субинтерфейс ${subinterfaceName} с IP-адресом ${ipAddressWithMask} существует.\n${stdout}`);
            });
        });
        const addIf = () => new Promise((res, rej) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Ошибка выполнения exec: ${error}`);
                    return rej(new Error(`Ошибка при создании субинтерфейса: ${stderr || error.message}`));
                }
                if (stderr) {
                    // Некоторые команды могут выводить информацию в stderr, даже если они успешны.
                    // Здесь можно добавить логику для обработки таких случаев.
                    console.warn(`stderr: ${stderr}`);
                }
                console.log(`Субинтерфейс ${subinterfaceName} успешно создан с IP-адресом ${ipAddressWithMask}.\n${stdout}`);
                res();
            });
        });
        let ifAlreadyExists = await hasIf();
        if (ifAlreadyExists) return;
        return addIf();
    }
    Send(buffer) {
        // счетчик
        // this.buffer.writeUInt32BE(this.packetCounter++, 1); // 8 байт после заголовка (BE = Big Endian)

        this.socket.send(buffer, this.port, this.serverAddress);
    }
}

export default SocketClient;