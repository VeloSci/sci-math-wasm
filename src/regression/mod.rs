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
    pub r_squared: f64,
}

/// Performs a simple linear regression ($y = mx + b$).
/// 
/// Uses the Ordinary Least Squares method:
/// $$ m = \frac{n\sum xy - \sum x \sum y}{n\sum x^2 - (\sum x)^2} $$
/// $$ b = \frac{\sum y - m\sum x}{n} $$
/// 
/// # Arguments
/// * `x` - Independent variables.
/// * `y` - Dependent variables.
#[wasm_bindgen]
pub fn linear_regression(x: &[f64], y: &[f64]) -> Result<LinearRegressionResult, JsValue> {
    let n = x.len();
    if n != y.len() {
        return Err(JsValue::from_str("Dimensions of X and Y must match"));
    }
    if n < 2 {
        return Err(JsValue::from_str("At least two points are required for regression"));
    }

    let mut sum_x = 0.0;
    let mut sum_y = 0.0;
    let mut sum_xy = 0.0;
    let mut sum_xx = 0.0;
    let mut sum_yy = 0.0;

    for i in 0..n {
        sum_x += x[i];
        sum_y += y[i];
        sum_xy += x[i] * y[i];
        sum_xx += x[i] * x[i];
        sum_yy += y[i] * y[i];
    }

    let n_f = n as f64;
    let denominator = n_f * sum_xx - sum_x * sum_x;

    if denominator == 0.0 {
        return Err(JsValue::from_str("Slope is undefined (vertical line)"));
    }

    let slope = (n_f * sum_xy - sum_x * sum_y) / denominator;
    let intercept = (sum_y - slope * sum_x) / n_f;

    // Calculate R-squared
    let r_num = n_f * sum_xy - sum_x * sum_y;
    let r_den = ((n_f * sum_xx - sum_x * sum_x) * (n_f * sum_yy - sum_y * sum_y)).sqrt();
    let r_squared = if r_den == 0.0 { 1.0 } else { (r_num / r_den).powi(2) };

    Ok(LinearRegressionResult {
        slope,
        intercept,
        r_squared,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_linear_regression_basic() {
        let x = [1.0, 2.0, 3.0, 4.0];
        let y = [2.0, 4.0, 6.0, 8.0];
        let res = linear_regression(&x, &y).unwrap();
        assert!((res.slope - 2.0).abs() < 1e-12);
        assert!((res.intercept).abs() < 1e-12);
        assert!((res.r_squared - 1.0).abs() < 1e-12);
    }
}
