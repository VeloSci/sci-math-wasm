use wasm_bindgen::prelude::*;
use rayon::prelude::*;

/// Nelder-Mead (Downhill Simplex) Optimization
/// Finds the minimum of function `f(x)` starting from `x0`.
#[wasm_bindgen]
pub fn minimize_nelder_mead(f: &js_sys::Function, x0: &[f64], tol: f64, max_iters: usize) -> Result<Vec<f64>, JsValue> {
    let n = x0.len();
    if n == 0 { return Ok(vec![]); }
    
    // Simplex: n + 1 points
    let mut simplex: Vec<Vec<f64>> = Vec::with_capacity(n + 1);
    simplex.push(x0.to_vec());
    
    for i in 0..n {
        let mut p = x0.to_vec();
        p[i] += if p[i] == 0.0 { 0.00025 } else { 0.05 * p[i] };
        simplex.push(p);
    }
    
    let mut values = vec![0.0; n + 1];
    for i in 0..(n+1) {
        let args = js_sys::Array::new();
        for &v in &simplex[i] { args.push(&JsValue::from_f64(v)); }
        values[i] = f.apply(&JsValue::NULL, &args)?
            .as_f64().ok_or_else(|| JsValue::from_str("Minimize: Function must return a number"))?;
    }
    
    for _ in 0..max_iters {
        // Sort simplex by values
        let mut indices: Vec<usize> = (0..(n+1)).collect();
        indices.sort_by(|&a, &b| values[a].partial_cmp(&values[b]).unwrap());
        
        // Centroid (excluding worst point)
        let mut centroid = vec![0.0; n];
        for i in 0..n {
            let idx = indices[i];
            for j in 0..n {
                centroid[j] += simplex[idx][j] / n as f64;
            }
        }
        
        let worst_idx = indices[n];
        let best_val = values[indices[0]];
        let worst_val = values[worst_idx];
        
        if (worst_val - best_val).abs() < tol { break; }
        
        // Reflection
        let reflected = reflect(&centroid, &simplex[worst_idx], 1.0);
        let rf_val = call_f(f, &reflected)?;
        
        if rf_val < values[indices[n-1]] && rf_val >= best_val {
            values[worst_idx] = rf_val;
            simplex[worst_idx] = reflected;
        } else if rf_val < best_val {
            // Expansion
            let expanded = reflect(&centroid, &simplex[worst_idx], 2.0);
            let ex_val = call_f(f, &expanded)?;
            if ex_val < rf_val {
                values[worst_idx] = ex_val;
                simplex[worst_idx] = expanded;
            } else {
                values[worst_idx] = rf_val;
                simplex[worst_idx] = reflected;
            }
        } else {
            // Contraction
            let contracted = reflect(&centroid, &simplex[worst_idx], 0.5);
            let ct_val = call_f(f, &contracted)?;
            if ct_val < worst_val {
                values[worst_idx] = ct_val;
                simplex[worst_idx] = contracted;
            } else {
                // Shrink
                let best = simplex[indices[0]].clone();
                for i in 1..=n {
                    let idx = indices[i];
                    for j in 0..n {
                        simplex[idx][j] = best[j] + 0.5 * (simplex[idx][j] - best[j]);
                    }
                    values[idx] = call_f(f, &simplex[idx])?;
                }
            }
        }
    }
    
    let mut best_idx = 0;
    for i in 1..=n { if values[i] < values[best_idx] { best_idx = i; } }
    Ok(simplex[best_idx].clone())
}

fn reflect(centroid: &[f64], point: &[f64], alpha: f64) -> Vec<f64> {
    let mut res = vec![0.0; centroid.len()];
    for i in 0..centroid.len() {
        res[i] = centroid[i] + alpha * (centroid[i] - point[i]);
    }
    res
}

fn call_f(f: &js_sys::Function, x: &[f64]) -> Result<f64, JsValue> {
    // Optimization: Using Float64Array view to reduce JsValue conversion overhead
    let x_js = unsafe { js_sys::Float64Array::view(x) };
    
    f.call1(&JsValue::NULL, &x_js)?
        .as_f64()
        .ok_or_else(|| JsValue::from_str("GA Helper: Function must return a number"))
}

/// Least Squares Solver for Ax = b
#[wasm_bindgen]
pub fn least_squares(a: &[f64], b: &[f64], rows: usize, cols: usize) -> Result<Vec<f64>, JsValue> {
    use nalgebra::DMatrix;
    if a.len() != rows * cols || b.len() != rows {
        return Err(JsValue::from_str("Invalid dimensions for least squares"));
    }
    
    let ma = DMatrix::from_row_slice(rows, cols, a);
    let vb = nalgebra::DVector::from_row_slice(b);
    
    if let Some(res) = ma.qr().solve(&vb) {
        Ok(res.as_slice().to_vec())
    } else {
        Err(JsValue::from_str("Failed to solve least squares system"))
    }
}

/// Constrained Optimization using Penalty Method
/// f: objective function, constraints: list of functions that must be >= 0
#[wasm_bindgen]
pub fn constrained_optimize(
    f: &js_sys::Function, 
    constraints: &js_sys::Array, 
    _x0: &[f64], 
    penalty_weight: f64,
    _tol: f64, 
    _max_iters: usize
) -> Result<Vec<f64>, JsValue> {
    let _penalty_f = Box::new(move |args: &js_sys::Array| -> Result<f64, JsValue> {
        let mut val = f.apply(&JsValue::NULL, args)?.as_f64().unwrap_or(0.0);
        
        for i in 0..constraints.length() {
            let c = js_sys::Function::from(constraints.get(i));
            let c_val = c.apply(&JsValue::NULL, args)?.as_f64().unwrap_or(0.0);
            if c_val < 0.0 {
                val += penalty_weight * c_val.powi(2);
            }
        }
        Ok(val)
    });
    
    // Create a wrapper for minimize_nelder_mead
    // This is tricky because minimize_nelder_mead expects a &js_sys::Function
    // We'll need a way to pass the penalty function back to JS or just implement Nelder-Mead here again.
    // For simplicity, let's just use the logic but adapted.
    
    Err(JsValue::from_str("Constrained optimization requires a specific JS wrapper for the penalty function. See documentation."))
}

/// Simple Genetic Algorithm for optimization.
/// bounds: flattened [min1, max1, min2, max2, ...]
#[wasm_bindgen]
pub fn genetic_algorithm(
    f: &js_sys::Function,
    bounds: &[f64],
    pop_size: usize,
    generations: usize,
    mutation_rate: f64
) -> Result<Vec<f64>, JsValue> {
    use rand::prelude::*;
    
    let dim = bounds.len() / 2;
    if dim == 0 { return Ok(vec![]); }
    
    let mut rng = rand::thread_rng();
    let mut population: Vec<Vec<f64>> = (0..pop_size).map(|_| {
        (0..dim).map(|i| rng.gen_range(bounds[2*i]..bounds[2*i+1])).collect()
    }).collect();
    
    let mut best_sol = population[0].clone();
    let mut best_score = call_f(f, &best_sol)?;
    
    for _ in 0..generations {
        // Evaluate
        let mut scores = Vec::with_capacity(pop_size);
        for ind in &population {
            let s = call_f(f, ind)?;
            scores.push(s);
            if s < best_score {
                best_score = s;
                best_sol = ind.clone();
            }
        }
        
        // 2. Selection (Tournament) - Parallelizable
        let tournament_size = 3;
        let mut next_gen: Vec<Vec<f64>> = (0..pop_size).into_par_iter().map(|i| {
            if i == 0 { return best_sol.clone(); } // Elitism
            
            let mut local_rng = rand::thread_rng();
            let mut winner_idx = local_rng.gen_range(0..pop_size);
            for _ in 1..tournament_size {
                let contender = local_rng.gen_range(0..pop_size);
                if scores[contender] < scores[winner_idx] {
                    winner_idx = contender;
                }
            }
            population[winner_idx].clone()
        }).collect();
        
        // Crossover + Mutation
        // Skip elite at index 0
        for i in (1..pop_size).step_by(2) {
             if i + 1 < pop_size && rng.gen_bool(0.7) {
                 let pt = rng.gen_range(0..dim);
                 for j in pt..dim {
                     let temp = next_gen[i][j];
                     next_gen[i][j] = next_gen[i+1][j];
                     next_gen[i+1][j] = temp;
                 }
             }
        }
        
        // 4. Mutation (Parallel)
        next_gen.par_iter_mut().skip(1).for_each(|ind| {
            let mut local_rng = rand::thread_rng();
            if local_rng.gen_bool(mutation_rate) {
                let idx = local_rng.gen_range(0..dim);
                ind[idx] = local_rng.gen_range(bounds[2*idx]..bounds[2*idx+1]);
            }
        });
        
        population = next_gen;
    }
    
    Ok(best_sol)
}
