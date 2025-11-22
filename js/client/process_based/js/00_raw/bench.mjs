import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { once } from 'node:events';
import { performance } from 'node:perf_hooks';
import { PacketizerTransform } from './ClassDataStream.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// === CONFIG ===
const N = 3;                   // число потоков
const packetSize = 256;        // размер пакета
const counterOffset = 0;       // смещение для счетчика
const bufferMultiplier = 4096; // размер кольцевого буфера
const fileSize = 1024 * 1024 * 1024; 
// ==============

// утилита: создать бинарный файл для теста
function createTestFile(name, size) {
  if (fs.existsSync(name)) return;
  const fd = fs.openSync(name, 'w');
  const buf = Buffer.alloc(1024, 0xaa);
  let written = 0;
  while (written < size) {
    fs.writeSync(fd, buf, 0, buf.length);
    written += buf.length;
  }
  fs.closeSync(fd);
}

async function runBenchmark() {
  // создаём тестовые файлы
  const files = Array.from({ length: N }, (_, i) => `${__dirname}/bench_file${i}.bin`);
  for (const f of files) createTestFile(f, fileSize);

  // создаём N стримов
  const streams = files.map(f => {
    const packetizer = new PacketizerTransform({
      packetSize,
      counterOffset,
      bufferMultiplier,
      zeroCopy: true
    });

    fs.createReadStream(f, { highWaterMark: packetSize * bufferMultiplier })
      .pipe(packetizer);

    return packetizer[Symbol.asyncIterator]();
  });

  let iter = 0;
  let prevTime = performance.now();

  try {
    while (true) {
      // читаем по одному пакету из каждого
      const packets = await Promise.all(streams.map(s => s.next()));
      if (packets.some(p => p.done)) break;

      // latency
      const now = performance.now();
      const delta = now - prevTime;
      prevTime = now;

      // проверяем counters
      const counters = packets.map(p => p.value.readUInt32BE(counterOffset));
      const min = Math.min(...counters);
      const max = Math.max(...counters);
      if (min !== max) {
        throw new Error(`Desync detected at iter=${iter}: counters=${counters.join(',')}`);
      }

      if (iter % 1000 === 0) {
        console.log(`iter=${iter}, counter=${counters[0]}, latency=${delta.toFixed(3)} ms`);
      }

      // дополнительная проверка: всплески задержек
      if (delta > 50) {
        console.warn(`⚠️  high latency spike: ${delta.toFixed(3)} ms at iter=${iter}`);
      }

      iter++;
    }
  } finally {
    console.log('Benchmark finished, total iters:', iter);
  }
}

runBenchmark().catch(e => {
  console.error('Benchmark error:', e);
});
