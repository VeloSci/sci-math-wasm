<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const steps = [
  { 
    text: 'Analyzing mathematical kernels...', 
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>` 
  },
  { 
    text: 'Generating LLVM-IR bitcode...', 
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>` 
  },
  { 
    text: 'Applying SIMD vectorization...', 
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>` 
  },
  { 
    text: 'Registering memory safety guards...', 
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>` 
  },
  { 
    text: 'Optimizing WASM binary size...', 
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>` 
  },
  { 
    text: 'Injecting floating-point bounds...', 
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>` 
  },
  { 
    text: 'Verifying CDYLIB entry points...', 
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` 
  },
  { 
    text: 'Executing auto-parallelization...', 
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>` 
  }
]

const currentStep = ref(0)
const progress = ref(0)
const status = ref('OPTIMIZING')
const bits = ref('')
let timer: any = null

const updateBits = () => {
  bits.value = Array.from({ length: 40 }, () => Math.random() > 0.5 ? '1' : '0').join('')
}

onMounted(() => {
  timer = setInterval(() => {
    progress.value += 2
    updateBits()
    if (progress.value > 100) {
      progress.value = 0
      currentStep.value = (currentStep.value + 1) % steps.length
    }
  }, 100)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<template>
  <div class="opt-hud">
    <div class="hud-frame">
      <div class="hud-header">
        <span class="pulse-dot"></span>
        <span class="status-text">{{ status }} MODE</span>
        <span class="version-tag">WASM O3+LTO</span>
      </div>
      
      <div class="hud-body">
        <div class="step-indicator" v-html="steps[currentStep].icon"></div>
        <div class="text-content">
          <div class="step-label">PROCESS_INFO</div>
          <div class="step-text">{{ steps[currentStep].text }}</div>
          <div class="bitstream-container">
            <span class="bitstream">{{ bits }}</span>
          </div>
        </div>
      </div>

      <div class="hud-footer">
        <div class="progress-info">
          <span>TASK PROGRESS</span>
          <span>{{ progress }}%</span>
        </div>
        <div class="progress-bar">
          <div class="fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </div>
    
    <!-- Background glow -->
    <div class="hud-glow"></div>
  </div>
</template>

<style scoped>
.opt-hud {
  position: relative;
  width: 384px;
  height: 270px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  font-family: 'Fira Code', monospace;
  margin: 2rem auto;
  transform: translateY(-20px);
  opacity: 0.7; /* 50% Opacity as requested */
  transition: opacity 0.3s ease;
}

.opt-hud:hover {
  opacity: 0.8; /* Subtle lift on hover */
}

.hud-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 0.75rem;
  letter-spacing: 1px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #94a3b8; /* Neutral color */
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

.status-text {
  color: #94a3b8; /* Neutral color */
  font-weight: 600;
}

.version-tag {
  color: rgba(148, 163, 184, 0.5);
  margin-left: auto;
}

.hud-body {
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
  margin: 1.5rem 0;
}

.step-indicator {
  color: #94a3b8; /* Neutral color for SVGs */
  padding: 0.8rem;
  background: rgba(148, 163, 184, 0.05);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-indicator :deep(svg) {
  width: 20px; /* Smaller icon size */
  height: 20px;
}

.text-content {
  flex: 1;
  min-width: 0; /* Prevent horizontal overflow */
}

.step-label {
  font-size: 0.65rem;
  color: rgba(148, 163, 184, 0.6);
  margin-bottom: 0.3rem;
}

.step-text {
  font-size: 0.95rem;
  color: #f1f5f9;
  font-weight: 400;
  line-height: 1.4;
  word-wrap: break-word; /* Fix text clipping */
  min-height: 2.8em;
}

.bitstream-container {
  margin-top: 0.8rem;
  overflow: hidden;
  height: 20px;
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.15);
  padding: 0 0.6rem;
  border-radius: 4px;
}

.bitstream {
  font-family: inherit;
  font-size: 0.65rem;
  color: #94a3b8; /* Neutral color */
  opacity: 0.4;
  white-space: nowrap;
  letter-spacing: 1px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: rgba(148, 163, 184, 0.8);
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 4px;
  background: rgba(148, 163, 184, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: #94a3b8; /* Neutral progress bar */
  transition: width 0.1s linear;
}

.hud-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140%;
  height: 140%;
  background: radial-gradient(circle, rgba(148, 163, 184, 0.03) 0%, transparent 70%);
  pointer-events: none;
  z-index: -1;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.3); opacity: 0.8; }
  100% { transform: scale(1); opacity: 0.4; }
}
</style>
