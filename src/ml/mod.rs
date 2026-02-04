use rayon::prelude::*;
use wasm_bindgen::prelude::*;

/// Sigmoid activation function - Parallel
#[wasm_bindgen]
pub fn sigmoid(x: &[f64]) -> Vec<f64> {
    x.par_iter().map(|&v| 1.0 / (1.0 + (-v).exp())).collect()
}

/// ReLU activation function - Parallel
#[wasm_bindgen]
pub fn relu(x: &[f64]) -> Vec<f64> {
    x.par_iter().map(|&v| if v > 0.0 { v } else { 0.0 }).collect()
}

/// Softmax activation function - Parallel
#[wasm_bindgen]
pub fn softmax(x: &[f64]) -> Vec<f64> {
    if x.is_empty() { return vec![]; }
    let max = x.par_iter().fold(|| f64::NEG_INFINITY, |a, &b| a.max(b)).reduce(|| f64::NEG_INFINITY, |a, b| a.max(b));
    let exps: Vec<f64> = x.par_iter().map(|&v| (v - max).exp()).collect();
    let sum: f64 = exps.par_iter().sum();
    exps.par_iter().map(|&v| v / sum).collect()
}

/// Linear (Dense) Layer: y = x @ W + b
#[wasm_bindgen(js_name = linearLayer)]
pub fn linear_layer(input: &[f64], weights: &[f64], bias: &[f64], rows: usize, cols: usize) -> Result<Vec<f64>, JsValue> {
    if input.len() != rows {
        return Err(JsValue::from_str("Input length must match weight rows"));
    }
    if weights.len() != rows * cols || bias.len() != cols {
        return Err(JsValue::from_str("Invalid weights or bias dimensions"));
    }
    
    let mut output = vec![0.0; cols];
    output.par_iter_mut().enumerate().for_each(|(j, out_val)| {
        let mut sum = bias[j];
        for i in 0..rows {
            sum += input[i] * weights[i * cols + j];
        }
        *out_val = sum;
    });
    
    Ok(output)
}

/// Batch Normalization (Inference mode)
#[wasm_bindgen(js_name = batchNorm)]
pub fn batch_norm(x: &[f64], mean: &[f64], var: &[f64], gamma: &[f64], beta: &[f64], epsilon: f64) -> Result<Vec<f64>, JsValue> {
    if x.len() != mean.len() || x.len() != var.len() || x.len() != gamma.len() || x.len() != beta.len() {
        return Err(JsValue::from_str("Input dimensions must match parameter dimensions"));
    }
    
    Ok(x.par_iter().enumerate().map(|(i, &val)| {
        let norm = (val - mean[i]) / (var[i] + epsilon).sqrt();
        norm * gamma[i] + beta[i]
    }).collect())
}

/// Dropout (Inference mode = identity, or Training mode with mask)
#[wasm_bindgen]
pub fn dropout(x: &[f64], rate: f64, seed: u32) -> Vec<f64> {
    // In inference mode it's usually identity * (1-rate) if scaling was done during training
    // Or just identity if scaling is done here.
    // For this simple implementation, we'll just implement the mask for simulation/training
    use rand::prelude::*;
    use rand_chacha::ChaCha8Rng;
    
    let mut rng = ChaCha8Rng::seed_from_u64(seed as u64);
    let scale = 1.0 / (1.0 - rate);
    
    x.iter().map(|&v| {
        if rng.gen::<f64>() > rate {
            v * scale
        } else {
            0.0
        }
    }).collect()
}

/// Simple 2D Convolution (Validity Padding, Stride 1)
#[wasm_bindgen(js_name = conv2d)]
pub fn conv2d(
    input: &[f64], in_h: usize, in_w: usize,
    kernel: &[f64], k_h: usize, k_w: usize
) -> Result<Vec<f64>, JsValue> {
    if in_h < k_h || in_w < k_w {
        return Err(JsValue::from_str("Input must be larger than kernel"));
    }
    
    let out_h = in_h - k_h + 1;
    let out_w = in_w - k_w + 1;
    let mut output = vec![0.0; out_h * out_w];
    
    output.par_iter_mut().enumerate().for_each(|(idx, val)| {
        let oh = idx / out_w;
        let ow = idx % out_w;
        
        let mut sum = 0.0;
        for kh in 0..k_h {
            for kw in 0..k_w {
                let ih = oh + kh;
                let iw = ow + kw;
                sum += input[ih * in_w + iw] * kernel[kh * k_w + kw];
            }
        }
        *val = sum;
    });
    
    Ok(output)
}
