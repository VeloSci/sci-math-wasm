use nalgebra::{DMatrix, DVector};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn solve_linear_system(
    flat_matrix: &[f64],
    matrix_rows: usize,
    matrix_cols: usize,
    target_vector: &[f64],
) -> Result<Vec<f64>, JsValue> {
    // 1. Reconstruct logical matrix from flat array
    // DMatrix::from_row_slice expects data in row-major order
    let a = DMatrix::from_row_slice(matrix_rows, matrix_cols, flat_matrix);
    let b = DVector::from_row_slice(target_vector);

    // 2. Compute using SVD or LU decomposition
    let lu = a.lu();
    let solution = lu
        .solve(&b)
        .ok_or_else(|| JsValue::from_str("Matrix is singular and cannot be solved"))?;

    // 3. Return a flattened vector to JS
    Ok(solution.data.as_vec().clone())
}
