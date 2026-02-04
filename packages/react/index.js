import { useState, useEffect, useMemo } from 'react';
import { init, mean, fft } from 'sci-math-wasm';

export function useMath(fn, deps) {
  const [state, setState] = useState({ result: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    setState(s => ({ ...s, loading: true }));
    
    Promise.resolve(fn())
      .then(result => {
        if (active) setState({ result, loading: false, error: null });
      })
      .catch(error => {
        if (active) setState({ result: null, loading: false, error });
      });

    return () => { active = false; };
  }, deps);

  return state;
}

export function useSciEngine() {
    // Integration with SciEngine
}
