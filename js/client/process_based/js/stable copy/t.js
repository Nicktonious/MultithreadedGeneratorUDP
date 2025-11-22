// import {exec} from 'child_process'

// async function getTxSent(ifaceName) {
//     return new Promise((res, rej) => {
//         exec(`cat /sys/class/net/${ifaceName}/statistics/tx_packets`, (e, stdout, stderr) => {
//             if (e) res(undefined);
//             res(parseInt(stdout));
//         });
//     })
// }
// (async () => {
//     let v = await getTxSent('enp1s0np1');
//     console.log(v);
// })();

let n = 20;
let m = 5;

let a = Array(n/m).fill()
            .map(() => Array(m).fill()
            .map((_, i) => i));

console.log(a);

console.log(a.flat());