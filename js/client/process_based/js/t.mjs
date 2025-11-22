let stopFlag = false;
async function* intervalGenerator(...timers) {
    // Создаем массивы для хранения состояний каждого таймера
    const delaysMs = timers.map(timer => timer.freq / 1000);
    let t_0 = timers.map(() => performance.now());
    let t_1 = timers.map((_, i) => t_0[i] + delaysMs[i]);
    let t_2 = timers.map((_, i) => t_1[i] + delaysMs[i]);

    // Массив активных таймеров
    const activeTimers = timers.map(timer => timer.groupName);

    while (!stopFlag) {
        // Проверяем все таймеры в цикле busy wait
        for (let i = 0; i < timers.length; i++) {
            const currentTime = performance.now();

            // Если пришло время для этого таймера
            if (currentTime - t_0[i] >= delaysMs[i]) {
                // Yield с именем группы
                yield activeTimers[i];

                // Обновляем временные метки для этого таймера
                t_0[i] = t_1[i];
                t_1[i] = t_2[i];
                t_2[i] += delaysMs[i];
            }
        }

        // Возвращаем управление event loop
        await new Promise(resolve => setImmediate(resolve));
    }
}

let t_0 = { a: performance.now(), b: performance.now()}
let t_1 = { a: performance.now(), b: performance.now()}
let dt = { a: 0, b: 0 };
setTimeout(() => {
    stopFlag = true;
    console.log(dt);
}, 5000);

for await (let gname of intervalGenerator({ groupName: 'a', freq: 100 }, { groupName: 'b', freq: 10 })) {
    t_1[gname] = performance.now();
    dt[gname] = (dt[gname] + t_1[gname] - t_0[gname]) / 2;
    t_0[gname] = t_1[gname];
}
