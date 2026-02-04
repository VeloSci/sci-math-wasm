const { Transform } = require('stream');

/**
 * A transform stream that applies FFT to chunks of data.
 * @param {Object} options
 * @param {number} options.windowSize Size of the FFT window (power of 2)
 * @param {number} options.overlap Overlap fraction (0 to 1)
 * @param {Function} options.fftFn The FFT function from sci-math-wasm
 */
class FFTStream extends Transform {
  constructor(options) {
    super({ objectMode: true });
    this.windowSize = options.windowSize || 1024;
    this.overlap = options.overlap || 0;
    this.fftFn = options.fftFn;
    this.buffer = new Float64Array(0);
    this.hopSize = Math.floor(this.windowSize * (1 - this.overlap));
  }

  _transform(chunk, encoding, callback) {
    // Merge new data with residual buffer
    const newBuffer = new Float64Array(this.buffer.length + chunk.length);
    newBuffer.set(this.buffer);
    newBuffer.set(chunk, this.buffer.length);
    this.buffer = newBuffer;

    while (this.buffer.length >= this.windowSize) {
      const window = this.buffer.slice(0, this.windowSize);
      try {
        const spectrum = this.fftFn(window);
        this.push(spectrum);
      } catch (e) {
        return callback(e);
      }
      this.buffer = this.buffer.slice(this.hopSize);
    }
    callback();
  }
}

function createFFTStream(options) {
  return new FFTStream(options);
}

module.exports = { createFFTStream };
