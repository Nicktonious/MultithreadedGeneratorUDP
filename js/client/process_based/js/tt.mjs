import { performance } from "perf_hooks";

let stopFlag = false
async function * intervalGenerator(delayMicroseconds, limit) {
    const delayMs = delayMicroseconds / 1000;
    let t_0 = performance.now();
    let t_1 = t_0 + delayMs;
    let t_2 = t_1 + delayMs;
    let c = 0;
    while (!stopFlag) {
        yield;
        if (++c >= limit) {
            break;
        }
        await new Promise(resolve => setImmediate(resolve));
        // Ожидание с постоянным возвратом управления Event Loop
        while ((t_1 = performance.now()) - t_0 < delayMs) { }
        t_0 = t_1;
        t_1 = t_2;
        
        t_2 += delayMs;
    }
}

async function main() {
    let c = 0
    let t_1 = performance.now();
    for await (const _ of intervalGenerator(100, 10000)) {
        c++;
    }
    console.log(performance.now() - t_1);
    console.log(c);
}

main();