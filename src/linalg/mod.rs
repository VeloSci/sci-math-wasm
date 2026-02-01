use rayon::prelude::*;
use wasm_bindgen::prelude::*;

/// Calculates the dot product of two vectors - Parallel
#[wasm_bindgen]
pub fn dot_product(a: &[f64], b: &[f64]) -> Result<f64, JsValue> {
    if a.len() != b.len() {
        return Err(JsValue::from_str("Vectors must have the same length"));
    }
    // High-performance parallel sum of products
    Ok(a.par_iter().zip(b.par_iter())
        .with_min_len(8192)
        .map(|(&x, &y)| x * y)
        .sum())
}

/// Normalizes a vector - Parallel
#[wasm_bindgen]
pub fn normalize(v: &[f64]) -> Vec<f64> {
    let n = v.len();
    if n == 0 { return vec![]; }
    
    let mag_sq: f64 = v.par_iter()
        .with_min_len(8192)
        .map(|&x| x * x)
        .sum();
    let mag = mag_sq.sqrt();
    
    if mag < 1e-18 { return v.to_vec(); }
    
    v.par_iter()
     .with_min_len(8192)
     .map(|&x| x / mag)
     .collect()
}

/// Multiplies two matrices represented as flat arrays - Parallel
#[wasm_bindgen]
pub fn matrix_multiply(
    a: &[f64], rows_a: usize, cols_a: usize, 
    b: &[f64], rows_b: usize, cols_b: usize
) -> Result<Vec<f64>, JsValue> {
    if cols_a != rows_b {
        return Err(JsValue::from_str("Incompatible dimensions for matrix multiplication"));
    }

    let mut result = vec![0.0; rows_a * cols_b];
    let b_slice = b;

    // Parallelize over rows for better cache locality and thread balance
    result.par_chunks_mut(cols_b)
        .enumerate()
        .for_each(|(i, out_row)| {
            let a_row_off = i * cols_a;
            for k in 0..cols_a {
                let aik = a[a_row_off + k];
                let b_row_off = k * cols_b;
                for j in 0..cols_b {
                    out_row[j] += aik * b_slice[b_row_off + j];
                }
            }
        });

    Ok(result)
}

/// Transposes a matrix - Parallel
#[wasm_bindgen]
pub fn transpose(data: &[f64], rows: usize, cols: usize) -> Vec<f64> {
    let mut result = vec![0.0; rows * cols];
    let res_ptr = result.as_mut_ptr() as usize;
    let data_ptr = data.as_ptr() as usize;

    // Parallelize by output rows to avoid write contention
    (0..cols).into_par_iter()
        .with_min_len(128)
        .for_each(|j| unsafe {
            let r = res_ptr as *mut f64;
            let d = data_ptr as *const f64;
            for i in 0..rows {
                *r.add(j * rows + i) = *d.add(i * cols + j);
            }
        });
    
    result
}

/// Inverts a 2x2 matrix.
#[wasm_bindgen]
pub fn invert_2x2(m: &[f64]) -> Result<Vec<f64>, JsValue> {
    if m.len() != 4 {
        return Err(JsValue::from_str("Matrix must be 2x2"));
    }
    let det = m[0] * m[3] - m[1] * m[2];
    if det.abs() < 1e-18 { return Err(JsValue::from_str("Matrix is singular")); }
    let inv_det = 1.0 / det;
    Ok(vec![m[3] * inv_det, -m[1] * inv_det, -m[2] * inv_det, m[0] * inv_det])
}

/// Inverts a 3x3 matrix.
#[wasm_bindgen]
pub fn invert_3x3(m: &[f64]) -> Result<Vec<f64>, JsValue> {
    if m.len() != 9 {
        return Err(JsValue::from_str("Matrix must be 3x3"));
    }
    let det = m[0] * (m[4] * m[8] - m[5] * m[7]) -
              m[1] * (m[3] * m[8] - m[5] * m[6]) +
              m[2] * (m[3] * m[7] - m[4] * m[6]);

    if det.abs() < 1e-18 { return Err(JsValue::from_str("Matrix is singular")); }
    let inv_det = 1.0 / det;
    Ok(vec![
        (m[4] * m[8] - m[5] * m[7]) * inv_det, (m[2] * m[7] - m[1] * m[8]) * inv_det, (m[1] * m[5] - m[2] * m[4]) * inv_det,
        (m[5] * m[6] - m[3] * m[8]) * inv_det, (m[0] * m[8] - m[2] * m[6]) * inv_det, (m[2] * m[3] - m[0] * m[5]) * inv_det,
        (m[3] * m[7] - m[4] * m[6]) * inv_det, (m[1] * m[6] - m[0] * m[7]) * inv_det, (m[0] * m[4] - m[1] * m[3]) * inv_det,
    ])
}
