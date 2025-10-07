import zmq from 'zeromq';
import { performance } from 'perf_hooks';
import fs from 'node:fs';
import { sleep } from './utils.mjs';
import DataProvider from './ClassDataProvider.mjs';

class ZMQPublisher {
    constructor({ address }) {
        this.address = address;
        this.publisher = new zmq.Publisher();
    }
    async Init() {
        await this.publisher.bind(this.address);
        console.log(`ZMQ Publisher-брокер запущен на ${this.address}`);
        await sleep(100);
        return this;
    }
}

class DataGenerator {
    constructor({ config, address }) {
        this.address = address;
        this.publisher = new zmq.Publisher();
        this.dataProvider = DataProvider(config);
        this.stopFlag = false;
        this.messageCounter = 0;
    }

    /**
     * @description Запускает ZMQ Publisher и инициализирует DataProvider
     * @returns 
     */
    async Init() {
        await this.publisher.bind(this.address);
        console.log(`ZMQ Publisher-брокер запущен на ${this.address}`);
        await this.dataProvider.Init();
        // this.dataProvider.
        await sleep(100);
        return this;
    }

    /**
     * Генератор, который пытается выдерживать заданную паузу,
     * отдавая управление циклу событий с помощью setImmediate.
     * @param {number} delayMicroseconds - Желаемая задержка в микросекундах.
     */
    async *intervalGenerator(delayMicroseconds) {
        const delayMs = delayMicroseconds / 1000;
        let t_0 = performance.now();
        let t_1 = t_0 + delayMs;
        let t_2 = t_1 + delayMs;

        while (!this.stopFlag) {
            yield;
            await new Promise(resolve => setImmediate(resolve));
            // Ожидание с постоянным возвратом управления Event Loop
            while ((t_1 = performance.now()) - t_0 < delayMs) { }
            t_0 = t_1;
            t_1 = t_2;
            t_2 += delayMs;
        }
    }

    async Run(freq, limit=Number.MAX_SAFE_INTEGER, cb=()=>{}) {
        const targetInterval = 1/freq *1000 * 1000; // Целевой интервал в микросекундах
        console.log(`Целевой интервал: ${targetInterval} мкс`);

        let groups  = this.dataProvider.GetData();
        let counters = {};

        let t_0 = performance.now();
        try {
            for await (const groupName of this.intervalGenerator(targetInterval)) {
                for (let { names, matrix } of groups[groupName]) {
                    let i = counters[groupName];
                    matrix[i].forEach(async (packet, j) => await this.publisher.send([names[j], packet]));
                    i++
                    for (let packet of matrix[i]) packet.writeUInt32BE(i, 20);
                }

                if (this.stopFlag) break;

                if (this.messageCounter >= limit) {
                    console.log(this.messageCounter, limit);
                    cb();
                    break;
                }
            }
            console.log(`Interval worktime: ${(performance.now()-t_0)/1000} seconds`);
        } catch (e) {
            console.log(e);
        }
    }

    SendData() {

    }

    Stop() {
        this.stopFlag = true;
    }
}

export default DataGenerator