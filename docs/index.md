---
layout: home

hero:
  name: "SciMath WASM"
  text: "High-performance Scientific Mathematics"
  tagline: "Rust-powered mathematical engine for the modern web."
  image:
    src: /logo.svg
    alt: SciMath Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/VeloSci/sci-math-wasm

features:
  - title: 🚀 Ultra Fast
    details: Compiled to WebAssembly with LLVM optimizations for near-native performance.
  - title: 📊 Scientific Grade
    details: Robust implementations of FFT, Regression, Linear Algebra, and Calculus.
  - title: 📦 Typed & Reliable
    details: Full TypeScript types and Rust-backed memory safety.
  - title: 📐 Math-Heavy
    details: Support for Complex numbers, Polynomials, and Advanced Statistics.
---

## Why SciMath?

Standard JavaScript `Math` object is limited. For scientific applications, you need:
- Precise control over memory and types.
- Highly optimized algorithms for large datasets.
- Advanced features like FFT and Matrix operations which are slow in pure JS.

SciMath brings the power of **Rust** to your browser, offering a seamless API while handling the heavy lifting in WASM.
