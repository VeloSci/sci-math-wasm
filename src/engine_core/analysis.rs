use rayon::prelude::*;

pub fn run_smooth_sg(n: usize, in_ptr: *const f64, out_ptr: *mut f64, window: usize) {
    unsafe {
        let in_slice = std::slice::from_raw_parts(in_ptr, n);
        let out_slice = std::slice::from_raw_parts_mut(out_ptr, n);
        crate::analysis::smooth_savitzky_golay(in_slice, window, out_slice);
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
