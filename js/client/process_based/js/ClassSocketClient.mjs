import { createSocket } from 'dgram';
/**
 * @typedef TypeSensorOpts
 * @property {string} name
 * @property {string} src "10.110.100.2:40000",
 * @property {string} dst
 * @property {number} socketIndex
 * @property {number} bufferSize
 */

class SocketClient {
    constructor(sensorInfo) {
        let [srcIp, srcPort] = sensorInfo.src.split(':');
        let [dstIp, dstPort] = sensorInfo.dst.split(':');
        this.name = sensorInfo.name;
        this.i = sensorInfo.socketIndex;
        this.srcIp = srcIp;
        this.srcPort = +srcPort;
        this.dstIp = dstIp;
        this.dstPort = +dstPort ?? 0;
        this.portBase = +sensorInfo.portBase;
        this.bufferSize = sensorInfo.bufferSize;

        this.socket = createSocket('udp4');
    }
    async Init() {
        return new Promise((res, rej) => {
            // TODO
            this.socket.bind(/*this.dstPort*/0, this.srcIp, () => {
                this.socket.setSendBufferSize(this.bufferSize);
                // socket.setRecvBufferSize(this.bufferSize);
                res();
            });
        }).then(() => {
            let { port, address } = this.socket.address();
            this.srcPort = port;
            // console.log(`${address}:${port} -> ${this.dstIp}:${this.dstPort}`);
        });
    }

    Send(data) {
        this.socket.send(data, this.dstPort, this.dstIp);
    }
}

export default SocketClient;