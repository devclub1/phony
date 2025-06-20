import { defineConfig, Plugin } from 'vite';
import { spawn } from 'child_process'
import { VitePluginNode } from 'vite-plugin-node';

const PORT = !!process.env.PORT ? Number(process.env.PORT) : 8080;

function serverRestartPlugin(): Plugin {
  const isWatchMode = process.argv.includes('--watch')

  let serverProcess: any = null

  return {
    name: 'server-restart',
    writeBundle() {
      if (!isWatchMode) {
        return
      }

      if (serverProcess) {
        serverProcess.kill()
      }

      serverProcess = spawn('node', ['dist/main.js'], {
        stdio: 'inherit',
        shell: false
      })

      process.on('exit', () => {
        serverProcess?.kill()
      })
    }
  }
}

export default defineConfig({
  server: {
    port: PORT
  },
  plugins: [
    VitePluginNode({
      adapter: 'express',
      appPath: './src/main.ts',
      exportName: 'app',
      tsCompiler: 'esbuild'
    }),
    serverRestartPlugin()
  ],
  build: {
    lib: {
      entry: './src/main.ts',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['fs', 'path'],
    },
    outDir: 'dist',
  },
});

