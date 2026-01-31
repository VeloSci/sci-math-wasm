//! # Linear Algebra
//! 
//! Vector and Matrix operations for scientific computing.

use wasm_bindgen::prelude::*;

/// Calculates the dot product of two vectors.
/// 
/// $$ \mathbf{a} \cdot \mathbf{b} = \sum_{i=1}^{n} a_i b_i $$
/// 
/// # Arguments
/// * `a` - First vector.
/// * `b` - Second vector.
/// 
/// # Panics
/// Panics if vectors have different lengths.
#[wasm_bindgen]
pub fn dot_product(a: &[f64], b: &[f64]) -> Result<f64, JsValue> {
    if a.len() != b.len() {
        return Err(JsValue::from_str("Vectors must have the same length"));
    }
    Ok(a.iter().zip(b.iter()).map(|(x, y)| x * y).sum())
}

/// Normalizes a vector.
/// 
/// $$ \mathbf{\hat{V}} = \frac{\mathbf{V}}{\|\mathbf{V}\|} $$
#[wasm_bindgen]
pub fn normalize(v: &[f64]) -> Vec<f64> {
    let mag = v.iter().map(|x| x * x).sum::<f64>().sqrt();
    if mag == 0.0 {
        return v.to_vec();
    }
    v.iter().map(|x| x / mag).collect()
}

/// Multiplies two matrices represented as flat arrays.
/// 
/// $$ C_{ij} = \sum_{k=1}^{n} A_{ik} B_{kj} $$
/// 
/// # Arguments
/// * `a` - Matrix A flat array.
/// * `rows_a`, `cols_a` - Dimensions of A.
/// * `b` - Matrix B flat array.
/// * `rows_b`, `cols_b` - Dimensions of B.
#[wasm_bindgen]
pub fn matrix_multiply(
    a: &[f64], rows_a: usize, cols_a: usize, 
    b: &[f64], rows_b: usize, cols_b: usize
) -> Result<Vec<f64>, JsValue> {
    if cols_a != rows_b {
        return Err(JsValue::from_str("Incompatible dimensions for matrix multiplication"));
    }

    let mut result = vec![0.0; rows_a * cols_b];

    for i in 0..rows_a {
        for j in 0..cols_b {
            let mut sum = 0.0;
            for k in 0..cols_a {
                sum += a[i * cols_a + k] * b[k * cols_b + j];
            }
            result[i * cols_b + j] = sum;
        }
    }

    Ok(result)
}
