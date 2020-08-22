const {resolve} = require('path');

module.exports = {
    PROJECT_ROOT: resolve(__dirname, '../../'),
    HOST: '127.0.0.1',
    PORT: 7999,
    HMR_PATH: '/__webpack_hmr',
    ARR_PATH: '/__crx_arr',
    CONTENT_SCRIPT_CHUNKS: ['content'],
    BACKGROUND_CHUNK: 'background',
    MINIMUM_CHROME_VERSION: '80'
};