//! # sci-math-wasm
//! 
//! A high-performance scientific mathematics library written in Rust and compiled to WebAssembly.
//! Designed for high-frequency calculations, data analysis, and signal processing in the browser.

pub mod basic;
pub mod stats;
pub mod linalg;
pub mod signal;
pub mod trig;
pub mod poly;
pub mod regression;
pub mod complex;
pub mod calculus;
pub mod units;
pub mod utils;
pub mod fast_math;
#[cfg(feature = "threads")]
pub mod engine;
pub mod fft;
pub mod analysis;
pub mod fitting;

use wasm_bindgen::prelude::*;
use js_sys::Promise;

#[cfg(all(feature = "wasm-threads", target_arch = "wasm32"))]
pub use wasm_bindgen_rayon::init_thread_pool as initThreadPool;

#[cfg(any(not(feature = "wasm-threads"), not(target_arch = "wasm32")))]
#[wasm_bindgen(js_name = initThreadPool)]
pub fn init_thread_pool_fallback(_n: usize) -> Promise {
    Promise::resolve(&JsValue::from_str("threads not supported on this platform/configuration"))
}

#[wasm_bindgen(js_name = initHooks)]
pub fn init_hooks() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen(start)]
pub fn main_js() {
    utils::set_panic_hook();
}

/// Returns the current version of the library.
#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
