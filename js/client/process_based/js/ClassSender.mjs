import { performance } from 'node:perf_hooks';
import zmq from 'zeromq';
import SocketClient from './ClassSocketClient.mjs';
import buffer from 'node:buffer';
import net from 'net';
import crypto from 'crypto';
/*
    serverAddress
    sockets
    threadIndex
    baseCPUIndex
    packetSize
*/

class Sender {
    clients = null;
    constructor(workerData, brokerAddress) {
        this.workerData = workerData;
        this.brokerAddress = brokerAddress;
        this.subscriber = null;
        this.messageCount = 0;
        this.ticks = 0;
        this.packetSize = workerData.packetSize;
    }

    Connect() {
        this.subscriber = new zmq.Subscriber();
        // console.log(`trying connect to tcp://localhost:${this.port}`);
        // this.subscriber.connect(`tcp://localhost:${this.port}`);
        this.subscriber.connect(this.brokerAddress);
        this.subscriber.subscribe('clock');
        console.log(`ZMQ Subscriber подключен к ${this.brokerAddress}`);
    }

    async Run({ targetSpeed, isMaxSpeed }) {
        await this.Init()
        this.Connect();
        return (isMaxSpeed) ? this.RunMaxSpeed() : this.RunFixedSpeed({ targetSpeed });
    }

    async Init() {
        const { serverAddress, sockets: socketsInfo } = this.workerData;
        try {
            await this.InitClients(socketsInfo, serverAddress);
        } catch (e) {
            console.log(e);
        }
        // console.log(`inited ${this.clients.length} clients`);
    }

    async InitClients(socketsInfo, serverAddress) {
        this.clients = socketsInfo.map((socketInfo, i) => new SocketClient(socketInfo, serverAddress));
        return Promise.all(this.clients.map(client => client.Init()));
    }

    async * ThrottledIndexGen(delayMs, timeoutMs) {
        while (!this.stopFlag) {
            const t1 = performance.now();
            yield 0;
            while (performance.now() - t1 < delayMs) {
                await new Promise(resolve => setImmediate(resolve));
            }
        }
    }

    /**
     * Рассчитывает период между вызовами и количество операций за итерацию
     * @param {number} iterationsPerSecond - Количество итераций в секунду
     * @returns {Object} { period: number, k: number }
     */
    CalculateTiming(iterationsPerSecond) {
        const MIN_PERIOD = 0.1; // Минимальный допустимый период в миллисекундах
        const MULTIPLIER = 10;   // Во сколько раз увеличиваем период при агрегации

        // Базовый расчет периода
        let period = 1000 / iterationsPerSecond;
        let k = 1;

        // Если период слишком мал, увеличиваем его и вычисляем k
        if (period < MIN_PERIOD) {
            const ratio = MIN_PERIOD / period;
            k = Math.ceil(ratio / MULTIPLIER) * MULTIPLIER;
            period = (1000 / iterationsPerSecond) * k;
        }

        return { period, k };
    }

    async RunBrokerSpeed() {
        await this.Init();
        this.Connect();

        let payload = crypto.randomBytes(this.packetSize-60-8);
        for await (const [topic, msg] of this.subscriber) {
            for (let i = 0; i < this.clients.length; i++) {
                this.clients[i].Send(payload);
                this.messageCount += 1;
            }
            this.ticks += 1;
        }
    }

    async RunFixedSpeed({ targetSpeed }) {
        let { period, k } = this.CalculateTiming(Math.round(targetSpeed));
        console.log(`[INFO] Send ${targetSpeed * k} packets with period ${period.toFixed(4)} ms`);

        for await (let i of this.ThrottledIndexGen(period)) {
            for (let j = 0; j < k; j++) {
                this.clients[i].send();
            }
        }
        console.log('done');
        this.GracefulShutDown();
    }

    async RunTriangleSpeed({ targetSpeed }) {
        const T = 60 * 1000;
        let { period, k } = this.CalculateTiming(Math.round(targetSpeed));
        console.log(`[INFO] Send ${targetSpeed * k} packets with period ${period.toFixed(4)} ms`);
        let intervalPeriod = 20;
        let intervalCounter = 0;
        let skipCounter = 0;
        let skipRatio = 1;
        let maxAchieved = false;

        let interval = setInterval(() => {
            intervalCounter = (intervalCounter * intervalPeriod <= T) ? intervalCounter + 1 : 0;
            if (intervalCounter == 0) {
                skipCounter = 0;
            }
            if (!maxAchieved) {
                skipRatio = 1 - this.#TriangleWave(intervalCounter * intervalPeriod, T);
                if (skipRatio == 0) {
                    maxAchieved = true;
                    clearInterval(interval);
                }
            }
        }, intervalPeriod);

        for await (let i of this.ThrottledIndexGen(period)) {
            for (let j = 0; j < k; j++) {
                if (maxAchieved || Math.random() > skipRatio) {
                    this.clients[i].send();
                }
            }
        }
        console.log('done');
        this.GracefulShutDown();
    }

    #TriangleWave(t, T) {
        const phase = t % T;
        return phase < T / 2
            ? (2 * phase) / T       // рост от 0 до 1
            : 2 * (1 - phase / T);  // спад от 1 до 0
    }

    async RunMaxSpeed() {
        const period = 0.01;
        const k = 1;

        for await (let i of this.ThrottledIndexGen(period)) {
            for (let j = 0; j < k; j++) {
                this.clients[i].send();
            }
        }
        console.log('done');
        this.GracefulShutDown();
    }

    SendMetaMsg(data) {
        this.sysChannel?.write(JSON.stringify({ timestamp: performance.now(), data }));
    }
    ConsoleShow(stdout) {
        process.stdout.write(`\r${stdout}`); // \r возвращает каретку в начало строки
    }
    StartGracefulShutDown() {
        console.log(`Start shutdown`);
        this.stopFlag = true;
    }
    GracefulShutDown() {
        console.log(`Shutdown`);
        this.clients?.forEach(({ socket }) => {
            socket.close();
        });

        console.log(`Sent from each socket:\n${JSON.stringify(this.sent)}\nTotal: ${this.sent?.reduce((c, p) => c + p, 0)}`);
    }
}

export default Sender;