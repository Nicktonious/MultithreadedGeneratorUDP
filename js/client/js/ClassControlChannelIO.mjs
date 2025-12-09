import net from 'node:net';
import { EventEmitter } from 'node:events';
import { io } from 'socket.io-client';

class SysChannelIO extends EventEmitter {
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
        this.localAddress = '127.0.0.1';
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
            this.socket = io(`http://${host}:${port}`);
            this.socket.on('connect', () => {
                
                this.socket.once('error', (error) => {
                    // this.emit('error', error);
                    console.log(error);
                });

                this.socket.once('close', () => {
                    this.connected = false;
                    this.registered = false;
                    this.emit('disconnected');
                });

                this.connected = true;
                this.emit('connected');
                resolve(true);
            });


            this.socket.once('error', (error) => {
                this.connected = false;
                reject(error);
            });


        });
    }

    /**
     * Регистрация на приемнике
     * @returns {Promise<boolean>}
     */
    async Register() {
        return new Promise((res, rej) => {
            try {
                let command = {
                    com: 'register',
                    ip: this.localAddress,
                    port: this.port
                };
                // TODO timeout
                this.socket.emit('register-req', command);
                this.socket.on('register-res', msg => {
                    console.log(msg);
                    this.registered = true;
                    res(true);
                });

            } catch (error) {
                this.registered = false;
                rej(error);
            }
        });
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

        this.socket.emit('packets', command);
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

        this.socket.emit('drypackets', command);
    }

    /**
     * Включение/выключение Round Robin
     * @param {boolean} enable - Флаг включения Round Robin
     * @returns {Promise<boolean>}
     */
    async RoundRobin(enable) {
        return new Promise((res, rej) => {
            try {
                const command = {
                    com: 'roundrobin',
                    rr: enable ? 1 : 0
                };
                this.socket.emit('roundrobin-req', command);
                this.socket.once('roundrobin-res', msg => {
                    // return res?.com === 'scheduled';
                    res(true);
                });

            } catch (error) {
                rej(error);
            }
        });
    }

    /**
     * Запуск основного цикла работы
     * @param {Object} config - Конфигурация датчиков
     * @returns {Promise<boolean>}
     */
    async Start(config = {}) {
        return new Promise((res, rej) => {
            try {
                const command = {
                    com: 'start',
                    config
                };
                this.socket.emit('start-req', command);
                this.socket.once('start-res', msg => {
                    // msg?.com === 'started');
                    res(true);
                });
            } catch (error) {
                rej(error);
            }
        });
    }

    /**
     * Остановка основного цикла работы
     * @returns {Promise<boolean>}
     */
    async Stop() {
        const command = {
            com: 'stop'
        };
        return new Promise((res, rej) => {
            try {
                this.socket.emit('stop-req', command);
                this.socket.once('stop-res', () => {
                    // return res?.com === 'stopped';
                    res(true);
                })
            } catch (error) {
                rej(error);
            }
        });
    }
    /**
     * Закрытие соединения
     */
    Close() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.connected = false;
        this.registered = false;
    }

    /**
     * Проверка состояния подключения
     * @returns {boolean}
     */
    IsConnected() {
        return this.socket.connected;
    }

    /**
     * Проверка состояния регистрации
     * @returns {boolean}
     */
    IsRegistered() {
        return this.registered;
    }
}

export default SysChannelIO;