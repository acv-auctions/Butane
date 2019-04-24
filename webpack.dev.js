const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/application/entry-point.ts',
    target: "electron-renderer",
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        publicPath: "/"
    },
    resolve: {
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
                                '@babel/preset-typescript'
                            ],
                        }
                    }
                ]
            },
            {
                test: /\.vue$/,
                exclude: /(node_modules)/,
                loader: 'vue-loader'
            },
        ]
    },
    plugins: [
        new CopyWebpackPlugin([
            { from: "src/index.js", to: "index.js", force: true }
        ]),
        new HtmlWebpackPlugin({
            template: "src/index.html"
        }),
        new VueLoaderPlugin()
    ],
    devServer: {
        compress: true,
        port: 9000,
        inline: true
    }
};