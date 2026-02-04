use rayon::prelude::*;
use wasm_bindgen::prelude::*;

/// Calculates the dot product of two vectors - Parallel + SIMD
#[wasm_bindgen(js_name = dotProduct)]
pub fn dot_product(a: &[f64], b: &[f64]) -> Result<f64, JsValue> {
    if a.len() != b.len() {
        return Err(JsValue::from_str("Vectors must have the same length"));
    }

    // Attempt SIMD if available and array is large enough
    #[cfg(target_feature = "simd128")]
    {
        if a.len() >= 4096 {
            return Ok(dot_product_simd(a, b));
        }
    }

    // Fallback to parallel standard version
    Ok(a.par_iter().zip(b.par_iter())
        .with_min_len(8192)
        .map(|(&x, &y)| x * y)
        .sum())
}

#[cfg(target_feature = "simd128")]
fn dot_product_simd(a: &[f64], b: &[f64]) -> f64 {
    use core::arch::wasm32::*;
    let n = a.len();
    let chunks = n / 2;
    let mut sum_v = f64x2_splat(0.0);
    
    unsafe {
        let mut pa = a.as_ptr();
        let mut pb = b.as_ptr();
        
        for _ in 0..chunks {
            let va = v128_load(pa as *const v128);
            let vb = v128_load(pb as *const v128);
            sum_v = f64x2_add(sum_v, f64x2_mul(va, vb));
            pa = pa.add(2);
            pb = pb.add(2);
        }
    }
    
    // Horizontal sum
    let mut res = [0.0; 2];
    unsafe { v128_store(res.as_mut_ptr() as *mut v128, sum_v); }
    let mut total = res[0] + res[1];
    
    // Remainder
    for i in (chunks * 2)..n {
        total += a[i] * b[i];
    }
    total
}

/// Computes the QR decomposition of a matrix - Gram-Schmidt (Parallel)
/// Returns [Q, R] as flattened vectors.
#[wasm_bindgen]
pub fn qr(matrix: &[f64], rows: usize, cols: usize) -> Result<Vec<f64>, JsValue> {
    if rows * cols != matrix.len() {
        return Err(JsValue::from_str("Matrix dimensions do not match data length"));
    }
    
    let mut q = vec![0.0; rows * cols];
    let mut r = vec![0.0; cols * cols];
    
    // Simplistic Gram-Schmidt implementation
    for j in 0..cols {
        // v = a_j
        let mut v = Vec::with_capacity(rows);
        for i in 0..rows {
            v.push(matrix[i * cols + j]);
        }
        
        for i in 0..j {
            // r[i, j] = q_i^T * a_j
            let mut rij = 0.0;
            for k in 0..rows {
                rij += q[k * cols + i] * matrix[k * cols + j];
            }
            r[i * cols + j] = rij;
            
            // v = v - r[i, j] * q_i
            for k in 0..rows {
                v[k] -= rij * q[k * cols + i];
            }
        }
        
        // r[j, j] = ||v||
        let norm = v.iter().map(|&x| x * x).sum::<f64>().sqrt();
        r[j * cols + j] = norm;
        
        // q_j = v / r[j, j]
        if norm > 1e-10 {
            for k in 0..rows {
                q[k * cols + j] = v[k] / norm;
            }
        }
    }
    
    let mut result = Vec::with_capacity(q.len() + r.len());
    result.extend(q);
    result.extend(r);
    Ok(result)
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
#[wasm_bindgen(js_name = matrixMultiply)]
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
#[wasm_bindgen(js_name = invert2x2)]
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
#[wasm_bindgen(js_name = invert3x3)]
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

/// Solves a linear system Ax = B using Gaussian elimination with partial pivoting.
#[wasm_bindgen(js_name = solveLinearSystem)]
pub fn solve_linear_system(a: &[f64], b: &[f64], n: usize) -> Result<Vec<f64>, JsValue> {
    if a.len() != n * n || b.len() != n {
        return Err(JsValue::from_str("Invalid dimensions for linear system"));
    }

    let mut a_copy = a.to_vec();
    let mut b_copy = b.to_vec();

    for i in 0..n {
        // Partial pivoting
        let mut max_row = i;
        let mut max_val = a_copy[i * n + i].abs();
        for k in i + 1..n {
            let val = a_copy[k * n + i].abs();
            if val > max_val {
                max_val = val;
                max_row = k;
            }
        }

        if max_val < 1e-18 {
            return Err(JsValue::from_str("Matrix is singular or nearly singular"));
        }

        // Swap rows in A and B
        if max_row != i {
            for k in i..n {
                a_copy.swap(i * n + k, max_row * n + k);
            }
            b_copy.swap(i, max_row);
        }

        // Elimination
        let pivot = a_copy[i * n + i];
        for k in i..n {
            a_copy[i * n + k] /= pivot;
        }
        b_copy[i] /= pivot;

        for k in 0..n {
            if k != i {
                let factor = a_copy[k * n + i];
                for j in i..n {
                    a_copy[k * n + j] -= factor * a_copy[i * n + j];
                }
                b_copy[k] -= factor * b_copy[i];
            }
        }
    }

    Ok(b_copy)
}

/// Computes the Singular Value Decomposition (SVD) of a matrix.
/// Returns [U, S, Vt] as flattened vectors.
#[wasm_bindgen]
pub fn svd(matrix: &[f64], rows: usize, cols: usize) -> Result<Vec<f64>, JsValue> {
    use nalgebra::DMatrix;
    if matrix.len() != rows * cols { return Err(JsValue::from_str("Invalid dimensions")); }
    let m = DMatrix::from_row_slice(rows, cols, matrix);
    let svd = m.svd(true, true);
    
    let u = svd.u.as_ref().map(|m| m.as_slice().to_vec()).unwrap_or_default();
    let s = svd.singular_values.as_slice().to_vec();
    let v_t = svd.v_t.as_ref().map(|m| m.as_slice().to_vec()).unwrap_or_default();
    
    let mut res = Vec::with_capacity(u.len() + s.len() + v_t.len());
    res.extend(u);
    res.extend(s);
    res.extend(v_t);
    Ok(res)
}

/// Computes the LU decomposition (with partial pivoting) of a square matrix.
/// Returns [L, U, P] as flattened vectors.
#[wasm_bindgen]
pub fn lu(matrix: &[f64], n: usize) -> Result<Vec<f64>, JsValue> {
    use nalgebra::DMatrix;
    if matrix.len() != n * n { return Err(JsValue::from_str("Matrix must be square")); }
    let m = DMatrix::from_row_slice(n, n, matrix);
    let lu = m.full_piv_lu();
    
    let l = lu.l();
    let u = lu.u();
    
    let mut res = Vec::with_capacity(3 * n * n);
    res.extend(l.as_slice());
    res.extend(u.as_slice());
    let mut p_mat = DMatrix::identity(n, n);
    lu.p().permute_rows(&mut p_mat);
    res.extend(p_mat.as_slice());
    Ok(res)
}

/// Computes the Cholesky decomposition of a symmetric positive-definite matrix.
#[wasm_bindgen]
pub fn cholesky(matrix: &[f64], n: usize) -> Result<Vec<f64>, JsValue> {
    use nalgebra::DMatrix;
    if matrix.len() != n * n { return Err(JsValue::from_str("Matrix must be square")); }
    let m = DMatrix::from_row_slice(n, n, matrix);
    if let Some(chol) = m.cholesky() {
        Ok(chol.unpack().as_slice().to_vec())
    } else {
        Err(JsValue::from_str("Matrix is not positive-definite"))
    }
}

/// Calculates the determinant of a square matrix.
#[wasm_bindgen]
pub fn determinant(matrix: &[f64], n: usize) -> Result<f64, JsValue> {
    use nalgebra::DMatrix;
    if matrix.len() != n * n { return Err(JsValue::from_str("Matrix must be square")); }
    let m = DMatrix::from_row_slice(n, n, matrix);
    Ok(m.determinant())
}

/// Calculates the rank of a matrix.
#[wasm_bindgen]
pub fn rank(matrix: &[f64], rows: usize, cols: usize) -> Result<usize, JsValue> {
    use nalgebra::DMatrix;
    if matrix.len() != rows * cols { return Err(JsValue::from_str("Invalid dimensions")); }
    let m = DMatrix::from_row_slice(rows, cols, matrix);
    Ok(m.rank(1e-10))
}

/// Computes the Moore-Penrose pseudo-inverse of a matrix.
#[wasm_bindgen(js_name = pseudoInverse)]
pub fn pseudo_inverse(matrix: &[f64], rows: usize, cols: usize) -> Result<Vec<f64>, JsValue> {
    use nalgebra::DMatrix;
    if matrix.len() != rows * cols { return Err(JsValue::from_str("Invalid dimensions")); }
    let m = DMatrix::from_row_slice(rows, cols, matrix);
    if let Ok(pinv) = m.pseudo_inverse(1e-10) {
        Ok(pinv.as_slice().to_vec())
    } else {
        Err(JsValue::from_str("Failed to compute pseudo-inverse"))
    }
}

/// Computes the eigenvalues of a square matrix.
/// Returns complex eigenvalues as [re1, im1, re2, im2, ...].
#[wasm_bindgen]
pub fn eigenvalues(matrix: &[f64], n: usize) -> Result<Vec<f64>, JsValue> {
    use nalgebra::DMatrix;
    if matrix.len() != n * n { return Err(JsValue::from_str("Matrix must be square")); }
    let m = DMatrix::from_row_slice(n, n, matrix);
    
    let eigen = m.complex_eigenvalues();
    let mut res = Vec::with_capacity(n * 2);
    for e in eigen.iter() {
        res.push(e.re);
        res.push(e.im);
    }
    Ok(res)
}

/// Calculates the trace of a square matrix.
#[wasm_bindgen]
pub fn trace(matrix: &[f64], n: usize) -> Result<f64, JsValue> {
    if matrix.len() != n * n { return Err(JsValue::from_str("Matrix must be square")); }
    let mut tr = 0.0;
    for i in 0..n {
        tr += matrix[i * n + i];
    }
    Ok(tr)
}

/// Calculates the determinant using LU decomposition.
#[wasm_bindgen(js_name = detLU)]
pub fn det_lu(matrix: &[f64], n: usize) -> Result<f64, JsValue> {
    use nalgebra::DMatrix;
    if matrix.len() != n * n { return Err(JsValue::from_str("Matrix must be square")); }
    let m = DMatrix::from_row_slice(n, n, matrix);
    Ok(m.determinant()) 
    // nalgebra uses LU for determinant calculation efficiency already for square matrices generally
}
