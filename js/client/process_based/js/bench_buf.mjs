import { performance, PerformanceObserver } from 'perf_hooks';

class BufferWriteBenchmark {
    constructor(numBuffers, testDurationMicroseconds = 100) {
        this.numBuffers = numBuffers;
        this.testDurationMicroseconds = testDurationMicroseconds;
        this.buffers = [];
        this.initializeBuffers();
    }

    initializeBuffers() {
        for (let i = 0; i < this.numBuffers; i++) {
            this.buffers.push(Buffer.alloc(4)); // Каждый буфер по 4 байта для Uint32
        }
    }

    runBenchmark() {
        const startTime = performance.now();
        let operationsCount = 0;
        const targetDuration = this.testDurationMicroseconds / 1000; // Конвертируем в миллисекунды

        // Основной измерительный цикл
        while ((performance.now() - startTime) < targetDuration) {
            for (let i = 0; i < this.numBuffers; i++) {
                this.buffers[i].writeUInt32LE(operationsCount, 0);
                operationsCount++;
            }
        }

        const actualDuration = performance.now() - startTime;
        return {
            totalOperations: operationsCount,
            durationMicroseconds: actualDuration * 1000,
            operationsPerSecond: (operationsCount / actualDuration) * 1000,
            operationsPerMicrosecond: operationsCount / (actualDuration * 1000)
        };
    }

    runPreheatedBenchmark() {
        // Прогреваем JIT
        for (let i = 0; i < 1000; i++) {
            for (let j = 0; j < this.numBuffers; j++) {
                this.buffers[j].writeUInt32LE(i, 0);
            }
        }

        return this.runBenchmark();
    }
}

// Бенчмарк с разным количеством буферов
function runComprehensiveBenchmark() {
    const bufferCounts = [1, 10, 100, 1000, 10000];
    const results = [];

    console.log('🚀 Запуск бенчмарка записи в Buffer...');
    console.log('📊 Тестовая длительность: 100 микросекунд');
    console.log('='.repeat(80));

    for (const count of bufferCounts) {
        const benchmark = new BufferWriteBenchmark(count, 100);
        const result = benchmark.runPreheatedBenchmark();

        results.push({
            buffers: count,
            ...result
        });

        console.log(`📦 ${count} буферов:`);
        console.log(`   Всего операций: ${result.totalOperations.toLocaleString()}`);
        console.log(`   Фактическое время: ${result.durationMicroseconds.toFixed(3)} мкс`);
        console.log(`   Операций в секунду: ${result.operationsPerSecond.toLocaleString('ru-RU', {
            maximumFractionDigits: 0
        })} ops/sec`);
        console.log(`   Операций за 100 мкс: ${Math.round(result.operationsPerMicrosecond * 100).toLocaleString()}`);
        console.log('─'.repeat(80));
    }

    return results;
}


// Запуск бенчмарков

console.log('🔬 Бенчмарк №1: Использование performance.now()');
const hpResult = runComprehensiveBenchmark();

// console.log('\n🔬 Бенчмарк №2: Высокая точность с process.hrtime()');

// const hpResult = hpBenchmark.runHighPrecisionTest();

console.log(`📦 100 буферов (высокая точность):`);
console.log(`   Всего операций: ${hpResult.totalOperations.toLocaleString()}`);
console.log(`   Фактическое время: ${(hpResult.durationNanoseconds / 1000).toFixed(3)} мкс`);
console.log(`   Операций в секунду: ${hpResult.operationsPerSecond.toLocaleString('ru-RU', {
    maximumFractionDigits: 0
})} ops/sec`);

