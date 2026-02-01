let wasmProvider: any = null;

/**
 * Sets the WASM module provider for the JS mirrors.
 * This allows the pure TS implementations to delegate to WASM for better performance.
 */
export function setWasmProvider(provider: any) {
    wasmProvider = provider;
}

/**
 * Gets the current WASM provider.
 */
export function getWasmProvider() {
    return wasmProvider;
}
