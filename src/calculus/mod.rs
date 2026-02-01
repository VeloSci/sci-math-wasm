use rayon::prelude::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = diff5Pt)]
pub fn numerical_diff(data: &[f64], h: f64) -> Vec<f64> {
    let mut out = vec![0.0; data.len()];
    diff_5pt_stencil(data, h, &mut out);
    out
}

#[wasm_bindgen(js_name = integrateSimpson)]
pub fn numerical_integrate(data: &[f64], h: f64) -> f64 {
    integrate_simpson(data, h)
}

/// Numerical Differentiation using 5-point Stencil (Central Difference) - Parallel
pub fn diff_5pt_stencil(data: &[f64], h: f64, out: &mut [f64]) {
    let n = data.len();
    if n < 5 { return; }

    let inv_12h = 1.0 / (12.0 * h);
    let in_ptr = data.as_ptr() as usize;
    let out_ptr = out.as_mut_ptr() as usize;
    
    // Boundaries (sequential)
    unsafe {
        let p_in = in_ptr as *const f64;
        let p_out = out_ptr as *mut f64;
        *p_out.add(0) = (*p_in.add(1) - *p_in.add(0)) / h;
        *p_out.add(1) = (*p_in.add(2) - *p_in.add(1)) / h;
        *p_out.add(n-2) = (*p_in.add(n-1) - *p_in.add(n-2)) / h;
        *p_out.add(n-1) = (*p_in.add(n-1) - *p_in.add(n-2)) / h;
    }

    // Parallel middle section
    (2..n-2).into_par_iter()
        .with_min_len(16384)
        .for_each(|i| unsafe {
            let p_in = in_ptr as *const f64;
            let p_out = out_ptr as *mut f64;
            *p_out.add(i) = inv_12h * (-*p_in.add(i+2) + 8.0 * *p_in.add(i+1) - 8.0 * *p_in.add(i-1) + *p_in.add(i-2));
        });
}

/// Numerical Integration using Simpson's 1/3 Rule - Parallel
pub fn integrate_simpson(data: &[f64], h: f64) -> f64 {
    let n = data.len();
    if n < 2 { return 0.0; }
    
    // For integration, we use parallel reduction
    // We split into even-index chunks to maintain Simpson parity
    let limit = if n % 2 == 1 { n - 1 } else { n - 2 };
    
    let sum_mid: f64 = (1..limit).into_par_iter()
        .with_min_len(32768)
        .map(|i| {
            let val = data[i];
            if i % 2 == 1 { 4.0 * val } else { 2.0 * val }
        })
        .sum();
    
    let mut result = (data[0] + data[n-1] + sum_mid) * (h / 3.0);

    if n % 2 == 0 {
        result += (data[n-2] + data[n-1]) * (h / 2.0);
    }
    result
}

/// Adaptive Simpson's Integration
pub fn integrate_adaptive(f: &dyn Fn(f64) -> f64, a: f64, b: f64, tol: f64) -> f64 {
    let c = (a + b) / 2.0;
    let fa = f(a);
    let fb = f(b);
    let fc = f(c);
    
    let mut total = 0.0;
    adaptive_simpson_recursive(f, a, b, tol, fa, fb, fc, simpson_rule(a, b, fa, fb, fc), 0, &mut total);
    total
}

fn simpson_rule(a: f64, b: f64, fa: f64, fb: f64, fc: f64) -> f64 {
    let h = (b - a) / 6.0;
    (fa + 4.0 * fc + fb) * h
}

fn adaptive_simpson_recursive(
    f: &dyn Fn(f64) -> f64, a: f64, b: f64, tol: f64, 
    fa: f64, fb: f64, fc: f64, whole: f64, depth: i32, total: &mut f64
) {
    let c = (a + b) / 2.0;
    let _h = (b - a) / 2.0;
    let d = (a + c) / 2.0;
    let e = (c + b) / 2.0;
    let fd = f(d);
    let fe = f(e);
    
    let left = simpson_rule(a, c, fa, fc, fd);
    let right = simpson_rule(c, b, fc, fb, fe);
    
    if depth > 20 || (left + right - whole).abs() <= 15.0 * tol {
        *total += left + right + (left + right - whole) / 15.0;
    } else {
        adaptive_simpson_recursive(f, a, c, tol / 2.0, fa, fc, fd, left, depth + 1, total);
        adaptive_simpson_recursive(f, c, b, tol / 2.0, fc, fb, fe, right, depth + 1, total);
    }
}
