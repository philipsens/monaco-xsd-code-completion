const path = require('path')

module.exports = {
    mode: 'development',
    entry: {
        XsdFeatures: path.resolve(__dirname, 'src/XsdFeatures.ts'),
        XsdManager: path.resolve(__dirname, 'src/XsdManager.ts'),
        'xsd-worker': path.resolve(__dirname, 'src/xsd.worker.ts'),
    },
    output: {
        path: path.resolve(__dirname, 'umd'),
        filename: '[name].js',
        library: 'Monaco XSD Code Completion',
        libraryTarget: 'umd',
    },
    module: {
        rules: [
            {
                test: /\.worker\.js$/,
                use: {
                    loader: 'worker-loader',
                    options: { inline: true },
                },
            },
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: 'tsconfig.umd.json',
                    },
                },
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.ttf$/,
                use: ['file-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
}
