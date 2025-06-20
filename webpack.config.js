const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");
require('dotenv').config();

// Get server environment from command line arguments
// Example: webpack --env server=prod or webpack --env server=dev or webpack --env server=local
const getServerEnvironment = (env) => {
    if (!env || !env.server) {
        return process.env.NODE_ENV === "production" ? "prod" : "local";
    }
    return env.server;
};

module.exports = (env) => {
    const serverEnv = getServerEnvironment(env);
    console.log(`Building with server environment: ${serverEnv}`);
    
    return {
    entry: {
        "background/service-worker": "./src/background/service-worker.ts",
        "content/main-content": "./src/content/main-content.ts",
        "popup/popup": "./src/popup/popup.tsx",
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
    },
    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "postcss-loader",
                ],
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@types": path.resolve(__dirname, "src/types"),
            "@utils": path.resolve(__dirname, "src/utils"),
        },
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "[name].css",
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: "manifest.json",
                    to: "manifest.json",
                },
                {
                    from: "src/popup/popup.html",
                    to: "popup/popup.html",
                },
                {
                    from: "public",
                    to: "assets",
                    noErrorOnMissing: true,
                },
                {
                    from: "icons",
                    to: "icons",
                },
            ],
        }),
        new webpack.DefinePlugin({
            'process.env.SERVER_ENV': JSON.stringify(serverEnv),
        }),
    ],
    optimization: {
        splitChunks: false,
    },
    devtool:
        process.env.NODE_ENV === "development" ? "inline-source-map" : false,
    mode: process.env.NODE_ENV || "development",
    };
};
