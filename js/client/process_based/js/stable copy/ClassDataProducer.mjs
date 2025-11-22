import { DataStream } from "./ClassDataStream.mjs";

/**
 * @typedef DataSource
 * @property {string} name 
 * @property {DataStream} dataStream 
 */

/**
 * @class
 */
class DataProducer {
    /**
     * @constructor
     * @param {[DataSource]} sources 
     */
    constructor(sources) {
        this.sources = sources;
    }

    Run() {
        // Периодический сбор пакетов
        let data = this.sources.map(({ name, dataStream }) => dataStream.read());
        let i = 0;
        setInterval(async () => {
            for (const packets of data) {
                await sock.send([name, packet]);
            }
        }, periodMs);
    }
}