use rayon::prelude::*;
use wasm_bindgen::prelude::*;

/// Performs a Fast Fourier Transform (FFT) on a real-valued signal - Parallel
#[wasm_bindgen]
pub fn fft(input: &[f64]) -> Result<Vec<f64>, JsValue> {
    let n = input.len();
    if !n.is_power_of_two() {
        return Err(JsValue::from_str("Input length must be a power of two"));
    }

    let mut re = input.to_vec();
    let mut im = vec![0.0; n];

    crate::fft::fft_radix2(&mut re, &mut im, false);

    let mut output = Vec::with_capacity(n * 2);
    for i in 0..n {
        output.push(re[i]);
        output.push(im[i]);
    }

    Ok(output)
}

/// Computes the magnitude of a complex FFT result - Parallel
#[wasm_bindgen]
pub fn magnitude(complex_data: &[f64]) -> Vec<f64> {
    complex_data.par_chunks_exact(2)
        .with_min_len(4096)
        .map(|chunk| {
            let re = chunk[0];
            let im = chunk[1];
            (re * re + im * im).sqrt()
        })
        .collect()
}

/// Applies a moving average filter to smoothing out a signal - Parallel
#[wasm_bindgen]
pub fn moving_average(data: &[f64], window: usize) -> Vec<f64> {
    let n = data.len();
    if n == 0 || window == 0 { return data.to_vec(); }
    
    let mut result = vec![0.0; n];
    let half = (window / 2) as i32;
    
    // Parallelize with chunks to maintain sliding window efficiency per thread
    let chunk_size = 32768;
    let res_ptr = result.as_mut_ptr() as usize;
    let data_ptr = data.as_ptr() as usize;

    (0..n).into_par_iter().step_by(chunk_size).for_each(|start| unsafe {
        let end = (start + chunk_size).min(n);
        let out = res_ptr as *mut f64;
        let d = data_ptr as *const f64;
        
        // Initial window for this chunk
        let mut sum = 0.0;
        let mut count = 0;
        
        let w_start = (start as i32 - half).max(0) as usize;
        let w_end = (start as i32 + half).min(n as i32 - 1) as usize;
        
        for j in w_start..=w_end {
            sum += *d.add(j);
            count += 1;
        }
        
        *out.add(start) = sum / count as f64;

        // Sliding window for the rest of the chunk
        for i in (start + 1)..end {
            let prev_start = i as i32 - 1 - half;
            let curr_start = i as i32 - half;
            let prev_end = i as i32 - 1 + half;
            let curr_end = i as i32 + half;

            if curr_end < n as i32 && curr_end > prev_end {
                sum += *d.add(curr_end as usize);
                count += 1;
            }
            if curr_start > 0 && curr_start > prev_start {
                sum -= *d.add((curr_start - 1) as usize);
                count -= 1;
            }
            *out.add(i) = sum / count as f64;
        }
    });

    result
}

/// Simple peak detection based on local maxima and a threshold - Parallel
#[wasm_bindgen]
pub fn find_peaks(data: &[f64], threshold: f64) -> Vec<usize> {
    let n = data.len();
    if n < 3 { return vec![]; }

    (1..n-1).into_par_iter()
        .with_min_len(8192)
        .filter(|&i| {
            let val = data[i];
            val > data[i-1] && val > data[i+1] && val >= threshold
        })
        .collect()
}
