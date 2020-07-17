var webpack = require('webpack'),
  path = require('path'),
  fileSystem = require('fs-extra'),
  env = require('./utils/env'),
  { CleanWebpackPlugin } = require('clean-webpack-plugin'),
  CopyWebpackPlugin = require('copy-webpack-plugin'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  WriteFilePlugin = require('write-file-webpack-plugin');

// load the secrets
var alias = {
  'react-dom': '@hot-loader/react-dom',
};

var secretsPath = path.join(__dirname, 'secrets.' + env.NODE_ENV + '.js');

var fileExtensions = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'eot',
  'otf',
  'svg',
  'ttf',
  'woff',
  'woff2',
];

if (fileSystem.existsSync(secretsPath)) {
  alias['secrets'] = secretsPath;
}

var options = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    background: path.join(__dirname, 'src', 'js', 'background.js'),
    content: path.join(__dirname, 'src', 'js', 'content.js'),
    youtube: path.join(__dirname, 'src', 'js', 'youtube.js')
  },
  devtool: 'cheap-module-source-map',
  chromeExtensionBoilerplate: {
    notHotReload: ['content'],
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      // {
      //   test: /\.css$/,
      //   loader: 'style-loader!css-loader',
      //   exclude: /node_modules/,
      // },
      // {
      //   test: /\.scss$/,
      //   loader: 'sass-loader',
      //   exclude: /node_modules/,
      // },
      {
        // look for .css or .scss files
        test: /\.(css|scss)$/,
        // in the `src` directory
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
        loader: 'file-loader?name=[name].[ext]',
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: alias,
    extensions: fileExtensions
      .map((extension) => '.' + extension)
      .concat(['.jsx', '.js', '.css']),
  },
  plugins: [
    new webpack.ProgressPlugin(),
    // clean the build folder
    new CleanWebpackPlugin({
      verbose: true,
      cleanStaleWebpackAssets: false,
    }),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new CopyWebpackPlugin(
      [
        {
          from: 'src/manifest.json',
          to: path.join(__dirname, 'build'),
          force: true,
          transform: function (content, path) {
            // generates the manifest file using the package.json informations
            return Buffer.from(
              JSON.stringify({
                description: process.env.npm_package_description,
                version: process.env.npm_package_version,
                ...JSON.parse(content.toString()),
              })
            );
          },
        },
      ],
      {
        logLevel: 'info',
        copyUnmodified: true,
      }
    ),
    // new CopyWebpackPlugin(
    //   [
    //     {
    //       from: 'src/pages/Content/content.styles.css',
    //       to: path.join(__dirname, 'build'),
    //       force: true,
    //     },
    //   ],
    //   {
    //     logLevel: 'info',
    //     copyUnmodified: true,
    //   }
    // ),
    new CopyWebpackPlugin(
      [
        {
          from: 'src/assets/images/*',
          flatten: true,
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
      {
        logLevel: 'info',
        copyUnmodified: true,
      }
    ),
    new CopyWebpackPlugin(
      [
        {
          from: 'src/_locales',
          to: path.join(__dirname, 'build/_locales'),
          force: true,
        },
      ],
      {
        logLevel: 'info',
        copyUnmodified: true,
      }
    ),
    // new HtmlWebpackPlugin({
    //   template: path.join(__dirname, 'src', 'pages', 'Newtab', 'index.html'),
    //   filename: 'newtab.html',
    //   chunks: ['newtab'],
    // }),
    // new HtmlWebpackPlugin({
    //   template: path.join(__dirname, 'src', 'pages', 'Options', 'index.html'),
    //   filename: 'options.html',
    //   chunks: ['options'],
    // }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'popup.html'),
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    // new HtmlWebpackPlugin({
    //   template: path.join(
    //     __dirname,
    //     'src',
    //     'pages',
    //     'Background',
    //     'index.html'
    //   ),
    //   filename: 'background.html',
    //   chunks: ['background'],
    // }),
    new WriteFilePlugin(),
  ],
};

module.exports = options;
