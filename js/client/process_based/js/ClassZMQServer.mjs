import zmq from 'zeromq';
import { performance } from 'perf_hooks';
import fs from 'node:fs';
import { getIncrIPCAddress, sleep } from './utils.mjs';
import crypto from 'crypto';

class ClockGenerator {
    constructor({ address, n, m }) {
        this.address = address;
        // this.publisher = new zmq.Push();
        console.log(n, m);
        this.publisher = new zmq.Publisher();

        this.n = n;
        this.m = m;
        this.stopFlag = false;
        this.messageCounter = 0;
    }

    async Init() {
        /*const ipcDir = '/tmp/zmq_clock';
        if (!fs.existsSync(ipcDir)) {
            fs.mkdirSync(ipcDir, { recursive: true });
        }*/
        this.publisher.bind(this.address);
        console.log(`ZMQ Clock broker is bound to: ${this.address}`);

        /*const address = `ipc://${ipcDir}_${i}.ipc`;
        // const address = getIncrIPCAddress(this.address, i);
        await this.publisher.bind(address);

        // console.log(`ZMQ Publisher-брокеры запущены на ${addrArr}`);*/
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

    /*async Run(freq, limit = Number.MAX_SAFE_INTEGER, cb = () => { }) {
        const targetInterval = 1 / freq * 1000 * 1000; // Целевой интервал в микросекундах
        console.log(`Целевой интервал: ${targetInterval} мкс`);
        let t_0 = performance.now();
        let t_1;
        try {
            for await (const _ of this.intervalGenerator(targetInterval)) {
                if (this.stopFlag) { t_1 = performance.now(); break; }

                await this.publisher.send(['clock', 0]);
                ++this.messageCounter
                if (this.messageCounter >= limit) {
                    t_1 = performance.now();
                    console.log(this.messageCounter, limit);
                    cb();
                    break;
                }
            }
            console.log(`Interval worktime: ${(t_1 - t_0) / 1000} seconds`);
        } catch (e) {
            console.log(e);
        }
    }*/

    async Run(freq, limit = Number.MAX_SAFE_INTEGER, cb = () => { }) {
        const targetInterval = 1 / freq * 1000 * 1000; // Целевой интервал в микросекундах
        console.log(`Целевой интервал: ${targetInterval} мкс`);

        let t0 = performance.now();
        let t1;
        const delayMs = targetInterval / 1000;
        let t_0 = performance.now();
        let t_1 = t_0 + delayMs;
        let t_2 = t_1 + delayMs;

        while (this.messageCounter <= limit) {
            if(this.stopFlag) { t1 = performance.now(); break; }

            await this.publisher.send(['clock', '']);
            ++this.messageCounter
            if (this.messageCounter >= limit) {
                t1 = performance.now();
                console.log(this.messageCounter, limit);
                cb();
                break;
            }
            while ((t_1 = performance.now()) - t_0 < delayMs) { }
            t_0 = t_1;
            t_1 = t_2;
            t_2 += delayMs;
        }

        console.log(`Interval worktime: ${(t1 - t0) / 1000} seconds`);
        console.log(this.messageCounter, limit);
        cb();

    }

    Stop() {
        this.stopFlag = true;
    }
}

export default ClockGenerator