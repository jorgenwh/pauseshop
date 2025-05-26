const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'background/service-worker': './src/background/service-worker.ts',
    'content/main-content': './src/content/main-content.ts',
    'popup/popup': './src/popup/popup.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@utils': path.resolve(__dirname, 'src/utils')
    }
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'manifest.json',
          to: 'manifest.json'
        },
        {
          from: 'src/ui/styles.css',
          to: 'ui/styles.css'
        },
        {
          from: 'src/popup/popup.html',
          to: 'popup/popup.html'
        },
        {
          from: 'public',
          to: 'assets',
          noErrorOnMissing: true
        }
      ]
    })
  ],
  optimization: {
    splitChunks: false
  },
  devtool: process.env.NODE_ENV === 'development' ? 'inline-source-map' : false,
  mode: process.env.NODE_ENV || 'development'
};