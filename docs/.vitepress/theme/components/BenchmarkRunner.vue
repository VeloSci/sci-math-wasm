<script setup lang="ts">
import { ref, onUnmounted, nextTick, computed } from 'vue'
import './BenchmarkRunner.css'

interface BenchResult {
  id: string;
  name: string;
  js: number;
  wasm: number;
  ratio: number;
  status: 'pending' | 'running' | 'done';
}

const results = ref<Record<string, BenchResult>>({
  'io_csv_small': { id: 'io_csv_small', name: 'CSV Parsing (10K rows)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'io_csv_numeric_large': { id: 'io_csv_numeric_large', name: 'CSV Parsing (100K rows)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'io_csv_columnar': { id: 'io_csv_columnar', name: 'CSV Columnar (100K rows)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'io_mpt': { id: 'io_mpt', name: 'MPT File Processing', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'io_format_detection': { id: 'io_format_detection', name: 'Format Detection', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  // 'nbody': { id: 'nbody', name: 'N-Body Turbo (f32x4 SIMD)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'calculus': { id: 'calculus', name: 'Calculus (Diff+Integ 1M pts)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'deconvolution': { id: 'deconvolution', name: 'Deconvolution (100k pts)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'filters': { id: 'filters', name: 'Butterworth Filter (1M pts)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'analysis_fitting': { id: 'analysis_fitting', name: 'Analysis & Fitting (1M pts)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'stats_adv': { id: 'stats_adv', name: 'Advanced Stats (Mode/Skew/Kurt)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'linalg_trace': { id: 'linalg_trace', name: 'Matrix Trace (1024x1024)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'linalg_det': { id: 'linalg_det', name: 'Matrix Determinant (8x8)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'signal_adv': { id: 'signal_adv', name: 'Signal Resample/Decimate', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'optimization_ga': { id: 'optimization_ga', name: 'Genetic Algorithm', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'fft': { id: 'fft', name: 'FFT (65k Points)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
  'matmul': { id: 'matmul', name: 'Matrix Matmul (f64 Blocked)', js: 0, wasm: 0, ratio: 0, status: 'pending' },
})

const logs = ref<string[]>([])
const isRunning = ref(false)
const finished = ref(false)
const currentTaskId = ref<string | null>(null)
let worker: Worker | null = null

const activeTask = computed(() => currentTaskId.value ? results.value[currentTaskId.value] : null)
const sortedResults = computed(() => Object.values(results.value).filter(r => r.status === 'done').sort((a,b) => b.ratio - a.ratio))
const maxRatio = computed(() => {
  const vals = sortedResults.value.map(r => r.ratio)
  return vals.length ? Math.max(...vals).toFixed(1) : '0.0'
})

const addLog = (msg: string) => {
  logs.value.push(msg)
  if (logs.value.length > 100) logs.value.shift()
  nextTick(() => {
    const el = document.getElementById('bench-terminal')
    if (el) el.scrollTop = el.scrollHeight
  })
}

const startBenchmarks = () => {
  if (isRunning.value) return
  isRunning.value = true
  finished.value = false
  logs.value = []
  for(const key in results.value) {
    results.value[key].status = 'pending'
    results.value[key].ratio = 0
  }

  console.log('Creating worker...')
  worker = new Worker(new URL('../workers/bench.worker.ts', import.meta.url), { type: 'module' })
  
  worker.onerror = (error) => {
    console.error('Worker error:', error)
    addLog(`Worker initialization error: ${error.message}`)
    isRunning.value = false
  }
  
  worker.onmessage = (e) => {
    console.log('Worker message:', e.data)
    const { type, message, id, status, js, wasm, ratio } = e.data
    switch (type) {
      case 'log': addLog(message); break
      case 'status': if (id) { currentTaskId.value = id; results.value[id].status = status; } break
      case 'result': if (results.value[id]) results.value[id] = { ...results.value[id], js, wasm, ratio, status: 'done' }; break
      case 'done':
        isRunning.value = false; finished.value = true; currentTaskId.value = null; worker?.terminate();
        break
      case 'error': addLog(`CRITICAL ERROR: ${message}`); isRunning.value = false; worker?.terminate(); break
    }
  }
  
  console.log('Posting start message to worker...')
  worker.postMessage({ type: 'start' })
}

onUnmounted(() => worker?.terminate())
</script>

<template>
  <div class="lab-viewport">
    <div class="lab-nav">
      <div class="brand">
        <svg class="lab-icon" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#3b82f6"/><stop offset="100%" style="stop-color:#00f2ff"/>
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <path d="M32 4L56 18V46L32 60L8 46V18L32 4Z" stroke="url(#logoGrad)" stroke-width="2.5" fill="none" filter="url(#glow)"/>
          <path d="M22 24 L42 24 L32 32 L42 40 L22 40" stroke="url(#logoGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="32" cy="7" r="1.5" fill="#00f2ff" filter="url(#glow)"/>
        </svg>
        <span>VELOSCI <span class="highlight">SINGULARITY</span></span>
      </div>
      <button @click="startBenchmarks" :disabled="isRunning" class="btn-primary" :class="{ pulse: isRunning }">
        {{ isRunning ? 'SINGULARITY ACTIVE' : 'IGNITE CORE' }}
      </button>
    </div>

    <div class="main-stage">
      <transition name="fade">
        <div v-if="isRunning && activeTask" class="execution-wrapper">
          <div class="visual-center" >
            <div class="logo-wrapper">
              <svg class="app-logo-anim" viewBox="0 0 64 64" fill="none">
                <path d="M32 4L56 18V46L32 60L8 46V18L32 4Z" stroke="url(#logoGrad)" stroke-width="2.5" fill="none" class="hexagon-path"/>
                <path d="M22 24 L42 24 L32 32 L42 40 L22 40" stroke="url(#logoGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="sigma-path"/>
                <circle cx="32" cy="7" r="3" fill="#00f2ff" class="logo-electron"/>
              </svg>
              <div class="scanning-beam"></div>
            </div>
            <div class="task-info">
              <div class="running-label">EXECUTING KERNEL</div>
              <div class="task-name">{{ activeTask.name }}</div>
              <div class="thread-count">16-THREAD PARALLEL CLUSTER ACTIVE</div>
            </div>
          </div>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="finished" id="scroll-container" class="results-dashboard custom-scroll">
          <div class="scroll-content">
            <div class="animated-sticky-header">
              
              <div class="bench-header">
                <div class="bench-row header">
                  <div class="col-algo">ALGORITHM</div>
                  <div class="col-js text-right">JS RUNTIME</div>
                  <div class="col-wasm text-right">WASM CORE</div>
                  <div class="col-accel text-right">ACCELERATION</div>
                </div>
              </div>
            </div>
            <div class="bench-body">
              <div v-for="res in sortedResults" :key="res.id" class="bench-row" :class="{ 'highlight-row': res.ratio > 20 }">
                <div class="col-algo font-bold">{{ res.name }}</div>
                <div class="col-js text-right opacity-60 font-mono">{{ res.js.toFixed(3) }}ms</div>
                <div class="col-wasm text-right font-mono text-brand">{{ res.wasm.toFixed(3) }}ms</div>
                <div class="col-accel text-right">
                  <span class="boost-tag" :style="{ background: res.ratio > 20 ? 'var(--glow-green)' : 'var(--glow-blue)' }">{{ res.ratio.toFixed(2) }}x</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
      <div v-if="!isRunning && !finished" class="idle-state">
        <svg class="lab-icon" style="width: 120px; height: 120px; margin-bottom: 2rem; opacity: 0.5" viewBox="0 0 64 64" fill="none">
          <path d="M32 4L56 18V46L32 60L8 46V18L32 4Z" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" fill="none"/>
        </svg>
        <div class="glitch-text">STANDBY</div>
      </div>
    </div>

    <div class="lab-terminal">
      <div class="terminal-header">
        <div class="dots" style="display: flex; gap: 2px;"><span></span><span></span><span></span></div>
        <div class="title">IO SYSTEM CONSOLE v0.2.5</div>
      </div>
      <div id="bench-terminal" class="terminal-content custom-scroll">
        <div v-for="(log, i) in logs" :key="i" class="log-line">
          <span class="prompt" style="color: #00f2ff; margin-right: 10px;">></span> {{ log }}
        </div>
        <div v-if="isRunning" class="cursor">_</div>
      </div>
    </div>
  </div>
</template>
