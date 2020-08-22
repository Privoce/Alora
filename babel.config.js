const {MINIMUM_CHROME_VERSION} = require('./server/config/env');

module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    chrome: MINIMUM_CHROME_VERSION
                }
            }
        ],
        '@babel/preset-react'
    ],
    plugins: [
        '@babel/plugin-proposal-class-properties',
        'react-hot-loader/babel',
    ]
};