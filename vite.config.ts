import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { compression } from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig( {
  plugins: [ react(),
    compression({algorithm:"brotliCompress",compressionOptions:{chunkSize:5*1024}}),
  nodePolyfills( {
    globals:{Buffer:true},
    include:["stream"]
  }
  ) 
],
server:{origin:"http://localhost:5173"},
  resolve: {
    alias: {
      "@": path.resolve( __dirname, "./src" ),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "@hashgraph": [
            "@hashgraph/sdk",
            "@hashgraph/cryptography",
            "@hashgraph/proto",
            "@hashgraph/hedera-wallet-connect",
          ],
          hashConnect: [
            "hashconnect"
          ],
        }
      }
    }
  }
} )
