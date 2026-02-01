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

