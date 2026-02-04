import zmq from 'zeromq';
import { sleep } from './utils.mjs';
import { EventEmitter } from 'node:events';

class StatsSender {
    constructor({ address, id }) {
        this.address = address;
        this.publisher = new zmq.Publisher();
        this.topicName = `${id}/tx`;
    }
    async Init() {
        await this.publisher.bind(this.address);
        console.log(`ZMQ Publisher-брокер запущен на ${this.address}`);
        await sleep(100);
        return this;
    }

    async Send(txPackets) {
        this.publisher.send([this.topicName, txPackets]);
    }
}

class StatsReceiver extends EventEmitter {
    constructor(processes) {
        super();
        this.processes = processes;
        this.packets = Array(processes.length);
        this.packetsUpd = Array(processes.length).fill(false);
        // this.on('packetsReady', () => console.log(`statsReady`));
    }

    #PacketsReady() {
        return this.packetsUpd.indexOf(false) == -1;
    }

    Start() {
        this.processes.forEach((child, i) => {
            child.on('message', msg => {
                // console.log(msg);
                if (msg.com == 'tx_packets') {
                    this.packets[i] = +msg.value;
                    this.packetsUpd[i] = true;
                }
                // console.log(this.packetsUpd);
                if (this.#PacketsReady()) this.emit('statsReady');
            });
        });
        return this;
    }
    async GetStats() {
        return 0;
        return new Promise((res, rej) => {
            if (this.#PacketsReady()) res(this.packets.map(p => p));
            this.once('statsReady', () => {
                res(this.packets.map(p => p));
            });
        });

    }
}

export { StatsReceiver }