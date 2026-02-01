#!/bin/bash
set -e

echo "🚀 Simulating CI/CD Local Environment..."

echo "--- 1. Running Cargo Tests (Native) ---"
# Disable WASM-specific RUSTFLAGS for native cargo tests
export RUSTFLAGS=""
cargo test

echo "--- 2. Building WASM Modules ---"
export RUSTFLAGS="-C target-feature=+atomics,+bulk-memory,+mutable-globals"
pnpm wasm:build

echo "--- 3. Running JS/WASM Cross-Validation Tests ---"
# Vitest needs the WASM modules built with the right flags
pnpm test

echo "--- 4. Building Documentation Site ---"
pnpm docs:build

echo "✅ Local CI Simulation Complete!"
