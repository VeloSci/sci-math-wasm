use rayon::prelude::*;
use std::f64::consts::PI;

/// Cooley-Tukey FFT (Radix-2) In-Place - Parallel
pub fn fft_radix2(re: &mut [f64], im: &mut [f64], inverse: bool) {
    let n = re.len();
    assert_eq!(n, im.len());
    assert!(n.is_power_of_two());

    // Bit-reversal permutation (sequential as it's small O(N))
    bit_reverse_copy(re, im, n);

    let sign = if inverse { -1.0 } else { 1.0 };
    
    // Convert to raw pointers for raw Rayon access in butterflies
    let p_re = re.as_mut_ptr() as usize;
    let p_im = im.as_mut_ptr() as usize;
    
    let mut step = 1;
    while step < n {
        let jump = step << 1;
        let delta_angle = sign * PI / step as f64;
        let wpr = (delta_angle).cos();
        let wpi = (delta_angle).sin();
        
        // Parallelize over groups if there are enough butterflies to justify overhead
        if n >= 2048 {
            (0..n).into_par_iter().step_by(jump).for_each(|group_start| unsafe {
                let pr = p_re as *mut f64;
                let pi = p_im as *mut f64;
                let mut wr = 1.0;
                let mut wi = 0.0;
                
                for i in 0..step {
                    let j = group_start + i;
                    let k = j + step;
                    
                    let rek = *pr.add(k);
                    let imk = *pi.add(k);
                    
                    let tr = wr * rek - wi * imk;
                    let ti = wr * imk + wi * rek;
                    
                    let rej = *pr.add(j);
                    let imj = *pi.add(j);
                    
                    *pr.add(k) = rej - tr;
                    *pi.add(k) = imj - ti;
                    *pr.add(j) = rej + tr;
                    *pi.add(j) = imj + ti;
                    
                    let wtemp = wr;
                    wr = wr * wpr - wi * wpi;
                    wi = wi * wpr + wtemp * wpi;
                }
            });
        } else {
            // Sequential fallback for small stages
            for group_start in (0..n).step_by(jump) {
                let mut wr = 1.0;
                let mut wi = 0.0;
                unsafe {
                    let pr = p_re as *mut f64;
                    let pi = p_im as *mut f64;
                    for i in 0..step {
                        let j = group_start + i;
                        let k = j + step;
                        let tr = wr * *pr.add(k) - wi * *pi.add(k);
                        let ti = wr * *pi.add(k) + wi * *pr.add(k);
                        let rej = *pr.add(j);
                        let imj = *pi.add(j);
                        *pr.add(k) = rej - tr;
                        *pi.add(k) = imj - ti;
                        *pr.add(j) = rej + tr;
                        *pi.add(j) = imj + ti;
                        let wtemp = wr;
                        wr = wr * wpr - wi * wpi;
                        wi = wi * wpr + wtemp * wpi;
                    }
                }
            }
        }
        step = jump;
    }

    if inverse {
        let inv_n = 1.0 / n as f64;
        re.par_iter_mut().for_each(|x| *x *= inv_n);
        im.par_iter_mut().for_each(|x| *x *= inv_n);
    }
}

pub fn ifft_radix2(re: &mut [f64], im: &mut [f64]) {
    fft_radix2(re, im, true);
}

fn bit_reverse_copy(re: &mut [f64], im: &mut [f64], n: usize) {
    let mut j = 0;
    for i in 0..n - 1 {
        if i < j {
            re.swap(i, j);
            im.swap(i, j);
        }
        let mut k = n / 2;
        while k <= j {
            j -= k;
            k /= 2;
        }
        j += k;
    }
}

/// REAL-TO-COMPLEX FFT (RFFT) - Parallel
pub fn rfft_radix2(data: &[f64], re_out: &mut [f64], im_out: &mut [f64]) {
    let n = data.len();
    assert!(n.is_power_of_two());
    let half_n = n / 2;
    
    // Parallel Pack
    re_out[..half_n].par_iter_mut().enumerate().for_each(|(i, val)| {
        *val = data[2 * i];
    });
    im_out[..half_n].par_iter_mut().enumerate().for_each(|(i, val)| {
        *val = data[2 * i + 1];
    });
    
    fft_radix2(&mut re_out[..half_n], &mut im_out[..half_n], false);
}

use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = ifft)]
pub fn ifft_wasm(re: Vec<f64>, im: Vec<f64>) -> Result<Vec<f64>, JsValue> {
    let n = re.len();
    if n != im.len() {
        return Err(JsValue::from_str("Real and imaginary parts must have the same length"));
    }
    if !n.is_power_of_two() {
        return Err(JsValue::from_str("Length must be a power of two"));
    }

    let mut re_mut = re;
    let mut im_mut = im;
    ifft_radix2(&mut re_mut, &mut im_mut);

    let mut output = Vec::with_capacity(n * 2);
    for i in 0..n {
        output.push(re_mut[i]);
        output.push(im_mut[i]);
    }

    Ok(output)
}

#[wasm_bindgen(js_name = rfft)]
pub fn rfft_wasm(data: &[f64]) -> Result<Vec<f64>, JsValue> {
    let n = data.len();
    if !n.is_power_of_two() {
        return Err(JsValue::from_str("Input length must be a power of two"));
    }
    let half_n = n / 2;
    let mut re_out = vec![0.0; half_n];
    let mut im_out = vec![0.0; half_n];
    
    rfft_radix2(data, &mut re_out, &mut im_out);

    let mut output = Vec::with_capacity(n);
    for i in 0..half_n {
        output.push(re_out[i]);
        output.push(im_out[i]);
    }

    Ok(output)
}

