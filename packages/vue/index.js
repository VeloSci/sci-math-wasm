import { ref, watch, onMounted } from 'vue';
import { init, mean, fft } from 'sci-math-wasm';

export function useMath(asyncFn, deps) {
  const result = ref(null);
  const loading = ref(true);
  const error = ref(null);

  const execute = async () => {
    loading.value = true;
    try {
      result.value = await asyncFn();
      error.value = null;
    } catch (e) {
      error.value = e;
      result.value = null;
    } finally {
      loading.value = false;
    }
  };

  onMounted(execute);
  if (deps) watch(deps, execute);

  return { result, loading, error, execute };
}
