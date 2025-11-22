import fs from 'fs'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PacketizerTransform } from "./ClassDataStream.mjs";
import MultiplexerTransform from "./ClassMultiplexStream.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log(__filename);
const packetSize = 10;
const files = ["file1.bin", "file2.bin", "file3.bin"];

const multiplexer = new MultiplexerTransform(files.length);

files.forEach((file, i) => {
    const packetizer = new PacketizerTransform(packetSize);
    fs.createReadStream(`${__dirname}/${file}`).pipe(packetizer);
    multiplexer.attachStream(i, packetizer);
});

multiplexer.on("data", async (packets) => {
    // У всех пакетов одинаковый counter

    for (let i = 0; i < packets.length; i++) {
        const counter = packets[0].readUInt32BE(0);
        console.log(`topic${i}`, counter);
    }
});
