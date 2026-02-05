//! # Regression Analysis
//! 
//! Fitting models to data points.

use wasm_bindgen::prelude::*;

/// Result structure for a linear regression.
#[wasm_bindgen]
pub struct LinearRegressionResult {
    /// Slope (m)
    pub slope: f64,
    /// Intercept (b)
    pub intercept: f64,
    /// R-squared ($R^2$) value
    #[wasm_bindgen(js_name = rSquared)]
    pub r_squared: f64,
}

/// Result structure for a polynomial regression.
#[wasm_bindgen]
pub struct PolynomialRegressionResult {
    coefficients: Vec<f64>,
    /// R-squared ($R^2$) value
    #[wasm_bindgen(js_name = rSquared)]
    pub r_squared: f64,
}

#[wasm_bindgen]
impl PolynomialRegressionResult {
    #[wasm_bindgen(getter)]
    pub fn coefficients(&self) -> Vec<f64> {
        self.coefficients.clone()
    }
}

/// Result structure for basic two-parameter regressions (exponential, logarithmic, power).
#[wasm_bindgen]
pub struct BasicRegressionResult {
    /// Parameter a
    pub a: f64,
    /// Parameter b
    pub b: f64,
    /// R-squared ($R^2$) value
    #[wasm_bindgen(js_name = rSquared)]
    pub r_squared: f64,
}

/// Performs a simple linear regression ($y = mx + b$).
#[wasm_bindgen(js_name = linearRegression)]
pub fn linear_regression(x: &[f64], y: &[f64]) -> Result<LinearRegressionResult, JsValue> {
    if x.len() != y.len() {
        return Err(JsValue::from_str("Dimensions of X and Y must match"));
    }
    let (slope, intercept, r_squared) = crate::fitting::fit_linear(x, y);
    Ok(LinearRegressionResult {
        slope,
        intercept,
        r_squared,
    })
}

/// Performs a polynomial regression of specified order.
#[wasm_bindgen(js_name = polynomialRegression)]
pub fn polynomial_regression(x: &[f64], y: &[f64], order: usize) -> Result<PolynomialRegressionResult, JsValue> {
    if x.len() != y.len() {
        return Err(JsValue::from_str("Dimensions of X and Y must match"));
    }
    if x.len() <= order {
        return Err(JsValue::from_str("Not enough points for the requested polynomial order"));
    }

    let coeffs = crate::fitting::fit_polynomial_standard(x, y, order)
        .ok_or_else(|| JsValue::from_str("Failed to solve polynomial system"))?;

    // Calculate R-squared
    let y_mean: f64 = y.iter().sum::<f64>() / y.len() as f64;
    let ss_tot: f64 = y.iter().map(|&yi| (yi - y_mean).powi(2)).sum();
    let ss_res: f64 = x.iter().zip(y.iter()).map(|(&xi, &yi)| {
        let mut val = 0.0;
        let mut p = 1.0;
        for c in &coeffs {
            val += c * p;
            p *= xi;
        }
        (yi - val).powi(2)
    }).sum();

    let r_squared = if ss_tot > 0.0 { 1.0 - (ss_res / ss_tot) } else { 1.0 };

    Ok(PolynomialRegressionResult {
        coefficients: coeffs,
        r_squared,
    })
}

/// Performs an exponential regression ($y = a \cdot e^{bx}$).
#[wasm_bindgen(js_name = exponentialRegression)]
pub fn exponential_regression(x: &[f64], y: &[f64]) -> Result<BasicRegressionResult, JsValue> {
    if x.len() != y.len() {
        return Err(JsValue::from_str("Dimensions of X and Y must match"));
    }
    let res = crate::fitting::fit_exponential(x, y)
        .ok_or_else(|| JsValue::from_str("Failed to fit exponential (needs positive Y values)"))?;
    
    let a = res[0];
    let b = res[1];

    let y_mean: f64 = y.iter().sum::<f64>() / y.len() as f64;
    let ss_tot: f64 = y.iter().map(|&yi| (yi - y_mean).powi(2)).sum();
    let ss_res: f64 = x.iter().zip(y.iter()).map(|(&xi, &yi)| {
        let pred = a * (b * xi).exp();
        (yi - pred).powi(2)
    }).sum();
    let r_squared = if ss_tot > 0.0 { 1.0 - (ss_res / ss_tot) } else { 1.0 };

    Ok(BasicRegressionResult { a, b, r_squared })
}

/// Performs a logarithmic regression ($y = a + b \cdot \ln(x)$).
#[wasm_bindgen(js_name = logarithmicRegression)]
pub fn logarithmic_regression(x: &[f64], y: &[f64]) -> Result<BasicRegressionResult, JsValue> {
    if x.len() != y.len() {
        return Err(JsValue::from_str("Dimensions of X and Y must match"));
    }
    let res = crate::fitting::fit_logarithmic(x, y)
        .ok_or_else(|| JsValue::from_str("Failed to fit logarithmic (needs positive X values)"))?;
    
    let a = res[0];
    let b = res[1];

    let y_mean: f64 = y.iter().sum::<f64>() / y.len() as f64;
    let ss_tot: f64 = y.iter().map(|&yi| (yi - y_mean).powi(2)).sum();
    let ss_res: f64 = x.iter().zip(y.iter()).map(|(&xi, &yi)| {
        if xi <= 0.0 { return (yi - a).powi(2); }
        let pred = a + b * xi.ln();
        (yi - pred).powi(2)
    }).sum();
    let r_squared = if ss_tot > 0.0 { 1.0 - (ss_res / ss_tot) } else { 1.0 };

    Ok(BasicRegressionResult { a, b, r_squared })
}

/// Performs a power law regression ($y = a \cdot x^b$).
#[wasm_bindgen(js_name = powerRegression)]
pub fn power_regression(x: &[f64], y: &[f64]) -> Result<BasicRegressionResult, JsValue> {
    if x.len() != y.len() {
        return Err(JsValue::from_str("Dimensions of X and Y must match"));
    }
    
    let filtered: Vec<(f64, f64)> = x.iter().zip(y.iter())
        .filter(|(&xi, &yi)| xi > 0.0 && yi > 0.0)
        .map(|(&xi, &yi)| (xi.ln(), yi.ln()))
        .collect();
    
    if filtered.len() < 2 {
        return Err(JsValue::from_str("Failed to fit power law (needs positive X and Y values)"));
    }
    
    let (log_x, log_y): (Vec<f64>, Vec<f64>) = filtered.into_iter().unzip();
    let (slope_b, intercept_lna, _) = crate::fitting::fit_linear(&log_x, &log_y);
    
    let a = intercept_lna.exp();
    let b = slope_b;

    let y_mean: f64 = y.iter().sum::<f64>() / y.len() as f64;
    let ss_tot: f64 = y.iter().map(|&yi| (yi - y_mean).powi(2)).sum();
    let ss_res: f64 = x.iter().zip(y.iter()).map(|(&xi, &yi)| {
        if xi <= 0.0 { return (yi - 0.0).powi(2); }
        let pred = a * xi.powf(b);
        (yi - pred).powi(2)
    }).sum();
    let r_squared = if ss_tot > 0.0 { 1.0 - (ss_res / ss_tot) } else { 1.0 };

    Ok(BasicRegressionResult { a, b, r_squared })
}
