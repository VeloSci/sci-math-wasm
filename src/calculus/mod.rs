use rayon::prelude::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = diff5Pt)]
pub fn numerical_diff(data: &[f64], h: f64) -> Vec<f64> {
    let mut out = vec![0.0; data.len()];
    unsafe { diff_5pt_stencil(data, h, &mut out); }
    out
}

#[wasm_bindgen(js_name = integrateSimpson)]
pub fn numerical_integrate(data: &[f64], h: f64) -> f64 {
    integrate_simpson(data, h)
}

/// Calculates the numerical gradient of a function sampled at points `x`.
#[wasm_bindgen]
pub fn gradient(data: &[f64], h: f64) -> Vec<f64> {
    let mut out = vec![0.0; data.len()];
    unsafe { diff_5pt_stencil(data, h, &mut out); }
    out
}

/// Calculates the numerical derivative using the 5-point stencil method.
pub unsafe fn diff_5pt_stencil(input: &[f64], h: f64, output: &mut [f64]) {
    let n = input.len();
    if n < 5 { return; }

    let inv_12h = 1.0 / (12.0 * h);
    let in_ptr = input.as_ptr() as usize;
    let out_ptr = output.as_mut_ptr() as usize;
    
    // Boundaries (sequential)
    let p_in = in_ptr as *const f64;
    let p_out = out_ptr as *mut f64;
    *p_out.add(0) = (*p_in.add(1) - *p_in.add(0)) / h;
    *p_out.add(1) = (*p_in.add(2) - *p_in.add(1)) / h;
    *p_out.add(n-2) = (*p_in.add(n-1) - *p_in.add(n-2)) / h;
    *p_out.add(n-1) = (*p_in.add(n-1) - *p_in.add(n-2)) / h;

    // Parallel middle section
    (2..n-2).into_par_iter()
        .with_min_len(16384)
        .for_each(|i| {
            let p_in = in_ptr as *const f64;
            let p_out = out_ptr as *mut f64;
            *p_out.add(i) = inv_12h * (-*p_in.add(i+2) + 8.0 * *p_in.add(i+1) - 8.0 * *p_in.add(i-1) + *p_in.add(i-2));
        });
}

/// Numerical Integration using Simpson's 1/3 Rule - Parallel
pub fn integrate_simpson(data: &[f64], h: f64) -> f64 {
    let n = data.len();
    if n < 2 { return 0.0; }
    
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
    let fa = f(a);
    let fb = f(b);
    let c = (a + b) / 2.0;
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

/// Brent's Method for Root Finding
/// Finds a root of function `f` in the interval `[a, b]`.
#[wasm_bindgen]
pub fn roots_brent(f: &js_sys::Function, a: f64, b: f64, tol: f64) -> Result<f64, JsValue> {
    let mut a = a;
    let mut b = b;
    let mut fa = f.call1(&JsValue::NULL, &JsValue::from_f64(a))?
        .as_f64().ok_or_else(|| JsValue::from_str("Function must return a number"))?;
    let mut fb = f.call1(&JsValue::NULL, &JsValue::from_f64(b))?
        .as_f64().ok_or_else(|| JsValue::from_str("Function must return a number"))?;
    
    if fa * fb > 0.0 {
        return Err(JsValue::from_str("Root must be bracketed"));
    }
    
    let mut c = a;
    let mut fc = fa;
    let mut d = b - a;
    let mut e = d;
    
    for _ in 0..100 {
        if fb * fc > 0.0 {
            c = a; fc = fa; d = b - a; e = d;
        }
        if fc.abs() < fb.abs() {
            a = b; b = c; c = a;
            fa = fb; fb = fc; fc = fa;
        }
        
        let m = 0.5 * (c - b);
        if m.abs() <= tol || fb == 0.0 { return Ok(b); }
        
        if e.abs() >= tol && fa.abs() > fb.abs() {
            let s = fb / fa;
            let (p, q) = if a == c {
                (2.0 * m * s, 1.0 - s)
            } else {
                let r = fa / fc;
                let t = fb / fc;
                (s * (2.0 * m * r * (r - t) - (b - a) * (t - 1.0)), (r - 1.0) * (s - 1.0) * (t - 1.0))
            };
            
            let (p, q) = if p > 0.0 { (p, -q) } else { (-p, q) };
            if 2.0 * p < (3.0 * m * q - (tol * q).abs()).min((e * q).abs()) {
                e = d; d = p / q;
            } else {
                d = m; e = d;
            }
        } else {
            d = m; e = d;
        }
        
        a = b; fa = fb;
        if d.abs() > tol { b += d; } else { b += if m > 0.0 { tol } else { -tol }; }
        fb = f.call1(&JsValue::NULL, &JsValue::from_f64(b))?
            .as_f64().ok_or_else(|| JsValue::from_str("Function must return a number"))?;
    }
    
    Ok(b)
}

/// Runge-Kutta 4th Order ODE Solver
/// Solves dy/dt = f(t, y) from t_start to t_end
#[wasm_bindgen]
pub fn ode45_rk4(f: &js_sys::Function, y0: f64, t_start: f64, t_end: f64, steps: usize) -> Result<Vec<f64>, JsValue> {
    let h = (t_end - t_start) / steps as f64;
    let mut t = t_start;
    let mut y = y0;
    let mut res = Vec::with_capacity(steps + 1);
    res.push(y);
    
    for _ in 0..steps {
        let k1 = f.call2(&JsValue::NULL, &JsValue::from_f64(t), &JsValue::from_f64(y))?
            .as_f64().ok_or_else(|| JsValue::from_str("RK4: Function must return a number"))?;
        let k2 = f.call2(&JsValue::NULL, &JsValue::from_f64(t + 0.5 * h), &JsValue::from_f64(y + 0.5 * h * k1))?
            .as_f64().ok_or_else(|| JsValue::from_str("RK4: Function must return a number"))?;
        let k3 = f.call2(&JsValue::NULL, &JsValue::from_f64(t + 0.5 * h), &JsValue::from_f64(y + 0.5 * h * k2))?
            .as_f64().ok_or_else(|| JsValue::from_str("RK4: Function must return a number"))?;
        let k4 = f.call2(&JsValue::NULL, &JsValue::from_f64(t + h), &JsValue::from_f64(y + h * k3))?
            .as_f64().ok_or_else(|| JsValue::from_str("RK4: Function must return a number"))?;
        
        y += (h / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
        t += h;
        res.push(y);
    }
    
    Ok(res)
}

/// Linear Interpolation for a set of points
#[wasm_bindgen]
pub fn interpolate_linear(x: &[f64], y: &[f64], xi: &[f64]) -> Result<Vec<f64>, JsValue> {
    if x.len() != y.len() || x.len() < 2 {
        return Err(JsValue::from_str("Invalid input dimensions for interpolation"));
    }
    
    let mut res = Vec::with_capacity(xi.len());
    for &val in xi {
        if val <= x[0] { res.push(y[0]); continue; }
        if val >= x[x.len()-1] { res.push(y[y.len()-1]); continue; }
        
        // Binary search for interval
        let idx = x.binary_search_by(|v| v.partial_cmp(&val).unwrap()).unwrap_or_else(|e| e);
        let i = idx.max(1) - 1;
        
        let t = (val - x[i]) / (x[i+1] - x[i]);
        res.push(y[i] * (1.0 - t) + y[i+1] * t);
    }
    Ok(res)
}

/// Calculates the numerical Hessian of a scalar field at a given point `x`.
/// Returns the nxn matrix as a flattened vector.
#[wasm_bindgen]
pub fn hessian(f: &js_sys::Function, x: &[f64], h: f64) -> Result<Vec<f64>, JsValue> {
    let n = x.len();
    let mut res = vec![0.0; n * n];
    
    for i in 0..n {
        for j in 0..n {
            let mut xi = x.to_vec();
            let mut xj = x.to_vec();
            let mut xij = x.to_vec();
            
            xi[i] += h;
            xj[j] += h;
            xij[i] += h;
            xij[j] += h;
            
            let f0 = f.apply(&JsValue::NULL, &to_array(x))?.as_f64().unwrap_or(0.0);
            let fi = f.apply(&JsValue::NULL, &to_array(&xi))?.as_f64().unwrap_or(0.0);
            let fj = f.apply(&JsValue::NULL, &to_array(&xj))?.as_f64().unwrap_or(0.0);
            let fij = f.apply(&JsValue::NULL, &to_array(&xij))?.as_f64().unwrap_or(0.0);
            
            res[i * n + j] = (fij - fi - fj + f0) / (h * h);
        }
    }
    
    Ok(res)
}

fn to_array(v: &[f64]) -> js_sys::Array {
    let arr = js_sys::Array::new();
    for &val in v { arr.push(&JsValue::from_f64(val)); }
    arr
}
