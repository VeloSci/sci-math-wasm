const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const path = require('path');

/**
 * Node.js Worker Pool for SciMathWasm
 */
class SciMathNodePool {
  constructor(workerCount = 4) {
    this.workers = [];
    this.workerCount = workerCount;
    this.queue = [];
  }

  async init(wasmPath) {
    for (let i = 0; i < this.workerCount; i++) {
        const worker = new Worker(`
            const { parentPort, workerData } = require('worker_threads');
            const init = require('${wasmPath}');
            
            parentPort.on('message', async (task) => {
                try {
                    const wasm = await init();
                    const result = wasm[task.fn](...task.args);
                    parentPort.postMessage({ id: task.id, result });
                } catch (e) {
                    parentPort.postMessage({ id: task.id, error: e.message });
                }
            });
        `, { eval: true });
        this.workers.push(worker);
    }
  }

  run(fn, ...args) {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9);
      const worker = this.workers[Math.floor(Math.random() * this.workers.length)];
      
      const handler = (msg) => {
        if (msg.id === id) {
          worker.removeListener('message', handler);
          if (msg.error) reject(new Error(msg.error));
          else resolve(msg.result);
        }
      };
      
      worker.on('message', handler);
      worker.postMessage({ id, fn, args });
    });
  }
}

module.exports = { SciMathNodePool };
