///////////////////////////////////////////////////////////////////////////////
// This is the base Webpack configuration for the Electron renderer script.
// Any environment-specific changes should be performed in their respective environment files.
///////////////////////////////////////////////////////////////////////////////

const { resolve } = require('path');
const { VueLoaderPlugin } = require('vue-loader');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const polyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
    entry: './src/renderer/entry-point.ts',
    target: "electron-renderer",
    output: {
        path: resolve(__dirname, 'dist', 'renderer'),
        filename: 'renderer.js'
    },
    resolve: {
        alias: {
            css: resolve(__dirname, "src/renderer/css"),
            component: resolve(__dirname, "src/renderer/component"),
            img: resolve(__dirname, "src/renderer/img"),
            util: resolve(__dirname, "src/renderer/util")
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
                                ['babel-preset-typescript-vue3', {
                                    optimizeConstEnums: true
                                }]
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
        new HtmlWebpackPlugin(),
        new polyfillPlugin({
            includeAliases: ["path"]
        })
    ],
    node: {
        global: true
    }
};
