import * as basic from './js-mirror/basic';
import * as analysis from './js-mirror/analysis';
import * as stats from './js-mirror/stats';
import * as linalg from './js-mirror/linalg';
import * as signal from './js-mirror/signal';
import * as fitting from './js-mirror/fitting';
import * as poly from './js-mirror/poly';
import * as calculus from './js-mirror/calculus';
import { Complex } from './js-mirror/complex';
import { SciEngineJS } from './js-mirror/engine';

/**
 * SciMathJS provides a pure TypeScript implementation of the SciMathWASM engine.
 * Users can choose between WASM and JS implementations depending on their needs.
 */
export const SciMathJS = {
  ...basic,
  ...analysis,
  ...stats,
  ...linalg,
  ...signal,
  ...fitting,
  ...poly,
  ...calculus,
  Complex,
  SciEngineJS
};

// Export individual modules as well
export { basic, analysis, stats, linalg, signal, fitting, poly, calculus, Complex, SciEngineJS };
