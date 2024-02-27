const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    devtool: 'source-map',
    mode: 'development',
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.bundle.js'
    },
    module: {
        rules: [
            { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
            { test: /\.css$/, sideEffects: true, use: ["style-loader", "css-loader"] }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    devServer: {
        static: {
            directory: path.join(__dirname),
        },
        port: 9000
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: './index.html', to: 'index.html' },
                { from: './index.css', to: 'index.css' }
            ]
        })
    ]
}