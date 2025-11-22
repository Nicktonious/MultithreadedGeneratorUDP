import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createReadStream } from 'fs';
import { PacketizerTransform } from '../ClassDataStream.mjs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Now __dirname can be used as needed
console.log(__dirname);


const packetSize = 100;
const fileStream = createReadStream(`${__dirname}/file1.bin`, { highWaterMark: 100 });
// const streams = [1,2,3].map(v => createReadStream(`file${v}.bin`));

const packetizer = new PacketizerTransform({ packetSize, counterOffset: 0, bufferSize: 100, zeroCopy: true });

// fileStream.pipe(packetizer).on('data', (packet) => {
//     console.log('Packet length:', packet.length, 'Data:', packet.toString())
// });

fileStream.pipe(packetizer);
let t1 = performance.now();
let i = 0;
for await (const packet of packetizer) {
    let t2 = performance.now();
    process.stdout.write(`${++i}. ${t2-t1}\t\r`);
    t1 = t2;
    // console.log('Packet length:', packet.length, 'Data:', packet.toString())
};
