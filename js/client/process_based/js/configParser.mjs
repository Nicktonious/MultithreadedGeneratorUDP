/**
 * @typedef {Object} SysChannel
 * @property {string} host - Адрес системного канала в формате "ip:port".
 */

/**
 * @typedef {Object} Sensor
 * @property {string} name - Имя сенсора.
 * @property {string} src - Источник данных сенсора (ip:port).
 * @property {string} [dst] - (Опционально) индивидуальный адрес назначения сенсора (ip:port).
 * @property {string} [vlan] - VLAN (может игнорироваться).
 */

/**
 * @typedef {Object} Group
 * @property {string} name - Имя группы сенсоров.
 * @property {string} filesPath - Путь до zip-файла с данными сенсоров.
 * @property {boolean} loop - Режим повторного воспроизведения.
 * @property {number} freq - Частота передачи (мс).
 * @property {number} packetSize - Размер пакета.
 * @property {string} [dst] - Общий адрес назначения группы (ip:port).
 * @property {Sensor[]} sensors - Список сенсоров.
 */

/**
 * @typedef {Object} Config
 * @property {number} id - Идентификатор конфигурации.
 * @property {number} workTime - Время работы в секундах.
 * @property {SysChannel} sysChannel - Системный канал.
 * @property {Group[]} groups - Список групп сенсоров.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

/**
 * Загружает конфигурацию из JSON файла.
 * @param {string} filePath - Путь к файлу конфигурации.
 * @returns {Config} Объект конфигурации.
 */
function loadConfig(filePath) {
    const absPath = resolve(filePath);
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

    if (typeof config.id !== "number") {
        errors.push("Поле 'id' должно быть числом.");
    }

    if (typeof config.workTime !== "number" || config.workTime <= 0) {
        errors.push("Поле 'workTime' должно быть положительным числом.");
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
                        errors.push(
                            `Group[${gIndex}].Sensor[${sIndex}]: отсутствует dst (ни в сенсоре, ни в группе).`
                        );
                    }
                });
            }
        });
    }

    return { valid: errors.length === 0, errors };
}
export { loadConfig, validateConfig }
