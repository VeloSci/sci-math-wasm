pub fn run_fit_poly(x: &[f64], y: &[f64], order: usize) -> Vec<f64> {
    crate::fitting::fit_polynomial(x, y, order).unwrap_or_else(|| vec![0.0; order + 1])
}

pub fn run_fit_gaussians(x: &[f64], y: &[f64], initial: &[f64]) -> Vec<f64> {
    crate::fitting::fit_gaussians(x, y, initial)
}

pub fn run_fit_exponential(x: &[f64], y: &[f64]) -> Vec<f64> {
    crate::fitting::fit_exponential(x, y).map(|[a, b]| vec![a, b]).unwrap_or_else(|| vec![0.0, 0.0])
}

pub fn run_fit_logarithmic(x: &[f64], y: &[f64]) -> Vec<f64> {
    crate::fitting::fit_logarithmic(x, y).map(|[a, b]| vec![a, b]).unwrap_or_else(|| vec![0.0, 0.0])
}
pub fn run_fit_linear(x: &[f64], y: &[f64]) -> Vec<f64> {
    let (slope, intercept, r2) = crate::fitting::fit_linear(x, y);
    vec![slope, intercept, r2]
}
