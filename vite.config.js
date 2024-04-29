import { defineConfig } from 'vite'
import typescript from '@rollup/plugin-typescript'
import { viteSingleFile } from "vite-plugin-singlefile"


export default defineConfig({
  plugins: [typescript(), viteSingleFile()],
  build: {
    // specify the input file to bundle
    rollupOptions: {
      input: './src/background.ts',
      output: {
        entryFileNames: 'background.js'
      }
    },
    // disable code splitting and output a single js file
    outDir: './dist',
    assetsDir: '.',
    cssCodeSplit: false,
    minify: false
  }
})
