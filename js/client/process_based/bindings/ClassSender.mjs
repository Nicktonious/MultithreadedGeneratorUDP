import { performance } from 'node:perf_hooks';
import zmq from 'zeromq';
import SocketClient from './ClassSocketClient.mjs';
import crypto from 'crypto';
import { getIncrIPCAddress } from './utils.mjs';

/**
 * @typedef TypeSensorOpts
 * @property {string} name
 * @property {string} src "10.110.100.2:40000",
 * @property {string} dst
 * @property {number} socketIndex
 * @property {number} bufferSize
 */

/**
 * @typedef TypeWorkArgs 
 * @property {string} groupName
 * @property {number} packetSize
 * @property {TypeSensorOpts} sensors
 * @property {number} baseCPUIndex,
 * @property {number} threadIndex
*/

class Sender {
    clients = null;
    /**
     * @constructor
     * @param {TypeWorkArgs} workerData 
     * @param {string} clockAddress 
     */
    constructor(workerData, clockAddress, dataAddress) {
        this.workerData = workerData;
        this.clockAddress = clockAddress;
        this.dataAddress = dataAddress;
        this.dataSub = null;
        this.clockSub = null;
        this.messageCount = 0;
        this.ticks = 0;
        this.packetSize = workerData.packetSize;
    }

    Connect() {
        this.clockSub = new zmq.Subscriber();
        this.clockSub.connect(this.clockAddress);
        this.clockSub.subscribe('clock');

        this.dataSub = new zmq.Pull();
        this.dataSub.connect(this.dataAddress);

        console.log(`[Sender] ZMQ Sub подключен к ${this.clockAddress}, ${this.dataAddress}`);
    }

    async Run({ targetSpeed, isMaxSpeed }) {
        await this.Init()
        this.Connect();
        return isMaxSpeed ? this.RunMaxSpeed() : this.RunFixedSpeed({ targetSpeed });
    }

    async Init() {
        const { sensors } = this.workerData;
        try {
            await this.InitClients(sensors);
        } catch (e) {
            console.log(e);
        }
    }

    async InitClients(sensors) {
        this.clients = sensors.map((sensorInfo, i) => new SocketClient(sensorInfo));
        return Promise.all(this.clients.map(client => client.Init()));
    }

    async * ThrottledIndexGen(delayMs) {
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

        let payload = crypto.randomBytes(this.packetSize * this.clients.length);

        this.late = 0;
        for await (let _ of this.clockSub) {
            let t0 = performance.now();
            for (let i = 0; i < this.clients.length; i++) {
                this.clients[i].Send(payload.subarray(i, i + this.packetSize));
                this.messageCount += 1;
            }
            for (let i = 0; i < payload.length; i += this.packetSize) {
                payload.writeUint32BE(this.ticks, i);
            }

            this.ticks++;
            if ((performance.now() - t0)*1000 > 100) this.late++;
        }

        // await Promise.all([handleData(), handleTick()]);
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