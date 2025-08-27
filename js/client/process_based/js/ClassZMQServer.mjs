import zmq from 'zeromq';

// Используем performance.now() для более точных измерений времени внутри приложения
import { performance } from 'perf_hooks';

class ClockGenerator {
    constructor(port) {
        this.port = port;
        this.publisher = new zmq.Publisher();
        this.stopFlag = false;
        this.messageCounter = 0;
    }

    async Start(freq) {
        await this.publisher.bind(`ipc://zmq:${this.port}`);
        console.log(`ZMQ Publisher-брокер запущен на порту ${this.port}`);

        // Запускаем генератор в фоне, не дожидаясь его завершения
        this.Run(freq);

        // Настраиваем обработку прерывания (Ctrl+C)
        /*process.on('SIGINT', async () => {
            console.log('\nПолучен сигнал SIGINT. Завершение работы...');
            this.stopFlag = true;
            await this.publisher.close();
            // Даем небольшую паузу, чтобы цикл успел завершиться
            setTimeout(() => process.exit(0), 100);
        });*/
    }

    /**
     * Генератор, который пытается выдерживать заданную паузу,
     * отдавая управление циклу событий с помощью setImmediate.
     * @param {number} delayMicroseconds - Желаемая задержка в микросекундах.
     */
    async *intervalGenerator(delayMicroseconds) {
        const delayMs = delayMicroseconds / 1000;
        while (!this.stopFlag) {
            const startTime = performance.now();
            yield;
            // Ожидание с постоянным возвратом управления Event Loop
            while (performance.now() - startTime < delayMs) {
                // setImmediate ставит колбэк в очередь, позволяя другим
                // операциям выполниться, но вносит большую задержку.
                await new Promise(resolve => setImmediate(resolve));
            }
        }
    }

    async Run(freq) {
        const targetInterval = 1/freq *1000 * 1000; // Целевой интервал в микросекундах
        console.log(`Целевой интервал: ${targetInterval} мкс`);

        for await (const _ of this.intervalGenerator(targetInterval)) {
            if (this.stopFlag) break;

            // Отправляем текущее время в наносекундах для максимальной точности
            const message = process.hrtime.bigint().toString();
            await this.publisher.send(['clock', message]);
            this.messageCounter++;
        }
    }
    Stop() {
        this.stopFlag = true;
    }
}

export default ClockGenerator