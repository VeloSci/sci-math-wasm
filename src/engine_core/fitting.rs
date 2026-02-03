pub fn run_fit_poly(x: &[f64], y: &[f64], order: usize) -> Vec<f64> {
    crate::fitting::fit_polynomial(x, y, order).unwrap_or_else(|| vec![0.0; order + 1])
}

pub fn run_fit_gaussians(x: &[f64], y: &[f64], p: [f64; 3]) -> Vec<f64> {
    crate::fitting::fit_gaussians(x, y, p)
}

pub fn run_fit_exponential(x: &[f64], y: &[f64]) -> Vec<f64> {
    crate::fitting::fit_exponential(x, y).map(|[a, b]| vec![a, b]).unwrap_or_else(|| vec![0.0, 0.0])
}

pub fn run_fit_logarithmic(x: &[f64], y: &[f64]) -> Vec<f64> {
    crate::fitting::fit_logarithmic(x, y).map(|[a, b]| vec![a, b]).unwrap_or_else(|| vec![0.0, 0.0])
}
