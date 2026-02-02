<script setup lang="ts">
import { ref, onUnmounted, nextTick } from 'vue'

interface BenchResult {
  id: string;
  name: string;
  js: number;
  wasm: number;
  ratio: number;
  status: 'pending' | 'running' | 'done';
}

const results = ref<Record<string, BenchResult>>({
  // IO Module Benchmarks
  'io_csv_small': { id: 'io_csv_small', name: 'CSV Parsing (10K rows)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'io_csv_large': { id: 'io_csv_large', name: 'CSV Parsing (100K rows)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'io_mpt': { id: 'io_mpt', name: 'MPT File Processing', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'io_format_detection': { id: 'io_format_detection', name: 'Format Detection', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  
  // Mathematical Computing Benchmarks
  'nbody': { id: 'nbody', name: 'N-Body Turbo (f32x4 SIMD)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'calculus': { id: 'calculus', name: 'Calculus (Diff+Integ 1M pts)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'deconvolution': { id: 'deconvolution', name: 'Deconvolution (100k pts)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'filters': { id: 'filters', name: 'Butterworth Filter (1M pts)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'analysis_fitting': { id: 'analysis_fitting', name: 'Analysis & Fitting (100k pts)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'fft': { id: 'fft', name: 'FFT (65k Points)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'matmul': { id: 'matmul', name: 'Matrix Matmul (f64 Blocked)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
})

const logs = ref<string[]>([])
const isRunning = ref(false)
let worker: Worker | null = null

const addLog = (msg: string) => {
  logs.value.push(`[${new Date().toLocaleTimeString()}] ${msg}`)
  if (logs.value.length > 100) logs.value.shift()
  
  nextTick(() => {
    const el = document.getElementById('bench-logs')
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth'
      })
    }
  })
}

const startBenchmarks = () => {
  if (isRunning.value) return
  
  isRunning.value = true
  logs.value = []
  // Reset results
  for(const key in results.value) {
    results.value[key].status = 'pending'
    results.value[key].js = 0
    results.value[key].wasm = 0
    results.value[key].ratio = 0
  }

  addLog('Initializing Worker...')
  
  // Create worker using Vite's ?worker import
  // Note: in VitePress, we might need a direct relative path or a more complex setup
  // but usually new Worker(new URL(..., import.meta.url)) works.
  worker = new Worker(new URL('../workers/bench.worker.ts', import.meta.url), {
    type: 'module'
  })

  worker.onmessage = (e) => {
    const { type, message, id, status, js, wasm, ratio } = e.data

    switch (type) {
      case 'log':
        addLog(message)
        break
      case 'status':
        if (results.value[id]) results.value[id].status = status
        break
      case 'result':
        if (results.value[id]) {
          results.value[id].js = js
          results.value[id].wasm = wasm
          results.value[id].ratio = ratio
          results.value[id].status = 'done'
        }
        break
      case 'done':
        isRunning.value = false
        worker?.terminate()
        worker = null
        break
      case 'error':
        addLog(`ERROR: ${message}`)
        isRunning.value = false
        worker?.terminate()
        break
    }
  }

  worker.postMessage({ type: 'start' })
}

onUnmounted(() => {
  worker?.terminate()
})
</script>

<template>
  <div class="bench-container">
    <div class="bench-header">
      <div class="header-content">
        <h2>Live Execution Lab <span class="simd-tag">SIMD ENABLED</span></h2>
        <p>High-performance scientific computing and file processing benchmarks running in a background Web Worker with WASM acceleration.</p>
      </div>
      <button @click="startBenchmarks" :disabled="isRunning" class="run-button" :class="{ 'is-running': isRunning }">
        <span v-if="isRunning" class="spinner"></span>
        <span>{{ isRunning ? 'Executing...' : 'Start Heavy Compute' }}</span>
      </button>
    </div>

    <div class="lab-layout">
      <!-- Logs Panel -->
      <div class="logs-panel">
        <div class="panel-header">Execution Logs</div>
        <div id="bench-logs" class="logs-content">
          <div v-if="logs.length === 0" class="empty-logs">System idle. Waiting for command...</div>
          <div v-for="(log, i) in logs" :key="i" class="log-entry">{{ log }}</div>
        </div>
      </div>

      <!-- Results Panel -->
      <div class="results-panel">
        <!-- IO Module Benchmarks Section -->
        <div class="category-header">📁 File Processing Benchmarks</div>
        <div v-for="res in Object.values(results).filter(r => r.id.startsWith('io_'))" 
             :key="res.id" 
             class="result-card" 
             :class="{ 'is-active': res.status === 'running', 'is-done': res.status === 'done' }">
          <div class="card-top">
            <span class="card-name">{{ res.name }}</span>
            <span v-if="res.status === 'done'" class="ratio-badge">{{ res.ratio.toFixed(1) }}x</span>
            <span v-else-if="res.status === 'running'" class="running-tag">RUNNING</span>
          </div>
          
          <div class="bars">
            <div class="bar-group">
              <div class="bar-label">JS</div>
              <div class="bar-track">
                <div class="bar js-bar" :style="{ width: res.status !== 'pending' ? '100%' : '0%' }"></div>
                <span v-if="res.js > 0" class="bar-val">{{ res.js.toFixed(3) }}ms</span>
              </div>
            </div>
            <div class="bar-group">
              <div class="bar-label">WASM</div>
              <div class="bar-track">
                <div class="bar wasm-bar" :style="{ width: res.status === 'done' ? (res.wasm / res.js * 100) + '%' : '0%' }"></div>
                <span v-if="res.wasm > 0" class="bar-val">{{ res.wasm.toFixed(3) }}ms</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Mathematical Computing Benchmarks Section -->
        <div class="category-header">🧮 Mathematical Computing Benchmarks</div>
        <div v-for="res in Object.values(results).filter(r => !r.id.startsWith('io_'))" 
             :key="res.id" 
             class="result-card" 
             :class="{ 'is-active': res.status === 'running', 'is-done': res.status === 'done' }">
          <div class="card-top">
            <span class="card-name">{{ res.name }}</span>
            <span v-if="res.status === 'done'" class="ratio-badge">{{ res.ratio.toFixed(1) }}x</span>
            <span v-else-if="res.status === 'running'" class="running-tag">RUNNING</span>
          </div>
          
          <div class="bars">
            <div class="bar-group">
              <div class="bar-label">JS</div>
              <div class="bar-track">
                <div class="bar js-bar" :style="{ width: res.status !== 'pending' ? '100%' : '0%' }"></div>
                <span v-if="res.js > 0" class="bar-val">{{ res.js.toFixed(3) }}ms</span>
              </div>
            </div>
            <div class="bar-group">
              <div class="bar-label">WASM</div>
              <div class="bar-track">
                <div class="bar wasm-bar" :style="{ width: res.status === 'done' ? (res.wasm / res.js * 100) + '%' : '0%' }"></div>
                <span v-if="res.wasm > 0" class="bar-val">{{ res.wasm.toFixed(3) }}ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bench-container {
  margin: 2rem 0;
  background: var(--vp-c-bg-soft);
  border-radius: 20px;
  border: 1px solid var(--vp-c-divider);
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.15);
}

.bench-header {
  padding: 2rem;
  background: var(--vp-c-bg-mute);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--vp-c-divider);
}

.header-content h2 {
  margin: 0;
  font-size: 1.5rem;
  background: linear-gradient(135deg, var(--vp-c-brand-1), #a855f7);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
}

.simd-tag {
  font-size: 0.6rem;
  background: #22c55e;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  vertical-align: middle;
  margin-left: 10px;
  letter-spacing: 1px;
}

.header-content p {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.run-button {
  background: var(--vp-c-brand-1);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.run-button:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px var(--vp-c-brand-soft);
}

.run-button.is-running {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-2);
  cursor: wait;
}

.lab-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  height: 500px;
  overflow: hidden;
}

@media (max-width: 960px) {
  .lab-layout {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
  }
}

.logs-panel {
  background: #0f172a;
  border-right: 1px solid var(--vp-c-divider);
  display: flex;
  flex-direction: column;
  min-height: 300px;
}

.panel-header {
  padding: 0.8rem 1.2rem;
  background: #1e293b;
  color: #94a3b8;
  font-family: monospace;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.logs-content {
  flex: 1;
  padding: 1rem;
  font-family: 'Fira Code', monospace;
  font-size: 0.8rem;
  overflow-y: auto;
  color: #e2e8f0;
  scrollbar-width: thin;
}

.log-entry {
  margin-bottom: 0.4rem;
  line-height: 1.4;
  border-left: 2px solid #334155;
  padding-left: 0.8rem;
}

.empty-logs {
  color: #475569;
  font-style: italic;
  text-align: center;
  margin-top: 2rem;
}

.results-panel {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  background: var(--vp-c-bg);
  scrollbar-width: thin;
}

.category-header {
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--vp-c-brand-1);
  margin: 1.5rem 0 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--vp-c-brand-soft);
}

.result-card {
  padding: 1.2rem;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  transition: all 0.3s ease;
  opacity: 0.6;
}

.result-card.is-active {
  opacity: 1;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 15px var(--vp-c-brand-soft);
}

.result-card.is-done {
  opacity: 1;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-name {
  font-weight: 700;
  font-size: 0.95rem;
}

.ratio-badge {
  background: #22c55e22;
  color: #22c55e;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 800;
}

.running-tag {
  color: var(--vp-c-brand-1);
  font-size: 0.7rem;
  font-weight: 800;
  animation: pulse 1.5s infinite;
}

.bars {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.bar-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bar-label {
  width: 40px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--vp-c-text-2);
}

.bar-track {
  flex: 1;
  height: 16px;
  background: var(--vp-c-bg-mute);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.bar {
  height: 100%;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.js-bar { background: #94a3b844; }
.wasm-bar { background: linear-gradient(90deg, var(--vp-c-brand-1), #a855f7); }

.bar-val {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.65rem;
  font-family: monospace;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
