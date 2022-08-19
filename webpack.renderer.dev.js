const { merge } = require("webpack-merge");
const root = require("./webpack.renderer");
const { join } = require("path");

module.exports = merge(root, {
    mode: 'development',
    devServer: {
        compress: true,
        port: 8519,
        // static: {
        //     directory: join(__dirname, 'src', 'renderer', 'static'),
        //     publicPath: "/asset/",
        //     serveIndex: true
        // }
    }
});
