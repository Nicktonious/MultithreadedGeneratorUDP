import DataProvider from "./ClassDataProvider.mjs";
import { loadConfig, toIPCConfig } from "./configParser.mjs";

const conf = loadConfig(`res/runconf-example.json`);
const dataProvider = new DataProvider();
// extract zips and get path to each group's data 
let filesDict = conf.groups.reduce((pr, curr) => {
    pr[curr.name] = dataProvider.ExtractZipArchive(curr.filesPath, './temp');
    return pr;
}, {});
process.on('exit', () => {
    for (let path of Object.values(filesDict))
        dataProvider.CleanupTempFiles(path);
});
const ipcConf = toIPCConfig(conf, filesDict, { baseCPUIndex: 0 });
console.log(JSON.stringify(ipcConf));

