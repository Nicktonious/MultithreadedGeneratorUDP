import zmq from 'zeromq';
import { performance } from 'perf_hooks';
import fs from 'node:fs';
import { getIncrIPCAddress, sleep } from './utils.mjs';
import crypto from 'crypto';
import { ChildProcess } from 'node:child_process';

class DataAsm {
    constructor(workerData, clockAddress, dataAddress) {
        this.clockAddress = clockAddress;
        this.dataAddress = dataAddress;
        this.workerData = workerData;

        this.clockSub = new zmq.Subscriber();
        this.dataPub = new zmq.Push();

        this.sensorsInfo = workerData.sensors;
        this.stopFlag = false;
        this.messageCounter = 0;
    }

    async Init() {
        this.clockSub.connect(this.clockAddress);
        this.clockSub.subscribe('clock');

        this.dataPub.bind(this.dataAddress);
        console.log(`[ASM] ZMQ Sub подключен к ${this.clockAddress}, ZMQ Pub подключен к ${this.dataAddress}`);
        await sleep(100);
        return this;
    }

    /**
     * 
     * @param {*} freq 
     * @param {ChildProcess} child 
     */
    async Run({ packetSize }) {
        let n = this.workerData.sensors.length;
        let payload = crypto.randomBytes(packetSize*n);
        // payload.writeUint32BE(this.messageCounter);
        // let arr = Array(this.workerData.sensors.length).fill(payload);

        this.t_0 = performance.now();
        try {
            for await (const _ of this.clockSub) {
                // if (this.stopFlag) break;
                await this.dataPub.send(payload);
                
                ++this.messageCounter;
                for (let i = 0; i < 8000*n; i+=8000) payload.writeUint32BE(this.messageCounter, i);
                this.t_1 = performance.now();
                // TODO check max uint32 value
            }
            console.log(`Interval worktime: ${(performance.now() - t_0) / 1000} seconds`);
        } catch (e) {
            console.log(e);
        }
    }

    Stop() {
        this.stopFlag = true;
    }
}

export default DataAsm