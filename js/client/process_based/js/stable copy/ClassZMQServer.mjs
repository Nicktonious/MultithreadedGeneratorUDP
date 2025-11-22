import zmq from 'zeromq';
import { performance } from 'perf_hooks';
import fs from 'node:fs';
import { sleep } from './utils.mjs';

class ClockGenerator {
    constructor({ address }) {
        this.address = address;
        this.publisher = new zmq.Publisher();
        this.stopFlag = false;
        this.messageCounter = 0;
    }
    async Init() {
        await this.publisher.bind(this.address);
        console.log(`ZMQ Publisher-брокер запущен на ${this.address}`);
        await sleep(100);
        return this;
    }

    async Start(freq, limit, cb) {
        // await this.publisher.bind(`tcp://*:${this.port}`);
        await this.publisher.bind(this.address);
        await sleep(100);
        console.log(`ZMQ Publisher-брокер запущен на ${this.address}`);

        await this.Run(freq, limit, cb);
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
        let t_0 = performance.now();
        try {
            for await (const _ of this.intervalGenerator(targetInterval)) {
                if (this.stopFlag) break;

                await this.publisher.send(['clock', ++this.messageCounter]);
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

    Stop() {
        this.stopFlag = true;
    }
}

export default ClockGenerator