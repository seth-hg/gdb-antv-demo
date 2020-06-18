const path = require("path");
const webpack = require("webpack");
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
  entry: "./ui/main.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
    }),
    new CompressionPlugin({
      test: /\.(js)$/,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        //use: "url-loader?limit=10000&mimetype=application/font-woff",
        use: ["file-loader"],
      },
      {
        test: /\.(ttf|otf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?|(jpg|gif)$/,
        use: ["file-loader"],
      },
    ],
  },
};
