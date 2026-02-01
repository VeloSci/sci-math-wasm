#![cfg(feature = "threads")]

use wasm_bindgen::prelude::*;
use std::collections::HashMap;

#[cfg(all(target_arch = "wasm32", target_feature = "simd128"))]
use core::arch::wasm32::*;

#[cfg(not(all(target_arch = "wasm32", target_feature = "simd128")))]
mod wasm_simd_stubs {
    #[allow(non_camel_case_types)]
    pub type v128 = i128;
}
#[cfg(not(all(target_arch = "wasm32", target_feature = "simd128")))]
use wasm_simd_stubs::*;

use rayon::prelude::*;

#[wasm_bindgen]
pub struct SciEngine {
    vectors: HashMap<u32, Vec<f64>>,
    vectors_f32: HashMap<u32, Vec<f32>>,
    next_id: u32,
}

#[wasm_bindgen]
impl SciEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            vectors: HashMap::new(),
            vectors_f32: HashMap::new(),
            next_id: 0,
        }
    }

    pub fn create_vector(&mut self, size: usize) -> u32 {
        let id = self.next_id;
        self.vectors.insert(id, vec![0.0; size]);
        self.next_id += 1;
        id
    }

    pub fn get_ptr(&self, id: u32) -> *const f64 {
        self.vectors.get(&id).unwrap().as_ptr()
    }

    pub fn create_vector_f32(&mut self, size: usize) -> u32 {
        let id = self.next_id;
        self.vectors_f32.insert(id, vec![0.0; size]);
        self.next_id += 1;
        id
    }

    pub fn get_ptr_f32(&self, id: u32) -> *const f32 {
        self.vectors_f32.get(&id).unwrap().as_ptr()
    }

    pub fn nbody_f32_soa(&mut self, 
        id_px: u32, id_py: u32, id_pz: u32,
        id_vx: u32, id_vy: u32, id_vz: u32,
        dt: f32, iters: u32
    ) {
        let n = self.vectors_f32.get(&id_px).unwrap().len();
        let px_addr = self.vectors_f32.get(&id_px).unwrap().as_ptr() as usize;
        let py_addr = self.vectors_f32.get(&id_py).unwrap().as_ptr() as usize;
        let pz_addr = self.vectors_f32.get(&id_pz).unwrap().as_ptr() as usize;
        let vx_addr = self.vectors_f32.get_mut(&id_vx).unwrap().as_mut_ptr() as usize;
        let vy_addr = self.vectors_f32.get_mut(&id_vy).unwrap().as_mut_ptr() as usize;
        let vz_addr = self.vectors_f32.get_mut(&id_vz).unwrap().as_mut_ptr() as usize;

        if n < 4 { return; } // Avoid complexity for small n

        #[cfg(all(target_arch = "wasm32", target_feature = "simd128"))]
        unsafe {
            let v_soft = f32x4_splat(1e-5);
            let v_one = f32x4_splat(1.0);
            for _ in 0..iters {
                (0..n).into_par_iter().for_each(move |i| {
                    let px = px_addr as *const f32; let py = py_addr as *const f32; let pz = pz_addr as *const f32;
                    let vx = vx_addr as *mut f32; let vy = vy_addr as *mut f32; let vz = vz_addr as *mut f32;
                    let mut v_fx = f32x4_splat(0.0); let mut v_fy = f32x4_splat(0.0); let mut v_fz = f32x4_splat(0.0);
                    let pxi = *px.add(i); let pyi = *py.add(i); let pzi = *pz.add(i);
                    let v_pxi = f32x4_splat(pxi); let v_pyi = f32x4_splat(pyi); let v_pzi = f32x4_splat(pzi);
                    let n_simd = (n / 4) * 4;
                    for j in (0..n_simd).step_by(4) {
                        let v_pxj = v128_load(px.add(j) as *const v128);
                        let v_pyj = v128_load(py.add(j) as *const v128);
                        let v_pzj = v128_load(pz.add(j) as *const v128);
                        let dx = f32x4_sub(v_pxj, v_pxi); let dy = f32x4_sub(v_pyj, v_pyi); let dz = f32x4_sub(v_pzj, v_pzi);
                        let d2 = f32x4_add(f32x4_add(f32x4_mul(dx, dx), f32x4_mul(dy, dy)), f32x4_add(f32x4_mul(dz, dz), v_soft));
                        let inv_dist = f32x4_div(v_one, f32x4_sqrt(d2)); 
                        let inv_dist3 = f32x4_mul(inv_dist, f32x4_mul(inv_dist, inv_dist));
                        v_fx = f32x4_add(v_fx, f32x4_mul(dx, inv_dist3)); v_fy = f32x4_add(v_fy, f32x4_mul(dy, inv_dist3)); v_fz = f32x4_add(v_fz, f32x4_mul(dz, inv_dist3));
                    }
                    let fx_s = f32x4_extract_lane::<0>(v_fx) + f32x4_extract_lane::<1>(v_fx) + f32x4_extract_lane::<2>(v_fx) + f32x4_extract_lane::<3>(v_fx);
                    let fy_s = f32x4_extract_lane::<0>(v_fy) + f32x4_extract_lane::<1>(v_fy) + f32x4_extract_lane::<2>(v_fy) + f32x4_extract_lane::<3>(v_fy);
                    let fz_s = f32x4_extract_lane::<0>(v_fz) + f32x4_extract_lane::<1>(v_fz) + f32x4_extract_lane::<2>(v_fz) + f32x4_extract_lane::<3>(v_fz);
                    for j in n_simd..n {
                        let dx = *px.add(j) - pxi; let dy = *py.add(j) - pyi; let dz = *pz.add(j) - pzi;
                        let id3 = 1.0 / (dx*dx + dy*dy + dz*dz + 1e-9).sqrt().powi(3);
                        *vx.add(i) += dx * id3 * dt; *vy.add(i) += dy * id3 * dt; *vz.add(i) += dz * id3 * dt;
                    }
                    *vx.add(i) += fx_s * dt; *vy.add(i) += fy_s * dt; *vz.add(i) += fz_s * dt;
                });
            }
        }

        #[cfg(any(not(target_arch = "wasm32"), not(target_feature = "simd128")))]
        {
            // Scalar fallback for host testing
            for _ in 0..iters {
                (0..n).into_par_iter().for_each(move |i| unsafe {
                    let px = px_addr as *const f32; let py = py_addr as *const f32; let pz = pz_addr as *const f32;
                    let vx = vx_addr as *mut f32; let vy = vy_addr as *mut f32; let vz = vz_addr as *mut f32;
                    let pxi = *px.add(i); let pyi = *py.add(i); let pzi = *pz.add(i);
                    let mut fx = 0.0; let mut fy = 0.0; let mut fz = 0.0;
                    for j in 0..n {
                        let dx = *px.add(j) - pxi; let dy = *py.add(j) - pyi; let dz = *pz.add(j) - pzi;
                        let d2 = dx*dx + dy*dy + dz*dz + 1e-9;
                        let inv_dist3 = 1.0 / (d2.sqrt() * d2);
                        fx += dx * inv_dist3; fy += dy * inv_dist3; fz += dz * inv_dist3;
                    }
                    *vx.add(i) += fx * dt; *vy.add(i) += fy * dt; *vz.add(i) += fz * dt;
                });
            }
        }
    }

    pub fn matmul_unrolled(&mut self, a_id: u32, b_id: u32, out_id: u32, size: usize) {
        let a_addr = self.vectors.get(&a_id).unwrap().as_ptr() as usize;
        let b_addr = self.vectors.get(&b_id).unwrap().as_ptr() as usize;
        let out_addr = self.vectors.get_mut(&out_id).unwrap().as_mut_ptr() as usize;

        unsafe {
            // Optimization: Parallelize by ROWS (chunks) instead of blocks if size is large enough.
            // This reduces thread overhead significantly.
            let chunk_size = if size > 512 { size / rayon::current_num_threads().max(1) } else { size };
            
            (0..size).into_par_iter().with_min_len(chunk_size).for_each(move |i| {
                let a = a_addr as *const f64;
                let b = b_addr as *const f64;
                let out = out_addr as *mut f64;
                
                // Prefetch row A[i]
                let i_idx = i * size;
                let mut row_a = vec![0.0; size];
                std::ptr::copy_nonoverlapping(a.add(i_idx), row_a.as_mut_ptr(), size);
                
                for k in 0..size {
                    let aik = row_a[k];
                    let b_row = k * size;
                    let mut j = 0;
                    // Unroll x8 for maximum pipeline throughput
                    while j + 7 < size {
                        *out.add(i_idx + j)     += aik * *b.add(b_row + j);
                        *out.add(i_idx + j + 1) += aik * *b.add(b_row + j + 1);
                        *out.add(i_idx + j + 2) += aik * *b.add(b_row + j + 2);
                        *out.add(i_idx + j + 3) += aik * *b.add(b_row + j + 3);
                        *out.add(i_idx + j + 4) += aik * *b.add(b_row + j + 4);
                        *out.add(i_idx + j + 5) += aik * *b.add(b_row + j + 5);
                        *out.add(i_idx + j + 6) += aik * *b.add(b_row + j + 6);
                        *out.add(i_idx + j + 7) += aik * *b.add(b_row + j + 7);
                        j += 8;
                    }
                    while j < size {
                        *out.add(i_idx + j) += aik * *b.add(b_row + j);
                        j += 1;
                    }
                }
            });
        }
    }

    pub fn fft(&mut self, re_id: u32, im_id: u32, inverse: bool) {
        let n = self.vectors.get(&re_id).unwrap().len();
        let vector_ptr_re = self.vectors.get_mut(&re_id).unwrap().as_mut_ptr();
        let vector_ptr_im = self.vectors.get_mut(&im_id).unwrap().as_mut_ptr();
        unsafe {
            let slice_re = std::slice::from_raw_parts_mut(vector_ptr_re, n);
            let slice_im = std::slice::from_raw_parts_mut(vector_ptr_im, n);
            crate::fft::fft_radix2(slice_re, slice_im, inverse);
        }
    }

    pub fn diff(&mut self, in_id: u32, out_id: u32, h: f64) {
        let n = self.vectors.get(&in_id).unwrap().len();
        let in_ptr = self.vectors.get(&in_id).unwrap().as_ptr();
        let out_ptr = self.vectors.get_mut(&out_id).unwrap().as_mut_ptr();
        unsafe {
            let in_slice = std::slice::from_raw_parts(in_ptr, n);
            let out_slice = std::slice::from_raw_parts_mut(out_ptr, n);
            crate::calculus::diff_5pt_stencil(in_slice, h, out_slice);
        }
    }

    pub fn integrate(&self, id: u32, h: f64) -> f64 {
        let vec = self.vectors.get(&id).unwrap();
        crate::calculus::integrate_simpson(vec, h)
    }

    pub fn smooth_sg(&mut self, id: u32, out_id: u32, window: usize) {
        let n = self.vectors.get(&id).unwrap().len();
        let in_ptr = self.vectors.get(&id).unwrap().as_ptr();
        let out_ptr = self.vectors.get_mut(&out_id).unwrap().as_mut_ptr();
        unsafe {
            let in_slice = std::slice::from_raw_parts(in_ptr, n);
            let out_slice = std::slice::from_raw_parts_mut(out_ptr, n);
            let res = crate::analysis::smooth_savitzky_golay(in_slice, window);
            out_slice.copy_from_slice(&res);
        }
    }

    pub fn detect_peaks(&self, id: u32, threshold: f64) -> Vec<u32> {
        let data = self.vectors.get(&id).unwrap();
        crate::analysis::find_peaks(data, threshold)
    }

    pub fn fit_poly(&self, x_id: u32, y_id: u32, order: usize) -> Vec<f64> {
        let x = self.vectors.get(&x_id).unwrap();
        let y = self.vectors.get(&y_id).unwrap();
        crate::fitting::fit_polynomial(x, y, order).unwrap_or_else(|| vec![0.0; order + 1])
    }

    pub fn fit_gaussians(&self, x_id: u32, y_id: u32, a: f64, mu: f64, sigma: f64) -> Vec<f64> {
        let x = self.vectors.get(&x_id).unwrap();
        let y = self.vectors.get(&y_id).unwrap();
        crate::fitting::fit_gaussians(x, y, &[a, mu, sigma])
    }

    pub fn fit_exponential(&self, x_id: u32, y_id: u32) -> Vec<f64> {
        let x = self.vectors.get(&x_id).unwrap();
        let y = self.vectors.get(&y_id).unwrap();
        crate::fitting::fit_exponential(x, y).map(|v| vec![v[0], v[1]]).unwrap_or(vec![])
    }

    pub fn fit_logarithmic(&self, x_id: u32, y_id: u32) -> Vec<f64> {
        let x = self.vectors.get(&x_id).unwrap();
        let y = self.vectors.get(&y_id).unwrap();
        crate::fitting::fit_logarithmic(x, y).map(|v| vec![v[0], v[1]]).unwrap_or(vec![])
    }

    pub fn deconvolve(&mut self, id: u32, kernel_id: u32, out_id: u32, iterations: u32) {
        let n = self.vectors.get(&id).unwrap().len();
        let kn = self.vectors.get(&kernel_id).unwrap().len();
        let d_ptr = self.vectors.get(&id).unwrap().as_ptr();
        let k_ptr = self.vectors.get(&kernel_id).unwrap().as_ptr();
        let o_ptr = self.vectors.get_mut(&out_id).unwrap().as_mut_ptr();
        unsafe {
            let res = crate::analysis::deconvolve_rl(std::slice::from_raw_parts(d_ptr, n), std::slice::from_raw_parts(k_ptr, kn), iterations);
            std::slice::from_raw_parts_mut(o_ptr, n).copy_from_slice(&res);
        }
    }

    pub fn rfft(&mut self, id: u32, re_id: u32, im_id: u32) {
        let n = self.vectors.get(&id).unwrap().len();
        let m = self.vectors.get(&re_id).unwrap().len();
        let k = self.vectors.get(&im_id).unwrap().len();
        let i_ptr = self.vectors.get(&id).unwrap().as_ptr();
        let r_ptr = self.vectors.get_mut(&re_id).unwrap().as_mut_ptr();
        let im_ptr = self.vectors.get_mut(&im_id).unwrap().as_mut_ptr();
        unsafe {
            crate::fft::rfft_radix2(std::slice::from_raw_parts(i_ptr, n), std::slice::from_raw_parts_mut(r_ptr, m), std::slice::from_raw_parts_mut(im_ptr, k));
        }
    }

    pub fn filter_butterworth(&mut self, id: u32, out_id: u32, cutoff: f64, fs: f64) {
        let n = self.vectors.get(&id).unwrap().len();
        let i_ptr = self.vectors.get(&id).unwrap().as_ptr();
        let o_ptr = self.vectors.get_mut(&out_id).unwrap().as_mut_ptr();
        unsafe {
            let res = crate::analysis::butterworth_lowpass(std::slice::from_raw_parts(i_ptr, n), cutoff, fs);
            std::slice::from_raw_parts_mut(o_ptr, n).copy_from_slice(&res);
        }
    }

    pub fn snr(&self, id: u32) -> f64 {
        let data = self.vectors.get(&id).unwrap();
        crate::analysis::estimate_snr(data)
    }

    pub fn transpose(&mut self, id: u32, rows: usize, cols: usize) -> u32 {
        let data = self.vectors.get(&id).unwrap();
        let result = crate::linalg::transpose(data, rows, cols);
        let rid = self.next_id;
        self.vectors.insert(rid, result);
        self.next_id += 1;
        rid
    }

    pub fn invert_2x2(&mut self, id: u32) -> u32 {
        let data = self.vectors.get(&id).unwrap();
        let result = crate::linalg::invert_2x2(data).unwrap_or_else(|_| vec![0.0; 4]);
        let rid = self.next_id;
        self.vectors.insert(rid, result);
        self.next_id += 1;
        rid
    }

    pub fn invert_3x3(&mut self, id: u32) -> u32 {
        let data = self.vectors.get(&id).unwrap();
        let result = crate::linalg::invert_3x3(data).unwrap_or_else(|_| vec![0.0; 9]);
        let rid = self.next_id;
        self.vectors.insert(rid, result);
        self.next_id += 1;
        rid
    }
}
