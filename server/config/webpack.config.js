const {resolve} = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackBar = require('webpackbar');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const {argv} = require('yargs');
const {PROJECT_ROOT, MINIMUM_CHROME_VERSION} = require('./env');

const isDev = argv.mode !== 'production';

module.exports = {
    entry: {
        content: [resolve(PROJECT_ROOT, 'src/js/content.js')],
        background: [resolve(PROJECT_ROOT, 'src/js/background.js')],
        popup: [resolve(PROJECT_ROOT, 'src/js/popup.jsx')]
    },
    output: {
        publicPath: '/',
        path: resolve(PROJECT_ROOT, 'build'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                use: {
                    loader: 'babel-loader',
                    options: {
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
                            'babel-plugin-lodash',
                            'react-hot-loader/babel',
                            ['@babel/plugin-proposal-decorators', {legacy: true}],
                            ['@babel/plugin-proposal-class-properties', {loose: true}],
                            ['babel-plugin-import', {libraryName: 'antd'}]
                        ]
                    }
                },
                exclude: /node_modules/
            },
            {
                test: /\.(png|jpg|gif|woff2?)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            name: '[name].[ext]',
                            esModule: false,
                            limit: 0
                        }
                    }
                ]
            },
            {
                test: /\.css$/,
                use: [
                    isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            },
            {
                test: /\.s[ac]ss$/,
                use: [
                    isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    },
                    'sass-loader'
                ]
            },
            {
                test: /\.less$/,
                use: [
                    isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    },
                    {
                        loader: 'less-loader',
                        options: {
                            lessOptions: {
                                modifyVars: {
                                    'primary-color': '#3835d0',
                                    'link-color': '#3835d0',
                                },
                                javascriptEnabled: true
                            }
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin({
            cleanStaleWebpackAssets: false
        }),
        new WebpackBar({
            name: isDev ? 'Debug' : 'Release',
            color: isDev ? '#fff300' : '#00fff7'
        }),
        new FriendlyErrorsPlugin(),
        new MiniCssExtractPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: resolve(PROJECT_ROOT, 'src/manifest.json'),
                    to: resolve(PROJECT_ROOT, 'build'),
                    transform(data) {
                        let content = JSON.parse(data);
                        content.minimum_chrome_version = MINIMUM_CHROME_VERSION;
                        if (isDev) {
                            content.content_security_policy = "script-src 'self' 'unsafe-eval' https://ssl.google-analytics.com; object-src 'self';";
                        } else {
                            content.content_security_policy = "script-src 'self' https://ssl.google-analytics.com; object-src 'self';";
                        }
                        return Buffer.from(JSON.stringify(content));
                    },
                    force: true
                }
            ]
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: resolve(PROJECT_ROOT, 'public'),
                    to: resolve(PROJECT_ROOT, 'build'),
                    force: true
                }
            ]
        }),
        new HtmlWebpackPlugin({
            template: resolve(PROJECT_ROOT, 'src/html/popup.ejs'),
            filename: 'popup.html',
            chunks: ['popup'],
            minify: {
                collapseWhitespace: true
            }
        })
    ]
};