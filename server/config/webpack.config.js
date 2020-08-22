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
        youtube: [resolve(PROJECT_ROOT, 'src/js/youtube.js')],
        content: [resolve(PROJECT_ROOT, 'src/js/content.js')],
        background: [resolve(PROJECT_ROOT, 'src/js/background.js')],
        popup: [resolve(PROJECT_ROOT, 'src/js/popup.jsx')]
    },
    output: {
        publicPath: '/',
        path: resolve(PROJECT_ROOT, 'build'),
        filename: '[name].bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                use: ['babel-loader'],
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
                        if (isDev) {
                            content['content_security_policy'] =
                                (content['content_security_policy'] || '') +
                                'script-src \'self\' \'unsafe-eval\';object-src \'self\';';
                        }
                        content.name = process.env.npm_package_name
                            .split('-')
                            .map(s => s.charAt(0).toUpperCase() + s.slice(1))
                            .join(' ');
                        content.description = process.env.npm_package_description;
                        content.version = process.env.npm_package_version;
                        content.minimum_chrome_version = MINIMUM_CHROME_VERSION;
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
                    flatten: true,
                    force: true
                }
            ]
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: resolve(PROJECT_ROOT, 'src/_locales'),
                    to: resolve(PROJECT_ROOT, 'build/_locales'),
                    force: true
                }
            ]
        }),
        new HtmlWebpackPlugin({
            template: resolve(PROJECT_ROOT, 'src/html/template.ejs'),
            filename: 'popup.html',
            chunks: ['popup'],
            minify: {
                collapseWhitespace: true
            }
        })
    ],
    resolve: {
        alias: {
            'react-dom': '@hot-loader/react-dom'
        }
    }
};