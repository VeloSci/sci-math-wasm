// use rayon::prelude::*;

pub fn run_smooth_sg(n: usize, i_ptr: *const f64, o_ptr: *mut f64, window: usize, degree: usize) {
    unsafe {
        crate::analysis::smooth_savitzky_golay(
            std::slice::from_raw_parts(i_ptr, n),
            window,
            degree,
            std::slice::from_raw_parts_mut(o_ptr, n),
        );
    }
}

pub fn run_detect_peaks(n: usize, i_ptr: *const f64, threshold: f64, prominence: f64) -> Vec<u32> {
    unsafe {
        crate::analysis::find_peaks(
            std::slice::from_raw_parts(i_ptr, n),
            threshold,
            prominence
        )
    }
}

pub fn run_deconvolve(n: usize, kn: usize, d_ptr: *const f64, k_ptr: *const f64, o_ptr: *mut f64, iters: u32) {
    unsafe {
        crate::analysis::deconvolve_rl(
            std::slice::from_raw_parts(d_ptr, n), 
            std::slice::from_raw_parts(k_ptr, kn), 
            iters, 
            std::slice::from_raw_parts_mut(o_ptr, n)
        );
    }
}

pub fn run_filter_butterworth(n: usize, i_ptr: *const f64, o_ptr: *mut f64, cutoff: f64, fs: f64) {
    unsafe {
        crate::analysis::butterworth_lowpass(
            std::slice::from_raw_parts(i_ptr, n), 
            std::slice::from_raw_parts_mut(o_ptr, n), 
            cutoff, 
            fs
        );
    }
}
pub fn run_remove_baseline(n: usize, i_ptr: *const f64, x_ptr: *const f64, o_ptr: *mut f64, order: usize, iters: usize) {
    unsafe {
        if iters <= 1 {
            crate::analysis::remove_baseline(
                std::slice::from_raw_parts(i_ptr, n),
                std::slice::from_raw_parts(x_ptr, n),
                order,
                std::slice::from_raw_parts_mut(o_ptr, n),
            );
        } else {
            crate::analysis::remove_baseline_iterative(
                std::slice::from_raw_parts(i_ptr, n),
                std::slice::from_raw_parts(x_ptr, n),
                order,
                iters,
                std::slice::from_raw_parts_mut(o_ptr, n),
            );
        }
    }
}
