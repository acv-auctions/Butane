const merge = require("webpack-merge");
const root = require("./webpack.renderer");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = merge(root, {
    devtool: 'source-map',
    mode: 'production',
    output: {
        publicPath: "./" // The file protocol is used, so we're looking relative to the current directory
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: true,
                sourceMap: true,
                cache: true
            })
        ]
    }
});