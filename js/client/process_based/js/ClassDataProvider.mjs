import fs from 'fs';
import path from 'path';
import { exec, execSync } from 'child_process';

class DataProvider {
    constructor(config) {
        this.groups = config.groups;
        this.sensorsData = {};
        this.intervals = {};
        this.iterationCounters = {};
    }

    // 1. Функция для распаковки zip архива через exec
    async ExtractZipArchive(zipFilePath) {
        try {
            // Получаем имя архива без расширения для создания папки
            const archiveName = path.basename(zipFilePath, '.zip');
            const extractPath = path.join('./temp', archiveName);

            // Создаем папку для распаковки, если она не существует
            if (!fs.existsSync('./temp')) {
                fs.mkdirSync('./temp', { recursive: true });
            }

            if (!fs.existsSync(extractPath)) {
                fs.mkdirSync(extractPath, { recursive: true });
            }

            // Команда для распаковки (работает на Linux/Mac и Windows с установленным unzip)
            let command;
            if (process.platform === 'win32') {
                // Для Windows (требуется установленный 7-zip или аналоги)
                command = `powershell -command "Expand-Archive -Path '${zipFilePath}' -DestinationPath '${extractPath}'"`;
            } else {
                // Для Linux/Mac
                command = `unzip -o "${zipFilePath}" -d "${extractPath}"`;
            }

            console.log(`Extracting ${zipFilePath} to ${extractPath}...`);

            execSync(command);

            console.log(`Successfully extracted to ${extractPath}`);
            return extractPath;

        } catch (error) {
            console.error('Error extracting zip archive:', error);
            throw error;
        }
    }

    // 2. Функция для рекурсивного чтения всех файлов из директории
    async ReadAllFiles(directoryPath) {
        const files = [];

        async function traverseDirectory(currentPath) {
            try {
                const items = await fs.promises.readdir(currentPath, { withFileTypes: true });

                for (const item of items) {
                    const fullPath = path.join(currentPath, item.name);

                    if (item.isDirectory()) {
                        // Если это папка - рекурсивно обходим ее
                        await traverseDirectory(fullPath);
                    } else if (item.isFile()) {
                        // Если это файл - читаем его содержимое
                        try {
                            const data = await fs.promises.readFile(fullPath);
                            const relativePath = path.relative(directoryPath, fullPath);

                            files.push({
                                fileName: relativePath,
                                data: data,
                                fullPath: fullPath,
                                size: data.length
                            });
                        } catch (readError) {
                            console.warn(`Could not read file ${fullPath}:`, readError);
                        }
                    }
                }
            } catch (error) {
                console.error(`Error reading directory ${currentPath}:`, error);
                throw error;
            }
        }

        try {
            // Проверяем, существует ли директория
            if (!fs.existsSync(directoryPath)) {
                throw new Error(`Directory ${directoryPath} does not exist`);
            }

            const stats = await fs.promises.stat(directoryPath);
            if (!stats.isDirectory()) {
                throw new Error(`${directoryPath} is not a directory`);
            }

            await traverseDirectory(directoryPath);
            return files;

        } catch (error) {
            console.error('Error in readAllFiles:', error);
            throw error;
        }
    }

    // 3. Комбинированная функция: распаковать и прочитать все файлы
    async ExtractAndReadZip(zipFilePath) {
        let extractPath = '';
        try {
            // Распаковываем архив
            extractPath = await this.ExtractZipArchive(zipFilePath);

            // Читаем все файлы из распакованной директории
            const files = await this.ReadAllFiles(extractPath);

            console.log(`Found ${files.length} files in ${extractPath}`);
            return files;

        } catch (error) {
            console.error('Error in extractAndReadZip:', error);
            throw error;
        } finally {
            if (extractPath.length) this.cleanupTempFiles(extractPath);
        }
    }

    // 4. Функция для очистки временных файлов
    async cleanupTempFiles(extractPath) {
        try {
            if (fs.existsSync(extractPath)) {
                await fs.promises.rm(extractPath, { recursive: true, force: true });
                console.log(`Cleaned up: ${extractPath}`);
            }
        } catch (error) {
            console.warn('Could not clean up temp files:', error);
        }
    }

    // Для использования JS-only версии нужно установить:
    // npm install extract-zip

    // Метод для разбивки данных на пакеты
    splitIntoPackets(data, packetSize) {
        const packets = [];
        for (let i = 0; i < data.length; i += packetSize) {
            packets.push(data.slice(i, i + packetSize));
        }
        return packets;
    }

    // Метод для инициализации данных
    async Init() {
        for (const group of this.groups) {
            try {
                console.log(`Loading group: ${group.name}`);
                const files = await this.readZipArchive(group.path);
                
                this.sensorsData[group.name] = files.map(file => {
                    return this.splitIntoPackets(file.data, group.packetSize);
                });

                console.log(`Group ${group.name} loaded: ${files.length} sensors`);

            } catch (error) {
                console.error(`Error loading group ${group.name}:`, error);
            }
        }
    }

    // Метод для записи Uint32 в буфер по указанной позиции
    writeUint32(buffer, position, value) {
        if (position + 4 > buffer.length) {
            throw new Error('Position out of buffer bounds');
        }

        buffer.writeUInt32LE(value, position);
        return buffer;
    }

    // Метод для отправки данных (заглушка - нужно реализовать в зависимости от требований)
    send(topic, packet) {
        console.log(`Sending to ${topic}, packet size: ${packet.length} bytes`);
    }

    // Функция Start
    start() {
        for (const group of this.groups) {
            if (!this.sensorsData[group.name]) {
                console.warn(`Group ${group.name} not initialized, skipping`);
                continue;
            }

            this.iterationCounters[group.name] = 0;

            this.intervals[group.name] = setInterval(() => {
                const iteration = this.iterationCounters[group.name]++;
                const sensors = this.sensorsData[group.name];

                for (let i = 0; i < sensors.length; i++) {
                    const sensorPackets = sensors[i];

                    // Берем j-й пакет (где j = iteration % количество пакетов)
                    const packetIndex = iteration % sensorPackets.length;

                    if (packetIndex < sensorPackets.length) {
                        try {
                            // Создаем копию пакета для модификации
                            const packet = Buffer.from(sensorPackets[packetIndex]);

                            // Записываем номер итерации в позицию 20
                            const modifiedPacket = this.writeUint32(packet, 20, iteration);

                            // Отправляем преобразованный пакет
                            const topic = `${group.name}/sensor${i + 1}`;
                            this.send(topic, modifiedPacket);

                        } catch (error) {
                            console.error(`Error processing sensor ${i} in group ${group.name}:`, error);
                        }
                    }
                }

                console.log(`Group ${group.name} iteration ${iteration} completed`);

            }, 1000 / (group.freq || 1)); // freq - частота в Hz, преобразуем в интервал в ms
        }
    }

    // Метод для остановки всех интервалов
    stop() {
        for (const groupName in this.intervals) {
            clearInterval(this.intervals[groupName]);
        }
        this.intervals = {};
        this.iterationCounters = {};
        console.log('All intervals stopped');
    }
}

// Пример использования:
async function main() {
    const config = {
        groups: [
            {
                name: "s",
                path: "js/client/process_based/js/s.zip",
                freq: 10, // 10 Hz
                packetSize: 1
            }
        ]
    };

    const dataProvider = new DataProvider(config);

    try {
        // await dataProvider.initialize();
        let files = await dataProvider.ExtractAndReadZip(config.groups[0].path);
        console.log(files);

        /*dataProvider.start();
        console.log('Data provider started');

        // Остановка через 30 секунд (для примера)
        setTimeout(() => {
            // dataProvider.stop();
            // console.log('Data provider stopped');
        }, 30000);*/

    } catch (error) {
        console.error('Failed to initialize data provider:', error);
    }
}


main();
// Для использования нужно установить зависимости:
// npm install yauzl

// export default DataProvider;