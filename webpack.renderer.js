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
            static: resolve(__dirname, "src/renderer/static"),
            util: resolve(__dirname, "src/renderer/util")
        },
        extensions: ['.vue', '.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    'vue-style-loader',
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: {
                                    tailwindcss: {},
                                    autoprefixer: {}
                                }
                            }
                        }
                    },
                    'sass-loader'
                ]
            },
            {
                test: /\.ts$/,
                exclude: /(node_modules)/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                            appendTsSuffixTo: [/\.vue$/]
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
                type: "asset/resource"
            },
            {
                test: /\.(otf|ttf|woff|woff2|eot)$/,
                type: "asset/resource"
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
