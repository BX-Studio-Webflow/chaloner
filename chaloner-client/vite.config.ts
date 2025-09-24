import { defineConfig } from "vite";

import { glob } from "glob";
import path from "path";

export default defineConfig({
  server: {
    cors: {
      origin: "*", // Allow all origins
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    rollupOptions: {
      input: {
        index: "./index.html",
        ...Object.fromEntries(
          glob.sync("src/**/*.ts").map((file) => [
            // Get the file name without extension as the entry key
            path.basename(file, ".ts"),
            // Get the absolute path as the entry value
            path.resolve(file),
          ])
        ),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
      },
    },
  },
});
