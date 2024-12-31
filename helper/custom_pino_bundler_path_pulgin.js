import pkg from "webpack";
const { sources } = pkg;

class CustomPinoBundlerPathsPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(
      "CustomPinoBundlerPathsPlugin",
      (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: "CustomPinoBundlerPathsPlugin",
            stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE,
          },
          (assets) => {
            for (const assetName in assets) {
              if (assetName.endsWith(".js")) {
                const asset = assets[assetName];
                const originalSource = asset.source().toString();
                // suggested in official pino-pulgin https://github.com/pinojs/pino/blob/main/docs/bundling.md
                const fixedSource = originalSource.replace(
                  /globalThis\.__bundlerPathsOverrides\s*=\s*{.*?};/s,
                  `
globalThis.__bundlerPathsOverrides = {
  'thread-stream-worker': pinoWebpackAbsolutePath('./thread-stream-worker.js'),
  'pino/file': pinoWebpackAbsolutePath('./pino-file.js'),
  'pino-worker': pinoWebpackAbsolutePath('./pino-worker.js'),
  'pino-pretty': pinoWebpackAbsolutePath('./pino-pretty.js'),
};
`
                );

                // Replace the asset content with updated source
                compilation.updateAsset(
                  assetName,
                  new sources.RawSource(fixedSource)
                );
              }
            }
          }
        );
      }
    );
  }
}

export { CustomPinoBundlerPathsPlugin };
