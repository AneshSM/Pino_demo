import pkg from "webpack";
import fs from "fs-extra"; // Import fs-extra for file operations
import path from "path";

const { sources } = pkg;

class CustomPinoBundlerPathsPlugin {
  // Main entry point for the plugin
  apply(compiler) {
    // Hook into Webpack's compilation process
    compiler.hooks.compilation.tap(
      "CustomPinoBundlerPathsPlugin",
      (compilation) => {
        this.processAssets(compilation);
      }
    );

    // Hook into Webpack's afterEmit phase to move Pino files
    compiler.hooks.afterEmit.tapAsync(
      "CustomPinoBundlerPathsPlugin",
      async (compilation, callback) => {
        await this.movePinoFiles(compilation, compiler);
        callback();
      }
    );
  }

  /**
   * Process JavaScript assets and modify the `globalThis.__bundlerPathsOverrides` content.
   * @param {Compilation} compilation - Webpack's compilation object.
   */
  processAssets(compilation) {
    try {
      compilation.hooks.processAssets.tap(
        {
          name: "CustomPinoBundlerPathsPlugin",
          stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        (assets) => {
          for (const assetName in assets) {
            if (assetName.endsWith(".js")) {
              try {
                const asset = assets[assetName];
                const originalSource = asset.source().toString();

                // Replace the `globalThis.__bundlerPathsOverrides` code
                const fixedSource = originalSource.replace(
                  /globalThis\.__bundlerPathsOverrides\s*=\s*{.*?};/s,
                  `
globalThis.__bundlerPathsOverrides = {
  'thread-stream-worker': pinoWebpackAbsolutePath('./pino/thread-stream-worker.js'),
  'pino/file': pinoWebpackAbsolutePath('./pino/pino-file.js'),
  'pino-worker': pinoWebpackAbsolutePath('./pino/pino-worker.js'),
  'pino-pretty': pinoWebpackAbsolutePath('./pino/pino-pretty.js'),
};
`
                );

                // Update the asset with the modified source
                compilation.updateAsset(
                  assetName,
                  new sources.RawSource(fixedSource)
                );
              } catch (error) {
                console.error(
                  `[CustomPinoBundlerPathsPlugin] Error processing asset: ${assetName}`,
                  error
                );
              }
            }
          }
        }
      );
    } catch (error) {
      console.error(
        "[CustomPinoBundlerPathsPlugin] Error during processAssets hook:",
        error
      );
    }
  }

  /**
   * Move Pino-related files to the `pino` folder in the output directory.
   * @param {Compilation} compilation - Webpack's compilation object.
   * @param {Compiler} compiler - Webpack's compiler object.
   */
  async movePinoFiles(compilation, compiler) {
    const outputPath =
      compilation.outputOptions.path || compiler.options.output.path;

    // Ensure the output path is defined
    if (!outputPath) {
      console.error(
        "[CustomPinoBundlerPathsPlugin] Output path is not defined in Webpack configuration."
      );
      return;
    }

    const pinoFolder = path.join(outputPath, "pino");

    try {
      // Ensure the `pino` folder exists
      await fs.ensureDir(pinoFolder);

      // List of files to move
      const pinoFiles = [
        "thread-stream-worker.js",
        "pino-file.js",
        "pino-worker.js",
        "pino-pretty.js",
      ];

      for (const file of pinoFiles) {
        const sourcePath = path.join(outputPath, file);
        const targetPath = path.join(pinoFolder, file);

        // Check if the file exists before moving
        if (await fs.pathExists(sourcePath)) {
          try {
            await fs.move(sourcePath, targetPath, { overwrite: true });
            console.log(
              `[CustomPinoBundlerPathsPlugin] Moved: ${file} to /pino`
            );
          } catch (moveError) {
            console.error(
              `[CustomPinoBundlerPathsPlugin] Error moving file: ${file}`,
              moveError
            );
          }
        } else {
          console.warn(
            `[CustomPinoBundlerPathsPlugin] File not found, skipping: ${file}`
          );
        }
      }
    } catch (error) {
      console.error(
        "[CustomPinoBundlerPathsPlugin] Error ensuring pino folder or moving files:",
        error
      );
    }
  }
}

export { CustomPinoBundlerPathsPlugin };
