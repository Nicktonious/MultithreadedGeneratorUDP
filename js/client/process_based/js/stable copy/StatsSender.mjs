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
        this.packetsUpd = Array(processes.length).fill(-1);
    }

    Start() {
        this.processes.forEach((child, i) => {
            child.on('message', msg => {
                if (msg.com == 'tx_packets') {
                    this.packets[i] = +msg.value;
                    this.packetsUpd[i] = true;
                }
                if (this.packetsUpd.indexOf(false) == -1) {
                    this.packetsUpd.fill(-1);
                }
            });
        });
    }
}

export { StatsSender, StatsReceiver }