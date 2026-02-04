use wasm_bindgen_test::*;
use sci_math_wasm::*;

#[wasm_bindgen_test]
fn test_accuracy_fft() {
    let input = vec![1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0];
    let result = rfft(&input).unwrap();
    // Reference check (DC component should be 4)
    assert!((result[0] - 4.0).abs() < 1e-10);
}

#[wasm_bindgen_test]
fn test_accuracy_svd() {
    let m = vec![1.0, 2.0, 3.0, 4.0];
    let res = svd(&m, 2, 2).unwrap();
    // U(4), S(2), Vt(4)
    assert_eq!(res.len(), 10);
    // Singular values for [[1,2],[3,4]] are approx 5.46 and 0.36
    assert!((res[4] - 5.464985).abs() < 1e-4);
    assert!((res[5] - 0.365966).abs() < 1e-4);
}
