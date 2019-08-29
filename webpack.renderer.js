///////////////////////////////////////////////////////////////////////////////
// This is the base Webpack configuration for the Electron renderer script.
// Any environment-specific changes should be performed in their respective environment files.
///////////////////////////////////////////////////////////////////////////////

const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
    entry: './src/renderer/entry-point.ts',
    target: "electron-renderer",
    output: {
        path: path.resolve(__dirname, 'dist', 'renderer'),
        filename: 'renderer.js'
    },
    resolve: {
        alias: {
            css: path.resolve(__dirname, "src/renderer/css"),
            component: path.resolve(__dirname, "src/renderer/component"),
            img: path.resolve(__dirname, "src/renderer/img"),
            util: path.resolve(__dirname, "src/renderer/util")
        },
        extensions: ['.vue', '.js', '.ts']
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    'vue-style-loader',
                    'css-loader',
                    'sass-loader',
                ]
            },
            {
                exclude: /(node_modules)/,
                test: /\.(ts|js)$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ["@babel/preset-env", {
                                    targets: { "node": true }
                                }],
                                'babel-preset-typescript-vue'
                            ]
                        }
                    }
                ]
            },
            {
                test: /\.vue$/,
                exclude: /(node_modules)/,
                loader: 'vue-loader'
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {},
                    },
                ],
            }
        ]
    },
    plugins: [
        new VueLoaderPlugin(),
        new HtmlWebpackPlugin({
            template: "src/renderer/index.html",
        })
    ]
};