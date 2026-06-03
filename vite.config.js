import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import https from 'node:https'

// Custom middleware that pipes requests to api.quran.com using Node's https
// module directly — avoids the http-proxy-middleware CORS/SSL issues in Codespaces.
const quranApiPlugin = {
  name: 'quran-api-proxy',
  configureServer(server) {
    server.middlewares.use('/api/quran', (req, res) => {
      const path = req.url ?? '/'
      console.log('[quran proxy] →', `https://api.quran.com${path}`)

      https
        .get(
          {
            hostname: 'api.quran.com',
            path,
            headers: { Accept: 'application/json' },
          },
          upstream => {
            res.writeHead(upstream.statusCode, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            })
            upstream.pipe(res)
          }
        )
        .on('error', err => {
          console.error('[quran proxy] error:', err.message)
          res.writeHead(502)
          res.end(JSON.stringify({ error: err.message }))
        })
    })
  },
}

const sunnahApiPlugin = {
  name: 'sunnah-api-proxy',
  configureServer(server) {
    server.middlewares.use('/api/sunnah', (req, res) => {
      const path = req.url ?? '/'
      console.log('[sunnah proxy] →', `https://api.sunnah.com${path}`)

      https
        .get(
          {
            hostname: 'api.sunnah.com',
            path,
            headers: {
              Accept: 'application/json',
              'x-api-key': 'SqD712P3E82xnwOAEOkGd5JZH8s9wRR24TqNFzjk',
            },
          },
          upstream => {
            res.writeHead(upstream.statusCode, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            })
            upstream.pipe(res)
          }
        )
        .on('error', err => {
          console.error('[sunnah proxy] error:', err.message)
          res.writeHead(502)
          res.end(JSON.stringify({ error: err.message }))
        })
    })
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), quranApiPlugin, sunnahApiPlugin],
})
