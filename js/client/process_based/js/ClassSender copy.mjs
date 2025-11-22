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

    async RunBrokerSpeed() {
        await this.Init();
        this.Connect();

        let payload = crypto.randomBytes(this.packetSize);

        for await (let _ of this.clockSub) {
            for (let i = 0; i < this.clients.length; i++) {
                this.clients[i].Send(payload);
                this.messageCount += 1;
            }
            this.ticks += 1;
            
        }
    }
}

export default Sender;