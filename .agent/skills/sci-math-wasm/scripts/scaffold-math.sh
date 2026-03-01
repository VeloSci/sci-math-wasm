#!/bin/bash
# Scaffold a new math module
MODULE_NAME=$1

if [ -z "$MODULE_NAME" ]; then
  echo "Usage: ./scaffold-math.sh <module_name>"
  exit 1
fi

cat <<EOT > ../src/${MODULE_NAME}.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn fast_${MODULE_NAME}_compute(data: &[f64]) -> Vec<f64> {
    // Implement algorithm here
    data.to_vec()
}
EOT

echo "Created basic Rust template in src/${MODULE_NAME}.rs"
echo "Remember to expose it in src/lib.rs via 'pub mod ${MODULE_NAME};'"
