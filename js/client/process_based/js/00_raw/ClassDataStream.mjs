// ClassDataStream.mjs
import { Transform } from 'node:stream';

/**
 * PacketizerTransform
 * - Разбивает входной поток на пакеты фиксированного размера.
 * - Вписывает counter (uint32BE) в пакет по заданному offset'у.
 * - Кольцевой буфер с контролируемой буферизацией.
 * - Без «затыкания» .end(): не использовать имена свойств, совпадающие с методами Stream!
 */
export class PacketizerTransform extends Transform {
    /**
     * @param {Object} opts
     * @param {number} opts.packetSize                 - размер пакета в байтах (обязателен)
     * @param {number} [opts.counterOffset=0]          - смещение для writeUInt32BE(counter, offset)
     * @param {number} [opts.bufferSize=1024]          - размер кольцевого буфера
     * @param {boolean} [opts.zeroCopy=true]          - попытаться отдавать пакеты без копирования (если не пересекают границу буфера)
     */
    constructor({ packetSize, counterOffset = 0, bufferSize = 1024, zeroCopy = true } = {}) {
        if (!Number.isInteger(packetSize) || packetSize <= 0) {
            throw new Error('packetSize must be a positive integer');
        }
        super({ readableObjectMode: false, writableObjectMode: false });

        this.packetSize = packetSize;
        this.counterOffset = counterOffset;
        this.zeroCopy = !!zeroCopy;

        this.bufferSize = bufferSize;
        this.ring = Buffer.allocUnsafe(this.bufferSize);

        this.readPos = 0;   // указатель чтения из кольца
        this.writePos = 0;  // указатель записи в кольцо
        this.available = 0; // сколько байт данных лежит в кольце

        this.counter = 0;
    }

    _transform(chunk, enc, cb) {
        try {
            let offset = 0;

            while (offset < chunk.length) {
                // сколько можем записать за раз до конца буфера
                const canWriteLinear = Math.min(this.bufferSize - this.writePos, chunk.length - offset);
                chunk.copy(this.ring, this.writePos, offset, offset + canWriteLinear);

                this.writePos = (this.writePos + canWriteLinear) % this.bufferSize;
                this.available += canWriteLinear;
                offset += canWriteLinear;

                // формируем пакеты, пока хватает байт
                while (this.available >= this.packetSize) {
                    const start = this.readPos;
                    const end = (this.readPos + this.packetSize) % this.bufferSize;

                    let packet;

                    // Если пакет не пересекает границу кольца — можно zero-copy (subarray)
                    if (this.zeroCopy && start + this.packetSize <= this.bufferSize) {
                        packet = this.ring.subarray(start, start + this.packetSize);
                    } else {
                        // иначе — один раз склеим
                        packet = Buffer.allocUnsafe(this.packetSize);
                        if (start + this.packetSize <= this.bufferSize) {
                            this.ring.copy(packet, 0, start, start + this.packetSize);
                        } else {
                            const firstPart = this.bufferSize - start;
                            this.ring.copy(packet, 0, start, this.bufferSize);
                            this.ring.copy(packet, firstPart, 0, this.packetSize - firstPart);
                        }
                    }

                    // Пишем счетчик
                    // packet.writeUInt32BE(this.counter, this.counterOffset);

                    // ВНИМАНИЕ: если zeroCopy=true и пакет — это subarray кольца,
                    // мы модифицируем память кольца. Не перезаписывайте эти байты,
                    // пока downstream не примет (Node сам притормозит по backpressure).
                    this.push(packet);

                    this.counter += 1;
                    this.readPos = (this.readPos + this.packetSize) % this.bufferSize;
                    this.available -= this.packetSize;
                }
            }

            cb();
        } catch (e) {
            cb(e);
        }
    }

    _flush(cb) {
        try {
            // В требованиях — "дискретные пакеты". Хвост (< packetSize) выбрасываем.
            this.available = 0;
            this.readPos = this.writePos;
            cb();
        } catch (e) {
            cb(e);
        }
    }
}
