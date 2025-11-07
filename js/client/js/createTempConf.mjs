import { incrementIp } from "./utils.mjs";

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
        workTime: 60,
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

export default createConfiguration;