const path = require("path");

module.exports = {
  mode: "production",
  entry: path.resolve(__dirname, "src/index.js"),
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
    library: "Toddle-actions",
    libraryTarget: "umd",
    clean: true,
    globalObject: "this"
  },
  target: "node",
  optimization: {
    minimize: true
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "esbuild-loader",
        options: {
          format: "cjs",
          target: "node16",
          platform: "node",
          sourcesContent: false
        },
        include: __dirname,
        exclude: /node_modules/
      }
    ]
  }
};
