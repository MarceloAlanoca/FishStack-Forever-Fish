import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const clientDirectory = fileURLToPath(new URL('.', import.meta.url))
const gameDirectory = resolve(
  process.env.GAME_BUILD_DIR || resolve(clientDirectory, '../../Juego/FishStackFFWeb')
)

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.pck': 'application/octet-stream',
  '.wasm': 'application/wasm',
}

function fishStackAlpha() {
  const serveGame = (request, response, next) => {
    const pathname = decodeURIComponent((request.url || '/').split('?')[0])
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
    const filePath = resolve(gameDirectory, relativePath)

    if (!filePath.startsWith(`${gameDirectory}${sep}`) || !existsSync(filePath) || !statSync(filePath).isFile()) {
      next()
      return
    }

    const fileSize = statSync(filePath).size
    const range = request.headers.range
    response.setHeader('Content-Type', contentTypes[extname(filePath)] || 'application/octet-stream')
    response.setHeader('Accept-Ranges', 'bytes')

    if (range) {
      const [startText, endText] = range.replace('bytes=', '').split('-')
      const start = Number(startText)
      const end = endText ? Number(endText) : fileSize - 1
      response.statusCode = 206
      response.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`)
      response.setHeader('Content-Length', end - start + 1)
      createReadStream(filePath, { start, end }).pipe(response)
      return
    }

    response.setHeader('Content-Length', fileSize)
    createReadStream(filePath).pipe(response)
  }

  return {
    name: 'fishstack-alpha',
    configureServer(server) {
      server.middlewares.use('/fishstack-alpha', serveGame)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/fishstack-alpha', serveGame)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fishStackAlpha()],
})
