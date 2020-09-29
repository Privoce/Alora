const {merge} = require('webpack-merge');
const {resolve} = require('path');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const {HashedModuleIdsPlugin} = require('webpack');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const baseConfig = require('./webpack.config');
const {PROJECT_ROOT} = require('./env');

module.exports = merge(baseConfig, {
    mode: 'production',
    plugins: [
        new HashedModuleIdsPlugin({
            context: resolve(PROJECT_ROOT, 'src'),
            hashFunction: 'sha256',
            hashDigest: 'hex',
            hashDigestLength: 20
        }),
        new LodashModuleReplacementPlugin,
        new AntdDayjsWebpackPlugin(),
        new BundleAnalyzerPlugin()
    ],
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false
            }),
            new OptimizeCSSAssetsPlugin()
        ],
        splitChunks: {
            chunks: 'async'
        }
    },
    performance: {
        hints: false
    }
});