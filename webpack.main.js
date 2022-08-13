///////////////////////////////////////////////////////////////////////////////
// This is the base Webpack configuration for the main Electron script.
// Any environment-specific changes should be performed in their respective environment files.
///////////////////////////////////////////////////////////////////////////////

const webpack = require("webpack");
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const Dotenv = require("dotenv-webpack");

module.exports = {
    entry: './src/main.ts',
    target: "electron-main",
    externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
    output: {
        path: path.resolve(__dirname, 'dist', 'main'),
        filename: 'index.js'
    },
    resolve: {
        extensions: ['.ts']
    },
    module: {
        rules: [
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
                                '@babel/preset-typescript'
                            ]
                        }
                    }
                ]
            }
        ]
    },
    node: {
        __dirname: false,
        __filename: false,
        global: true
    }
};
