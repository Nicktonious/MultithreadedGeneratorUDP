import net from 'node:net';
import { EventEmitter } from 'node:events';

class SysChannel extends EventEmitter {
    constructor({ ip, port }) {
        super();
        this.socket = null;
        this.host = ip;
        this.port = port;
        this.connected = false;
        this.registered = false;
        this.handlers = new Map();
        this.messageId = 0;
        this.buffer = '';
        this.localAddress = '10.120.100.52';
    }

    /**
     * Подключение к приемнику
     * @param {string} host - IP адрес приемника
     * @param {number} port - Порт приемника
     * @returns {Promise<boolean>}
     */
    async Connect(host = this.host, port = this.port) {
        return new Promise((resolve, reject) => {
            this.host = host;
            this.port = port;
            this.socket = net.createConnection({ localAddress: this.localAddress, host, port }, () => {
                this.connected = true;
                this.emit('connected');
                resolve(true);
            });

            this.socket.on('data', (data) => {
                this._handleData(data);
            });

            this.socket.on('error', (error) => {
                this.connected = false;
                this.emit('error', error);
                reject(error);
            });

            this.socket.on('close', () => {
                this.connected = false;
                this.registered = false;
                this.emit('disconnected');
            });

            // Настройка сокета для получения целых сообщений
            this.socket.setNoDelay(true);
        });
    }

    /**
     * Обработка входящих данных
     * @param {Buffer} data - Входящие данные
     * @private
     */
    _handleData(data) {
        this.buffer += data.toString();

        // Обрабатываем все полные JSON сообщения в буфере
        let boundary;
        while ((boundary = this.buffer.indexOf('}')) !== -1) {
            const messageStr = this.buffer.substring(0, boundary + 1);
            this.buffer = this.buffer.substring(boundary + 1);

            try {
                const message = JSON.parse(messageStr);
                this._processMessage(message);
            } catch (error) {
                console.error('Error parsing message:', error, 'Data:', messageStr);
            }
        }
    }

    /**
     * Обработка полученного сообщения
     * @param {Object} message - Сообщение в формате JSON
     * @private
     */
    _processMessage(message) {
        console.log(`receive: ${JSON.stringify(message)}`);
        this.emit('message', message);

        for (const cb of this.handlers.values()) {
            if (cb(message)) break;
        }
    }

    /**
     * Отправка команды с ожиданием ответа
     * @param {Object} command - Команда для отправки
     * @param {number} timeout - Таймаут ожидания ответа в мс
     * @returns {Promise<Object>}
     * @private
     */
    async _sendCommandWithResponse(command, handler, timeout = 500) {
        if (!this.connected) {
            throw new Error('Not connected to receiver');
        }

        return new Promise((resolve, reject) => {
            const handlerInd = this.messageId++;
            const deleteHandler = () => this.handlers.delete(handlerInd);
            const timer = setTimeout(() => {
                deleteHandler();
                reject(new Error(`Timeout waiting for response`));
            }, timeout);

            this.handlers.set(handlerInd, (msg) => {
                if (handler(msg)) {
                    clearTimeout(timer);
                    setImmediate(() => { deleteHandler(); });
                    resolve(msg);
                }
            });

            this._sendRaw(JSON.stringify(command));
        });
    }

    /**
     * Отправка команды без ожидания ответа
     * @param {Object} command - Команда для отправки
     * @private
     */
    _sendCommandWithoutResponse(command) {
        if (!this.connected) {
            throw new Error('Not connected to receiver');
        }

        this._sendRaw(JSON.stringify(command));
    }

    /**
     * Отправка сырых данных
     * @param {string} data - Данные для отправки
     * @private
     */
    _sendRaw(data) {
        this.socket.write(data);
    }

    /**
     * Запрос регистрации (приватный)
     * @param {string} ip - IP адрес для обратного подключения
     * @param {number} port - Порт для обратного подключения
     * @returns {Promise<Object>}
     * @private
     */
    async _registerReq(handler) {
        const command = {
            com: 'register',
            ip: this.localAddress,
            port: this.port
        };

        return this._sendCommandWithResponse(command, handler);
    }

    /**
     * Регистрация на приемнике
     * @returns {Promise<boolean>}
     */
    async Register() {
        try {
            let msg = await this._registerReq(msg => msg?.status === 'running');
            this.registered = true;
            return true;
        } catch (error) {
            this.registered = false;
            throw error;
        }
    }

    /**
     * Инкрементирование счетчика пакетов
     * @param {number} packetsSend - Количество переданных пакетов
     */
    Packets(packetsSend) {
        const command = {
            com: 'packets',
            packets_send: packetsSend
        };

        this._sendCommandWithoutResponse(command);
    }

    /**
     * Инкрементирование счетчика пакетов с выводом статистики
     * @param {number} packetsSend - Количество переданных пакетов
     */
    DryPackets(packetsSend) {
        const command = {
            com: 'drypackets',
            packets_send: packetsSend
        };

        this._sendCommandWithoutResponse(command);
    }

    /**
     * Запрос Round Robin (приватный)
     * @param {boolean} enable - Флаг включения Round Robin
     * @returns {Promise<Object>}
     * @private
     */
    async _roundrobinReq(enable) {
        const command = {
            com: 'roundrobin',
            rr: enable ? 1 : 0
        };

        return this._sendCommandWithResponse(command);
    }

    /**
     * Включение/выключение Round Robin
     * @param {boolean} enable - Флаг включения Round Robin
     * @returns {Promise<boolean>}
     */
    async RoundRobin(enable) {
        try {
            let res = await this._roundrobinReq(enable);
            return res?.com === 'scheduled';
        } catch (error) {
            return false;
        }
    }

    /**
     * Запрос запуска (приватный)
     * @param {Object} config - Конфигурация датчиков
     * @returns {Promise<Object>}
     * @private
     */
    async _startReq(config = {}, handler) {
        const command = {
            com: 'start',
            config
        };

        return this._sendCommandWithResponse(command, handler, 1000);
    }

    /**
     * Запуск основного цикла работы
     * @param {Object} config - Конфигурация датчиков
     * @returns {Promise<boolean>}
     */
    async Start(config = {}) {
        try {
            await this._startReq(config, msg => msg?.com === 'started');

        } catch (error) {
            throw error;
        }
    }

    /**
     * Запрос остановки (приватный)
     * @returns {Promise<Object>}
     * @private
     */
    async _stopReq() {
        const command = {
            com: 'stop'
        };

        return this._sendCommandWithResponse(command, msg => msg?.com == 'stopped');
    }

    /**
     * Остановка основного цикла работы
     * @returns {Promise<boolean>}
     */
    async Stop() {
        try {
            let res = await this._stopReq();
            return res?.com === 'stopped';
        } catch (error) {
            return false;
        }
    }

    /**
     * Закрытие соединения
     */
    Close() {
        if (this.socket) {
            this.socket.end();
            this.socket.destroy();
            this.socket = null;
        }
        this.connected = false;
        this.registered = false;
        this.handlers.clear();
    }

    /**
     * Проверка состояния подключения
     * @returns {boolean}
     */
    IsConnected() {
        return this.connected;
    }

    /**
     * Проверка состояния регистрации
     * @returns {boolean}
     */
    IsRegistered() {
        return this.registered;
    }
}

export default SysChannel;