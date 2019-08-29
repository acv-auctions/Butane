const merge = require("webpack-merge");
const root = require("./webpack.renderer");

module.exports = merge(root, {
    mode: 'development',
    devServer: {
        compress: true,
        port: 8519,
        inline: true
    }
});