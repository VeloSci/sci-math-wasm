use rayon::prelude::*;

/// Simple Linear Regression Fit: y = mx + c - Parallel
pub fn fit_linear(x: &[f64], y: &[f64]) -> (f64, f64, f64) {
    let n_input = x.len();
    if n_input == 0 { return (0.0, 0.0, 0.0); }

    // Parallel O(N) pass for sums
    let (sum_x, sum_y, sum_xy, sum_xx) = x.par_iter().zip(y.par_iter())
        .with_min_len(4096)
        .fold(|| (0.0, 0.0, 0.0, 0.0), |acc, (&xi, &yi)| {
            (acc.0 + xi, acc.1 + yi, acc.2 + xi * yi, acc.3 + xi * xi)
        })
        .reduce(|| (0.0, 0.0, 0.0, 0.0), |a, b| {
            (a.0 + b.0, a.1 + b.1, a.2 + b.2, a.3 + b.3)
        });

    let n = n_input as f64;
    let denom = n * sum_xx - sum_x * sum_x;
    if denom.abs() < 1e-18 { return (0.0, 0.0, 0.0); }
    
    let slope = (n * sum_xy - sum_x * sum_y) / denom;
    let intercept = (sum_y - slope * sum_x) / n;

    // Parallel R^2 calculation
    let ss_res: f64 = x.par_iter().zip(y.par_iter())
        .with_min_len(4096)
        .map(|(&xi, &yi)| {
            let pred = slope * xi + intercept;
            (yi - pred).powi(2)
        })
        .sum();
    
    let y_mean = sum_y / n;
    let ss_tot: f64 = y.par_iter()
        .with_min_len(4096)
        .map(|&yi| (yi - y_mean).powi(2))
        .sum();

    let r2 = if ss_tot > 0.0 { 1.0 - (ss_res / ss_tot) } else { 0.0 };

    (slope, intercept, r2)
}

/// Solve Ax = b using Gauss-Jordan elimination with partial pivoting.
pub fn solve_linear_system(a: &mut [f64], b: &mut [f64], n: usize) -> Option<Vec<f64>> {
    for i in 0..n {
        let mut max_row = i;
        let mut max_val = a[i * n + i].abs();
        for k in i + 1..n {
            if a[k * n + i].abs() > max_val {
                max_val = a[k * n + i].abs();
                max_row = k;
            }
        }

        if max_val < 1e-12 { return None; }

        for k in i..n {
            a.swap(i * n + k, max_row * n + k);
        }
        b.swap(i, max_row);

        let pivot = a[i * n + i];
        for k in i..n {
            a[i * n + k] /= pivot;
        }
        b[i] /= pivot;

        for k in 0..n {
            if k != i {
                let factor = a[k * n + i];
                for j in i..n {
                    a[k * n + j] -= factor * a[i * n + j];
                }
                b[k] -= factor * b[i];
            }
        }
    }

    Some(b.to_vec())
}

/// Fit Polynomial of given order
pub fn fit_polynomial(x: &[f64], y: &[f64], order: usize) -> Option<Vec<f64>> {
    let n_pts = x.len();
    if n_pts == 0 { return None; }
    let n = order + 1;
    
    let (x_min, x_max_val) = x.par_iter()
        .with_min_len(16384)
        .fold(|| (f64::INFINITY, f64::NEG_INFINITY), |acc, &xi| {
            (acc.0.min(xi), acc.1.max(xi))
        })
        .reduce(|| (f64::INFINITY, f64::NEG_INFINITY), |a, b| {
            (a.0.min(b.0), a.1.max(b.1))
        });

    let x_range = x_max_val - x_min;
    let inv_range = if x_range > 0.0 { 1.0 / x_range } else { 1.0 };

    let (powers, vector_sums) = x.par_iter().zip(y.par_iter()).with_min_len(4096).fold(
        || (vec![0.0; 2 * order + 1], vec![0.0; n]),
        |mut acc, (&xi_raw, &yi)| {
            let xi = (xi_raw - x_min) * inv_range;
            let mut p = 1.0;
            for j in 0..=2 * order {
                acc.0[j] += p;
                if j <= order {
                    acc.1[j] += p * yi;
                }
                p *= xi;
            }
            acc
        }
    ).reduce(
        || (vec![0.0; 2 * order + 1], vec![0.0; n]),
        |mut a, b| {
            for i in 0..a.0.len() { a.0[i] += b.0[i]; }
            for i in 0..a.1.len() { a.1[i] += b.1[i]; }
            a
        }
    );
    
    let mut matrix = vec![0.0; n * n];
    let mut b_vec = vector_sums;
    for i in 0..n {
        for j in 0..n {
            matrix[i * n + j] = powers[i + j];
        }
    }

    solve_linear_system(&mut matrix, &mut b_vec, n)
}

/// Gaussian function: y = A * exp(-(x-mu)^2 / (2*sigma^2))
fn gaussian(x: f64, a: f64, mu: f64, sigma: f64) -> f64 {
    if sigma.abs() < 1e-12 { return 0.0; }
    a * (-(x - mu).powi(2) / (2.0 * sigma.powi(2))).exp()
}

/// Levenberg-Marquardt for Gaussian Fitting
pub fn fit_gaussians(x: &[f64], y: &[f64], initial: [f64; 3]) -> Vec<f64> {
    let mut p = initial;
    let mut lambda = 0.001;
    
    for _iter in 0..20 {
        let (j_t_j_sum, j_t_r_sum, total_error_sum) = x.par_iter().zip(y.par_iter()).with_min_len(4096).fold(
            || (vec![0.0; 9], vec![0.0; 3], 0.0),
            |(mut jtj, mut jtr, mut err), (&xi, &yi)| {
                let amp = p[0];
                let mu = p[1];
                let sigma = p[2];
                
                if sigma.abs() < 1e-12 { return (jtj, jtr, err); }
                
                let exp_term = (-(xi - mu).powi(2) / (2.0 * sigma.powi(2))).exp();
                let fi = amp * exp_term;
                let ri = yi - fi;
                err += ri.powi(2);

                let d_a = exp_term;
                let d_mu = amp * exp_term * (xi - mu) / sigma.powi(2);
                let d_sigma = amp * exp_term * (xi - mu).powi(2) / sigma.powi(3);

                let jac = [d_a, d_mu, d_sigma];

                for r in 0..3 {
                    for c in 0..3 {
                        jtj[r * 3 + c] += jac[r] * jac[c];
                    }
                    jtr[r] += jac[r] * ri;
                }
                (jtj, jtr, err)
            }
        ).reduce(
            || (vec![0.0; 9], vec![0.0; 3], 0.0),
            |(mut jtj1, mut jtr1, err1), (jtj2, jtr2, err2)| {
                for i in 0..9 { jtj1[i] += jtj2[i]; }
                for i in 0..3 { jtr1[i] += jtr2[i]; }
                (jtj1, jtr1, err1 + err2)
            }
        );

        let mut j_t_j = j_t_j_sum;
        let mut j_t_r_vec = j_t_r_sum;

        for i in 0..3 { j_t_j[i * 3 + i] += lambda * j_t_j[i * 3 + i]; }

        if let Some(delta) = solve_linear_system(&mut j_t_j, &mut j_t_r_vec, 3) {
            let mut p_new = p;
            for i in 0..3 { p_new[i] += delta[i]; }

            let new_error = x.par_iter().zip(y.par_iter()).with_min_len(4096).map(|(&xi, &yi)| {
                (yi - gaussian(xi, p_new[0], p_new[1], p_new[2])).powi(2)
            }).sum::<f64>();

            if new_error < total_error_sum {
                lambda /= 10.0;
                p = p_new;
                if (total_error_sum - new_error).abs() < 1e-6 { break; }
            } else {
                lambda *= 10.0;
            }
        } else { break; }
    }
    p.to_vec()
}

/// Exponential Fit: y = A * exp(B * x) - Parallel
pub fn fit_exponential(x: &[f64], y: &[f64]) -> Option<[f64; 2]> {
    if x.len() < 2 { return None; }
    
    let filtered: Vec<(f64, f64)> = x.par_iter().zip(y.par_iter())
        .with_min_len(4096)
        .filter(|(_, &yi)| yi > 0.0)
        .map(|(&xi, &yi)| (xi, yi.ln()))
        .collect();
    
    if filtered.len() < 2 { return None; }
    
    let (valid_x, log_y): (Vec<f64>, Vec<f64>) = filtered.into_iter().unzip();
    
    let (slope_b, intercept_lna, _) = fit_linear(&valid_x, &log_y);
    Some([intercept_lna.exp(), slope_b])
}

/// Logarithmic Fit: y = A + B * ln(x) - Parallel
pub fn fit_logarithmic(x: &[f64], y: &[f64]) -> Option<[f64; 2]> {
    if x.len() < 2 { return None; }
    
    let filtered: Vec<(f64, f64)> = x.par_iter().zip(y.par_iter())
        .with_min_len(4096)
        .filter(|(&xi, _)| xi > 0.0)
        .map(|(&xi, &yi)| (xi.ln(), yi))
        .collect();
    
    if filtered.len() < 2 { return None; }
    
    let (log_x, valid_y): (Vec<f64>, Vec<f64>) = filtered.into_iter().unzip();
    
    let (slope_b, intercept_a, _) = fit_linear(&log_x, &valid_y);
    Some([intercept_a, slope_b])
}
