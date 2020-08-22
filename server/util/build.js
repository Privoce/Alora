const webpack = require('webpack');
const prodConfig = require('../config/webpack.prod.config');

const compiler = webpack(prodConfig);
compiler.run((error, stats) => {
    if (error) {
        console.error(error);
    } else {
        console.log(stats.toString({
            colors:true,
            modules:false,
            children:false
        }));
    }
});