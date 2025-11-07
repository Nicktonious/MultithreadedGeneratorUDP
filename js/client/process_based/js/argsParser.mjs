import minimist from "minimist";
/**
 * @typedef {Object} ParsedArgs
 * @property {string} config
*/

/**
 * Парсинг аргументов CLI
 * @param {string[]} argv
 * @returns {ParsedArgs}
 */
export default function parseArgs(argv) {
    const args = minimist(argv, {
        alias: {
            h: 'help',
            c: 'config'
        },
        default: {},
        string: ['config'], 
    });

    if (args.help) {
        console.log(`Usage: node main.mjs [options]
    Options:
    -c, --config           path to Config file (.json)
    -h, --help             Show this help message
    `);
        process.exit(0);
    }

    const config = args.config;
    if (config) return { config };
}
