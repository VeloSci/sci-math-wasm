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

use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn main_js() {
    utils::set_panic_hook();
}

/// Returns the current version of the library.
#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
