import { Transform } from "stream";

class MultiplexerTransform extends Transform {
    constructor(numStreams) {
        super({ readableObjectMode: true });
        this.numStreams = numStreams;
        this.buffers = Array.from({ length: numStreams }, () => []);
    }

    attachStream(index, stream) {
        stream.on("data", (packet) => {
            this.buffers[index].push(packet);
            this.tryEmit();
        });
    }

    tryEmit() {
        if (this.buffers.every((buf) => buf.length > 0)) {
            const packets = this.buffers.map((buf) => buf.shift());
            this.push(packets);
        }
    }

    _transform(chunk, encoding, callback) {
        callback(); // не используем
    }
}

export default MultiplexerTransform;
