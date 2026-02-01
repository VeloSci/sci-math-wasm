import { defineConfig } from 'vitepress'
import markdownItKatex from 'markdown-it-katex'
import wasm from 'vite-plugin-wasm'

export default defineConfig({
  title: 'SciMath WASM',
  description: 'High-performance scientific mathematics for WebAssembly',
  base: '/sci-math-wasm/',
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

    resolve: {
      preserveSymlinks: true
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
            { text: 'JS vs WASM', link: '/guide/js-vs-wasm' },
            { text: 'Integration', link: '/guide/integration' },
            { text: 'WASM Performance', link: '/guide/performance' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Basic Math', link: '/api/basic' },
            { text: 'Statistics', link: '/api/stats' },
            { text: 'Linear Algebra', link: '/api/linalg' },
            { text: 'Signal Processing', link: '/api/signal' },
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