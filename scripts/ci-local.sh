#!/bin/bash
set -e

echo "🚀 Simulating CI/CD Local Environment..."

echo "--- 1. Checking Host Compilation (Native) ---"
# Check that it compiles with threads enabled
export RUSTFLAGS=""
cargo check --features threads

echo "--- 2. Building WASM Modules ---"
export RUSTFLAGS="-C target-feature=+atomics,+bulk-memory,+mutable-globals,+simd128"
pnpm wasm:build

echo "--- 3. SKIPPING TESTS (User Request) ---"
# pnpm test

echo "--- 4. Building Documentation Site ---"
pnpm docs:build

echo "✅ Local CI Simulation Complete!"
