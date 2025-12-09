import { ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';

// { "ts":"2025-11-25 15:49:53.179918951 +04", "packets":1136, "mbytes":20, "pps":28, "mbps":0 }

class StatsReceiver extends EventEmitter {
    /**
     * @constructor
     * @param {[ChildProcess]} processes 
     */
    constructor(processes) {
        super();
        this.processes = processes;
        this.packets = 0;
    }

    Start() {
        this.processes.forEach((child, i) => {
            child.on('message', msg => {
                try {
                    const stat = JSON.parse(msg.trim());
                    if (isStatsMessage(stat)) {
                        this.packets = stat.packets;
                        if (typeof this.OnStats == 'function') 
                            this.OnStats(stat);
                    }
                } catch (error) { }
            });
        });
        return this;
    }
    OnStats(stats) {}
}

const isStatsMessage = msg => {
    if (typeof msg !== 'object') return false;
    return typeof msg.pps == 'number' && typeof msg.packets == 'number';
}

class StatsStream extends Readable {
    #ee = null;
    #packets = 0;
    constructor(child) {
        super({ objectMode: true });
        this.#ee = child
        this.#ee.on('message', (msg) => {
            try {
                const stat = JSON.parse(msg.trim());
                this.push(stat);
                if (isStatsMessage(stat))
                    this.#packets = stat.packets;
            } catch (error) { }
        });
    }

    _read() {
        // Автоматически вызывается когда потребитель готов получить данные
    }
    GetPackets() { return this.#packets; }
}

export { StatsReceiver, StatsStream }