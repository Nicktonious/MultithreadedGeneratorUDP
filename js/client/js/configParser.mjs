import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import path, { join } from "path";
import { incrementIp } from "./utils.mjs";
/**
 * @typedef {Object} SysChannel
 * @property {string} host - Адрес системного канала в формате "ip:port".
 */

/**
 * @typedef {Object} Sensor
 * @property {string} name - Имя сенсора.
 * @property {string} src - Источник данных сенсора (ip:port).
 * @property {string} [dst] - (Опционально) индивидуальный адрес назначения сенсора (ip:port).
 * @property {string} [sn] - серийный номер (может игнорироваться).
 * @property {string} [vlan] - VLAN (может игнорироваться).
 */

/**
 * @typedef {Object} Group
 * @property {string} name - Имя группы сенсоров.
 * @property {string} filesPath - Путь до zip-файла с данными сенсоров.
 * @property {boolean} loop - Режим повторного воспроизведения.
 * @property {number} [duration] - Время генерации данных (сек).
 * @property {number} freq - Частота передачи (hz).
 * @property {number} packetSize - Размер пакета.
 * @property {string} [dst] - Общий адрес назначения группы (ip:port).
 * @property {Sensor[]} sensors - Список сенсоров.
 */

/**
 * @typedef {Object} Config
 * @property {number} duration - Время работы в секундах.
 * @property {SysChannel} sysChannel - Системный канал.
 * @property {Group[]} groups - Список групп сенсоров.
 */

/**
 * Загружает конфигурацию из JSON файла.
 * @param {string} filePath - Путь к файлу конфигурации.
 * @returns {object} Объект конфигурации.
 */
function loadConfig(filePath) {
    const absPath = path.resolve(filePath);
    if (!existsSync(absPath)) {
        throw new Error(`Файл конфигурации не найден: ${absPath}`);
    }

    const rawData = readFileSync(absPath, "utf-8");
    try {
        return JSON.parse(rawData);
    } catch (err) {
        throw new Error(`Ошибка парсинга JSON: ${err.message}`);
    }
}

/**
 * Проверяет корректность конфигурации.
 * @param {Config} config - Конфигурация для проверки.
 * @returns {{valid: boolean, errors: string[]}} Результат валидации.
 */
function validateConfig(config) {
    const errors = [];

    /*if (typeof config.id !== "number") {
        errors.push("Поле 'id' должно быть числом.");
    }*/

    if (typeof config.duration !== "number" || config.duration <= 0) {
        errors.push("Поле 'duration' должно быть положительным числом.");
    }

    if (!config.sysChannel || typeof config.sysChannel.host !== "string") {
        errors.push("Поле 'sysChannel.host' обязательно и должно быть строкой.");
    }

    if (!Array.isArray(config.groups) || config.groups.length === 0) {
        errors.push("Поле 'groups' обязательно и должно содержать хотя бы одну группу.");
    } else {
        config.groups.forEach((group, gIndex) => {
            if (typeof group.name !== "string") {
                errors.push(`Group[${gIndex}]: отсутствует имя группы.`);
            }
            if (typeof group.filesPath !== "string") {
                errors.push(`Group[${gIndex}]: отсутствует filesPath.`);
            }
            if (typeof group.freq !== "number" || group.freq <= 0) {
                errors.push(`Group[${gIndex}]: некорректное значение freq.`);
            }
            if (typeof group.packetSize !== "number" || group.packetSize <= 0) {
                errors.push(`Group[${gIndex}]: некорректное значение packetSize.`);
            }

            if (!Array.isArray(group.sensors) || group.sensors.length === 0) {
                errors.push(`Group[${gIndex}]: отсутствуют сенсоры.`);
            } else {
                group.sensors.forEach((sensor, sIndex) => {
                    if (typeof sensor.name !== "string") {
                        errors.push(`Group[${gIndex}].Sensor[${sIndex}]: отсутствует имя сенсора.`);
                    }
                    if (typeof sensor.src !== "string") {
                        errors.push(`Group[${gIndex}].Sensor[${sIndex}]: отсутствует src.`);
                    }

                    // Проверка наличия dst либо на уровне сенсора, либо на уровне группы
                    if (!sensor.dst && !group.dst) {
                        errors.push(`Group[${gIndex}].Sensor[${sIndex}]: отсутствует dst (ни в сенсоре, ни в группе).`);
                    }
                });
            }
        });
    }

    return { valid: errors.length === 0, errors };
}

/**
 * @function
 * @description Преобразует пользовательский конфиг в конфиг работы ядра генератора.  
 * @param {Config} config 
 */
function toIPCConfig(conf, filesDict, additional) {
    // const getFilenames = (_dataPath) => readdirSync(_dataPath).map(fn => path.resolve(_dataPath, fn));
    const confCopy = { ...conf };
    for (const { name: groupName, sensors } of conf.groups) {
        let dataPath = filesDict[groupName];
        /*let files = getFilenames(dataPath);
        while (!files.find(_fn => fn.includes('gen'))) {
            dataPath = join(dataPath, files[0]);
        }
        if (files.length != sensors.length) return null;*/
        let gcopy = confCopy.groups.find(g => g.name == groupName);
        delete gcopy.filesPath;
        gcopy.sensors = sensors.map(sens => ({ ...sens, dataPath: findFileRecursively(dataPath, `${sens.name}.gen`) }));
    }
    return Object.assign(confCopy, additional);
}

function createConfiguration(options) {
    const {
        dstIp,
        n,
        totalBufferSize,
        srcIp,
        portBase,
        endPort,
        packetSize,
        baseCPUIndex,
        freq,
        spp,
        infoCh
    } = options;

    // Проверка обязательных параметров
    if (!dstIp || !portBase || !n) {
        throw new Error("Обязательные параметры отсутствуют: dstIp, portBase, n");
    }

    // Создаем конфигурацию
    const config = {
        id: 0,
        duration: 60,
        sysChannel: infoCh ? { host: `${infoCh.ip}:${infoCh.port}` } : undefined,
        groups: []
    };

    // Создаем единственную группу
    const group = {
        name: "sensor_group",
        filesPath: "./sensors.zip",
        loop: false,
        freq: freq || 1000,
        packetSize: packetSize || 8192,
        sensors: []
    };

    // Вычисляем диапазон портов
    const portRange = endPort - portBase + 1;

    // Создаем датчики
    for (let i = 0; i < n; i++) {
        const sensorIndex = i + 1;
        const srcIpIncremented = incrementIp(srcIp, i);
        const portIndex = i % portRange;
        const dstPort = portBase + portIndex;

        const sensor = {
            name: `sensName${sensorIndex}`,
            src: `${srcIpIncremented}:40000`,
            dst: `${dstIp}:${dstPort}`,
        };

        group.sensors.push(sensor);
    }

    config.groups.push(group);
    return config;
}

/**
 * Recursively searches for a file within a given directory and its subdirectories.
 * @param {string} startPath The starting directory to search from.
 * @param {string} fileName The name of the file to find.
 * @returns {string | null} The full path to the file if found, otherwise null.
 */
function findFileRecursively(startPath, fileName) {
    try {
        const files = readdirSync(startPath);

        for (const file of files) {
            const fullPath = path.join(startPath, file);
            const stats = statSync(fullPath);

            if (stats.isFile() && file === fileName) {
                return fullPath; // Found the file
            } else if (stats.isDirectory()) {
                const foundPath = findFileRecursively(fullPath, fileName);
                if (foundPath) {
                    return foundPath; // Found the file in a subdirectory
                }
            }
        }
        return null; // File not found in this branch
    } catch (err) {
        console.error(`Error reading directory ${startPath}:`, err);
        return null;
    }
}

export { loadConfig, validateConfig, createConfiguration, toIPCConfig }
