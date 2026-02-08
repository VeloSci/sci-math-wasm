use rayon::prelude::*;
use wasm_bindgen::prelude::*;

/// Performs a Fast Fourier Transform (FFT) on a real-valued signal - Parallel
#[wasm_bindgen]
pub fn fft(input: &[f64]) -> Result<Vec<f64>, JsValue> {
    let n = input.len();
    if n == 0 {
        return Err(JsValue::from_str("Input must not be empty"));
    }
    // Auto-pad to next power of 2
    let padded_n = n.next_power_of_two();
    let mut re = if padded_n == n {
        input.to_vec()
    } else {
        let mut v = vec![0.0; padded_n];
        v[..n].copy_from_slice(input);
        v
    };
    let mut im = vec![0.0; padded_n];

    crate::fft::fft_radix2(&mut re, &mut im, false);

    let mut output = Vec::with_capacity(padded_n * 2);
    for i in 0..padded_n {
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
#[wasm_bindgen(js_name = movingAverage)]
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
#[wasm_bindgen(js_name = findPeaksSimple)]
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
/// Calculates the cross-correlation of two signals - Parallel
#[wasm_bindgen(js_name = crossCorrelation)]
pub fn cross_correlation(a: &[f64], b: &[f64]) -> Vec<f64> {
    let n = a.len();
    let m = b.len();
    let out_len = n + m - 1;
    let mut result = vec![0.0; out_len];
    
    // Simple O(N*M) implementation, parallelized by output index
    result.par_iter_mut().enumerate().for_each(|(k, val)| {
        let mut sum = 0.0;
        let start = if k >= m { k - m + 1 } else { 0 };
        let end = if k < n { k } else { n - 1 };
        
        for i in start..=end {
            sum += a[i] * b[k - i];
        }
        *val = sum;
    });
    
    result
}

/// Calculates the auto-correlation of a signal - Parallel
#[wasm_bindgen(js_name = autoCorrelation)]
pub fn auto_correlation(data: &[f64]) -> Vec<f64> {
    cross_correlation(data, data)
}

/// Short-Time Fourier Transform (STFT) - Parallel
/// Returns a flattened vector of complex numbers [re, im, ...]
#[wasm_bindgen]
pub fn stft(data: &[f64], window_size: usize, hop_size: usize) -> Result<Vec<f64>, JsValue> {
    if !window_size.is_power_of_two() {
        return Err(JsValue::from_str("Window size must be a power of two"));
    }
    
    let n = data.len();
    if n < window_size { return Ok(vec![]); }
    
    let n_frames = (n - window_size) / hop_size + 1;
    let mut result = vec![0.0; n_frames * window_size * 2];
    
    // Hanning window
    let mut window = vec![0.0; window_size];
    for i in 0..window_size {
        window[i] = 0.5 * (1.0 - (2.0 * std::f64::consts::PI * i as f64 / (window_size - 1) as f64).cos());
    }
    
    let res_ptr = result.as_mut_ptr() as usize;
    let data_ptr = data.as_ptr() as usize;
    let win_ptr = window.as_ptr() as usize;

    (0..n_frames).into_par_iter()
        .with_min_len(1)
        .for_each(|f| unsafe {
            let p_res = (res_ptr as *mut f64).add(f * window_size * 2);
            let p_data = (data_ptr as *const f64).add(f * hop_size);
            let p_win = win_ptr as *const f64;
            
            let mut re = vec![0.0; window_size];
            let mut im = vec![0.0; window_size];
            
            for i in 0..window_size {
                re[i] = *p_data.add(i) * *p_win.add(i);
            }
            
            crate::fft::fft_radix2(&mut re, &mut im, false);
            
            for i in 0..window_size {
                *p_res.add(i * 2) = re[i];
                *p_res.add(i * 2 + 1) = im[i];
            }
        });
    
    Ok(result)
}

/// Hilbert Transform - Computes the analytic signal
#[wasm_bindgen]
pub fn hilbert(data: &[f64]) -> Result<Vec<f64>, JsValue> {
    let n = data.len();
    if !n.is_power_of_two() {
        return Err(JsValue::from_str("Input length must be a power of two"));
    }
    
    let mut re = data.to_vec();
    let mut im = vec![0.0; n];
    
    // 1. FFT
    crate::fft::fft_radix2(&mut re, &mut im, false);
    
    // 2. Zero negative frequencies and double positive ones
    // H(f) = 1 for f=0, N/2; 2 for 0 < f < N/2; 0 for N/2 < f < N
    for i in 1..(n / 2) {
        re[i] *= 2.0;
        im[i] *= 2.0;
    }
    for i in (n / 2 + 1)..n {
        re[i] = 0.0;
        im[i] = 0.0;
    }
    
    // 3. IFFT
    crate::fft::fft_radix2(&mut re, &mut im, true);
    
    let mut out = Vec::with_capacity(n * 2);
    for i in 0..n {
        out.push(re[i]);
        out.push(im[i]);
    }
    Ok(out)
}

/// Linear Resampling of a signal
#[wasm_bindgen]
pub fn resample(data: &[f64], new_len: usize) -> Vec<f64> {
    if data.is_empty() || new_len == 0 { return vec![]; }
    if data.len() == new_len { return data.to_vec(); }
    
    let mut out = vec![0.0; new_len];
    let ratio = (data.len() - 1) as f64 / (new_len - 1) as f64;
    
    out.par_iter_mut().enumerate().for_each(|(i, val)| {
        let src_idx = i as f64 * ratio;
        let x1 = src_idx.floor() as usize;
        let x2 = (x1 + 1).min(data.len() - 1);
        let t = src_idx - x1 as f64;
        
        *val = data[x1] * (1.0 - t) + data[x2] * t;
    });
    
    out
}

/// Inverse Short-Time Fourier Transform (ISTFT)
#[wasm_bindgen]
pub fn istft(stft_data: &[f64], window_size: usize, hop_size: usize) -> Result<Vec<f64>, JsValue> {
    let n_frames = stft_data.len() / (window_size * 2);
    let out_len = (n_frames - 1) * hop_size + window_size;
    let mut out = vec![0.0; out_len];
    let mut window_sum = vec![0.0; out_len];
    
    // Hanning window
    let mut window = vec![0.0; window_size];
    for i in 0..window_size {
        window[i] = 0.5 * (1.0 - (2.0 * std::f64::consts::PI * i as f64 / (window_size - 1) as f64).cos());
    }

    for f in 0..n_frames {
        let mut re = vec![0.0; window_size];
        let mut im = vec![0.0; window_size];
        for i in 0..window_size {
            re[i] = stft_data[f * window_size * 2 + i * 2];
            im[i] = stft_data[f * window_size * 2 + i * 2 + 1];
        }
        
        crate::fft::fft_radix2(&mut re, &mut im, true);
        
        let offset = f * hop_size;
        for i in 0..window_size {
            if offset + i < out_len {
                out[offset + i] += re[i] * window[i];
                window_sum[offset + i] += window[i] * window[i];
            }
        }
    }
    
    // Normalize by window sum
    for i in 0..out_len {
        if window_sum[i] > 1e-12 {
            out[i] /= window_sum[i];
        }
    }
    
    Ok(out)
}

/// Computes a Spectrogram (magnitudes of STFT)
#[wasm_bindgen]
pub fn spectrogram(data: &[f64], window_size: usize, hop_size: usize) -> Result<Vec<f64>, JsValue> {
    let stft_res = stft(data, window_size, hop_size)?;
    let mut spec = Vec::with_capacity(stft_res.len() / 2);
    for i in (0..stft_res.len()).step_by(2) {
        let re = stft_res[i];
        let im = stft_res[i+1];
        spec.push((re * re + im * im).sqrt());
    }
    Ok(spec)
}
