#![cfg(feature = "threads")]

use wasm_bindgen::prelude::*;
use std::collections::HashMap;

pub mod nbody;
pub mod matmul;
pub mod import;
pub mod analysis;
pub mod fitting;

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

    pub fn nbody_f32_soa(&mut self, idx: u32, idy: u32, idz: u32, ivx: u32, ivy: u32, ivz: u32, dt: f32, iters: u32) {
        let n = self.vectors_f32.get(&idx).unwrap().len();
        let px = self.vectors_f32.get(&idx).unwrap().as_ptr() as usize;
        let py = self.vectors_f32.get(&idy).unwrap().as_ptr() as usize;
        let pz = self.vectors_f32.get(&idz).unwrap().as_ptr() as usize;
        let vx = self.vectors_f32.get_mut(&ivx).unwrap().as_mut_ptr() as usize;
        let vy = self.vectors_f32.get_mut(&ivy).unwrap().as_mut_ptr() as usize;
        let vz = self.vectors_f32.get_mut(&ivz).unwrap().as_mut_ptr() as usize;
        nbody::run_nbody_f32(n, px, py, pz, vx, vy, vz, dt, iters);
    }

    pub fn matmul_unrolled(&mut self, a_id: u32, b_id: u32, o_id: u32, size: usize) {
        let ap = self.vectors.get(&a_id).unwrap().as_ptr() as usize;
        let bp = self.vectors.get(&b_id).unwrap().as_ptr() as usize;
        let op = self.vectors.get_mut(&o_id).unwrap().as_mut_ptr() as usize;
        matmul::run_matmul_unrolled(ap, bp, op, size);
    }

    pub fn deconvolve(&mut self, id: u32, kid: u32, oid: u32, iters: u32) {
        let n = self.vectors.get(&id).unwrap().len();
        let kn = self.vectors.get(&kid).unwrap().len();
        let d = self.vectors.get(&id).unwrap().as_ptr();
        let k = self.vectors.get(&kid).unwrap().as_ptr();
        let o = self.vectors.get_mut(&oid).unwrap().as_mut_ptr();
        analysis::run_deconvolve(n, kn, d, k, o, iters);
    }

    pub fn filter_butterworth(&mut self, id: u32, oid: u32, cutoff: f64, fs: f64) {
        let n = self.vectors.get(&id).unwrap().len();
        let i = self.vectors.get(&id).unwrap().as_ptr();
        let o = self.vectors.get_mut(&oid).unwrap().as_mut_ptr();
        analysis::run_filter_butterworth(n, i, o, cutoff, fs);
    }

    pub fn smooth_sg(&mut self, id: u32, oid: u32, window: usize) {
        let n = self.vectors.get(&id).unwrap().len();
        let i = self.vectors.get(&id).unwrap().as_ptr();
        let o = self.vectors.get_mut(&oid).unwrap().as_mut_ptr();
        analysis::run_smooth_sg(n, i, o, window);
    }

    pub fn detect_peaks(&self, id: u32, threshold: f64) -> Vec<u32> {
        crate::analysis::find_peaks(self.vectors.get(&id).unwrap(), threshold)
    }

    pub fn fit_poly(&self, x_id: u32, y_id: u32, order: usize) -> Vec<f64> {
        let x = self.vectors.get(&x_id).unwrap();
        let y = self.vectors.get(&y_id).unwrap();
        fitting::run_fit_poly(x, y, order)
    }

    pub fn fit_gaussians(&self, x_id: u32, y_id: u32, a: f64, mu: f64, sigma: f64) -> Vec<f64> {
        let x = self.vectors.get(&x_id).unwrap();
        let y = self.vectors.get(&y_id).unwrap();
        fitting::run_fit_gaussians(x, y, [a, mu, sigma])
    }

    pub fn fit_exponential(&self, x_id: u32, y_id: u32) -> Vec<f64> {
        let x = self.vectors.get(&x_id).unwrap();
        let y = self.vectors.get(&y_id).unwrap();
        fitting::run_fit_exponential(x, y)
    }

    pub fn fit_logarithmic(&self, x_id: u32, y_id: u32) -> Vec<f64> {
        let x = self.vectors.get(&x_id).unwrap();
        let y = self.vectors.get(&y_id).unwrap();
        fitting::run_fit_logarithmic(x, y)
    }

    #[wasm_bindgen(js_name = importCSV)]
    pub fn import_csv(&mut self, data: &[u8], delimiter: u8, skip: usize) -> Vec<u32> {
        let val = import::run_import_csv(data, delimiter, skip);
        if val.is_empty() { return vec![]; }
        let id = self.next_id;
        self.vectors.insert(id, val);
        self.next_id += 1;
        vec![id]
    }

    pub fn fft(&mut self, re: u32, im: u32, inv: bool) {
        let n = self.vectors.get(&re).unwrap().len();
        let pr = self.vectors.get_mut(&re).unwrap().as_mut_ptr();
        let pi = self.vectors.get_mut(&im).unwrap().as_mut_ptr();
        unsafe { crate::fft::fft_radix2(std::slice::from_raw_parts_mut(pr, n), std::slice::from_raw_parts_mut(pi, n), inv); }
    }

    pub fn diff(&mut self, i: u32, o: u32, h: f64) {
        let n = self.vectors.get(&i).unwrap().len();
        let pi = self.vectors.get(&i).unwrap().as_ptr();
        let po = self.vectors.get_mut(&o).unwrap().as_mut_ptr();
        unsafe { crate::calculus::diff_5pt_stencil(std::slice::from_raw_parts(pi, n), h, std::slice::from_raw_parts_mut(po, n)); }
    }

    pub fn integrate(&self, id: u32, h: f64) -> f64 {
        crate::calculus::integrate_simpson(self.vectors.get(&id).unwrap(), h)
    }
}
