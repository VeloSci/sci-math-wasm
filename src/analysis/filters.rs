use rayon::prelude::*;

/// Butterworth Low-pass Filter (2nd Order IIR) - Parallel (Chunked with Warmup)
pub fn butterworth_lowpass(data: &[f64], out: &mut [f64], cutoff: f64, fs: f64) {
    let n = data.len();
    let ff = cutoff / fs;
    let ita = (std::f64::consts::PI * ff).tan();
    let q = std::f64::consts::SQRT_2;
    
    let b0 = (ita * ita) / (1.0 + q * ita + (ita * ita));
    let b1 = 2.0 * b0;
    let b2 = b0;
    let a1 = 2.0 * (ita * ita - 1.0) / (1.0 + q * ita + (ita * ita));
    let a2 = (1.0 - q * ita + (ita * ita)) / (1.0 + q * ita + (ita * ita));

    if n < 2048 {
        let mut x1 = 0.0; let mut x2 = 0.0; let mut y1 = 0.0; let mut y2 = 0.0;
        for i in 0..n {
            let x0 = data[i];
            let y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
            out[i] = y0;
            x2 = x1; x1 = x0; y2 = y1; y1 = y0;
        }
        return;
    }

    let chunk_size = 65536; 
    let warmup = 128;
    let in_ptr = data.as_ptr() as usize;
    let out_ptr = out.as_mut_ptr() as usize;

    (0..n).into_par_iter().step_by(chunk_size).for_each(|start| unsafe {
        let end = (start + chunk_size).min(n);
        let p_in = in_ptr as *const f64;
        let p_out = out_ptr as *mut f64;
        
        let mut x1 = 0.0; let mut x2 = 0.0; let mut y1 = 0.0; let mut y2 = 0.0;
        
        if start > warmup {
            for i in (start - warmup)..start {
                let x0 = *p_in.add(i);
                let y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
                x2 = x1; x1 = x0; y2 = y1; y1 = y0;
            }
        } else if start > 0 {
            for i in 0..start {
                let x0 = *p_in.add(i);
                let y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
                x2 = x1; x1 = x0; y2 = y1; y1 = y0;
            }
        }

        for i in start..end {
            let x0 = *p_in.add(i);
            let y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
            *p_out.add(i) = y0;
            x2 = x1; x1 = x0; y2 = y1; y1 = y0;
        }
    });
}
