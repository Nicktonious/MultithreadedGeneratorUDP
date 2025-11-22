import fs from 'fs';
import path from 'path';
import { exec, execSync } from 'child_process';

/**
 * @typedef TypeFile
 * @property {string} fileName
 * @property {string} data
 * @property {string} fullPath
 * @property {string} size
 */

/**
 * @typedef TypeGroup
 * @property {string} name: "s",
 * @property {string} path: "js/client/process_based/js/s.zip",
 * @property {number} freq: 10, // 10 Hz
 * @property {number} packetSize: 1
 * @property {[Buffer]} packets
 */

class DataProvider {
    constructor(config) {
        this.config = config;
        this.sensorsData = {};
        this.intervals = {};
        this.iterationCounters = {};
    }

    // 1. Функция для распаковки zip архива через exec
    /**
     * 
     * @param {string} zipFilePath 
     * @returns {string}
     */
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

    /**
     * @description Функция для рекурсивного чтения всех файлов из директории
     * @param {string} directoryPath 
     * @returns {[TypeFile]}
     */
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

    /**
     * @description Комбинированная функция: распаковать и прочитать все файлы
     * @param {string} zipFilePath 
     * @returns {[TypeFile]}
     */
    ExtractAndReadZip(zipFilePath) {
        let extractPath = '';
        try {
            // Распаковываем архив
            extractPath = this.ExtractZipArchive(zipFilePath);

            // Читаем все файлы из распакованной директории
            const files = this.ReadAllFiles(extractPath);

            console.log(`Found ${files.length} files in ${extractPath}`);
            return files;

        } catch (error) {
            console.error('Error in extractAndReadZip:', error);
            throw error;
        } finally {
            if (extractPath.length) this.CleanupTempFiles(extractPath);
        }
    }

    // 4. Функция для очистки временных файлов
    async CleanupTempFiles(extractPath) {
        try {
            if (fs.existsSync(extractPath)) {
                await fs.promises.rm(extractPath, { recursive: true, force: true });
                console.log(`Cleaned up: ${extractPath}`);
            }
        } catch (error) {
            console.warn('Could not clean up temp files:', error);
        }
    }

    /**
     * @description Метод для разбивки данных на пакеты
     * @param {Buffer} data 
     * @param {number} packetSize 
     * @returns 
     */
    splitIntoPackets(data, packetSize) {
        const packets = [];
        for (let i = 0; i < data.length; i += packetSize) {
            packets.push(data.subarray(i, i + packetSize));
        }
        return packets;
    }
    
    GetData() {
        return Object.fromEntries(
            Object.keys(this.sensorsData)
            .map(groupName => [groupName, this.GetPacketVectors(groupName)])
        );
    }
    /**
     * 
     * @param {string} groupName 
     * @returns {}
     */
    GetPacketVectors(groupName) {
        const groupData = this.sensorsData[groupName];
        const names = groupData.map(sensor => sensor.name);
        const sensorsCount = groupData.length;

        const matrix = new Array(groupData[0].length);

        for (let packetIndex = 0; packetIndex < maxPackets; packetIndex++) {
            const row = new Array(sensorsCount);

            for (let sensorIndex = 0; sensorIndex < sensorsCount; sensorIndex++) {
                if (packetIndex < packetsLengths[sensorIndex]) {
                    row[sensorIndex] = groupData[sensorIndex].packets[packetIndex];
                } else {
                    row[sensorIndex] = null;
                }
            }

            matrix[packetIndex] = row;
        }

        return {
            matrix: matrix,
            names: names
        };
    }

    // Метод для инициализации данных
    async Init() {
        for (const group of this.config.groups) {
            try {
                console.log(`Loading group: ${group.name}`);
                const files = this.ExtractAndReadZip(group.path);
                for (let f of files) f.packets = this.splitIntoPackets(f.data, group.packetSize);

                this.sensorsData[group.name] = files;

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

export default DataProvider;