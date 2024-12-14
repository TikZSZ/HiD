import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig( {
  plugins: [ react(),
  nodePolyfills( {
    globals:{Buffer:true},
    include:["stream"]
  }
  ) 
],
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
            "@hashgraph/proto",
            "@hashgraph/hedera-wallet-connect",
            "@hashgraph/cryptography",
          ],
          hashConnect: [
            "hashconnect",
          ],
        }
      }
    }
  }
} )
