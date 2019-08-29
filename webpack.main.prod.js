const webpack = require("webpack");
const root = require("./webpack.main");
const merge = require("webpack-merge");

module.exports = merge(root, {
    mode: 'production',
    plugins: [
        new webpack.DefinePlugin({
            'process.env.ENVIRONMENT': JSON.stringify("production")
        })
    ]
});