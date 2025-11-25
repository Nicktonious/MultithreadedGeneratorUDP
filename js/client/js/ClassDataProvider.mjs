import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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
    constructor() {
    }

    /**
     * @method
     * @description Выполняет распаковку zip архива через exec
     * @param {string} zipFilePath 
     * @returns {string}
     */
    ExtractZipArchive(zipFilePath, extractPath) {
        const removeExtension = (filename) => {
            const lastDotIndex = filename.lastIndexOf('.');
            if (lastDotIndex === -1) {
                return filename;
            }
            return filename.substring(0, lastDotIndex);
        }
        try {

            const archiveName = removeExtension(zipFilePath);
            const fullExtractPath = path.join(extractPath, archiveName);

            if (!fs.existsSync(fullExtractPath)) {
                fs.mkdirSync(fullExtractPath, { recursive: true });
            }

            const command = process.platform === 'win32'
                ? `powershell -command "Expand-Archive -Path '${zipFilePath}' -DestinationPath '${fullExtractPath}'"`
                : `unzip -o "${zipFilePath}" -d "${fullExtractPath}"`;

            console.log(`Extracting ${zipFilePath} to ${fullExtractPath}...`);

            execSync(command);

            console.log(`Successfully extracted to ${fullExtractPath}`);
            return fullExtractPath;

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
    ExtractAndReadZip(zipFilePath, extractPath) {
        let fullExtractPath = '';
        try {

            fullExtractPath = this.ExtractZipArchive(zipFilePath, extractPath);
            const files = this.ReadAllFiles(fullExtractPath);

            console.log(`Found ${files.length} files in ${fullExtractPath}`);
            return files;

        } catch (error) {
            console.error('Error in extractAndReadZip:', error);
            throw error;
        } /*finally {
            if (fullExtractPath.length) this.CleanupTempFiles(fullExtractPath);
        }*/
    }

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

    GetFullExtractPath(zipFilePath, extractPath) {
        hiveName = path.basename(zipFilePath, '.zip');
        const fullExtractPath = path.join(extractPath, archiveName);
    }
}

export default DataProvider;