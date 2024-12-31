import { PinoWebpackPlugin } from "pino-webpack-plugin";
import path from "path";
import { CustomPinoBundlerPathsPlugin } from "./helper/custom_pino_bundler_path_pulgin.js";
import WebpackObfuscatorPlugin from "webpack-obfuscator";
import obfuscatorOptions from "./obfuscator.json" assert { type: "json" };

const config = {
  mode: "production",
  entry: "./index.js",
  output: {
    path: path.resolve("./dist"),
    filename: "[name].js",
    clean: true,
  },
  target: "node",

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [["@babel/preset-env"]],
          },
        },
      },
    ],
  },
  plugins: [
    new PinoWebpackPlugin({
      transports: ["pino-pretty"],
    }),
    new CustomPinoBundlerPathsPlugin(),
    new WebpackObfuscatorPlugin(obfuscatorOptions, [""]),
  ],
};

export default config;
