import { defineConfig } from 'vitepress'
import markdownItKatex from 'markdown-it-katex'
import wasm from 'vite-plugin-wasm'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  title: 'SciMath WASM',
  description: 'High-performance scientific mathematics for WebAssembly',
  base: '/sci-math-wasm/',
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', href: '/sci-math-wasm/favicon.ico' }],
    ['script', { src: '/sci-math-wasm/coi-serviceworker.js' }]
  ],
  markdown: {
    config: (md) => {
      md.use(markdownItKatex)
    }
  },
  vite: {
    plugins: [
      wasm()
    ],
    worker: {
      format: 'es',
      plugins: () => [
        wasm()
      ]
    },

    resolve: {
      preserveSymlinks: true,
      alias: {
        '@wasm': path.resolve(__dirname, '../../pkg/web')
      }
    },
    server: {
      fs: {
        allow: ['..']
      },
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      }
    },
    preview: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      }
    },
    optimizeDeps: {
      exclude: ['@velo-sci/sci-math-wasm']
    }
  },
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' }
    ],
    logo: '/logo.svg',
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Integration Guide', link: '/guide/integration' },
            { text: 'WASM Performance', link: '/guide/performance' },
            { text: 'Migration Guide', link: '/guide/migration' },
            { text: 'Video Tutorials', link: '/guide/tutorials' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'SciEngine (Core)', link: '/api/engine' },
            { text: 'Basic Math', link: '/api/basic' },
            { text: 'Statistics', link: '/api/stats' },
            { text: 'Linear Algebra', link: '/api/linalg' },
            { text: 'Signal Processing', link: '/api/signal' },
            { text: 'File I/O', link: '/api/io' },
            { text: 'Optimization', link: '/api/optimization' },
            { text: 'Symbolic Math', link: '/api/symbolic' },
            { text: 'Trigonometry', link: '/api/trig' },
            { text: 'Polynomials', link: '/api/poly' },
            { text: 'Regression', link: '/api/regression' },
            { text: 'Complex Numbers', link: '/api/complex' },
            { text: 'Calculus', link: '/api/calculus' },
            { text: 'Unit Conversions', link: '/api/units' }
          ]
        }
      ]
    },
    footer: {
      message: 'Integrated under the VeloSci Ecosystem',
      copyright: '© 2026 VeloSci'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/VeloSci/sci-math-wasm' }
    ]
  }
});