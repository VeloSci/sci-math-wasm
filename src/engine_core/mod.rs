#![cfg(feature = "threads")]

use wasm_bindgen::prelude::*;
pub mod memory;
pub mod ops;
pub mod nbody;
pub mod matmul;
pub mod import;
pub mod analysis;
pub mod fitting;

use memory::EngineState;

#[wasm_bindgen]
pub struct SciEngine {
    state: EngineState,
}

#[wasm_bindgen]
impl SciEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self { state: EngineState::new() }
    }

    pub fn create_vector(&mut self, size: usize) -> u32 {
        self.state.create_vector(size)
    }

    pub fn get_ptr(&self, id: u32) -> Result<*const f64, JsValue> {
        self.state.vectors.get(&id)
            .map(|v| v.as_ptr())
            .ok_or_else(|| JsValue::from_str("Vector not found"))
    }

    pub fn create_vector_f32(&mut self, size: usize) -> u32 {
        self.state.create_vector_f32(size)
    }

    pub fn get_ptr_f32(&self, id: u32) -> Result<*const f32, JsValue> {
        self.state.vectors_f32.get(&id)
            .map(|v| v.as_ptr())
            .ok_or_else(|| JsValue::from_str("Vector f32 not found"))
    }

    pub fn nbody_f32_soa(&mut self, idx: u32, idy: u32, idz: u32, ivx: u32, ivy: u32, ivz: u32, dt: f32, iters: u32) -> Result<(), JsValue> {
        ops::run_nbody(&mut self.state, idx, idy, idz, ivx, ivy, ivz, dt, iters)
            .map_err(|e| JsValue::from_str(&e))
    }

    pub fn matmul_unrolled(&mut self, a_id: u32, b_id: u32, o_id: u32, size: usize) -> Result<(), JsValue> {
        ops::run_matmul(&mut self.state, a_id, b_id, o_id, size)
            .map_err(|e| JsValue::from_str(&e))
    }

    pub fn import_csv(&mut self, data: &[u8], delimiter: u8, skip: usize) -> Vec<u32> {
        let val = import::run_import_csv(data, delimiter, skip);
        if val.is_empty() { return vec![]; }
        let id = self.state.create_vector(0); // Reserve ID
        self.state.vectors.insert(id, val);
        vec![id]
    }

    pub fn get_column_id(&self, name: String) -> i32 {
        self.state.columns.get(&name).map(|&id| id as i32).unwrap_or(-1)
    }

    pub fn fft(&mut self, re_id: u32, im_id: u32, inverse: bool) -> Result<(), JsValue> {
         let n = self.state.vectors.get(&re_id).ok_or("Real vector not found")?.len();
         if self.state.vectors.get(&im_id).ok_or("Imag vector not found")?.len() != n {
             return Err(JsValue::from_str("Real and imag vectors must have same length"));
         }
         
         let re_ptr = self.state.vectors.get_mut(&re_id).unwrap().as_mut_ptr();
         let im_ptr = self.state.vectors.get_mut(&im_id).unwrap().as_mut_ptr();
         
         let re_slice = unsafe { std::slice::from_raw_parts_mut(re_ptr, n) };
         let im_slice = unsafe { std::slice::from_raw_parts_mut(im_ptr, n) };
         
         crate::fft::fft_radix2(re_slice, im_slice, inverse);
         Ok(())
    }

    pub fn diff(&mut self, id_in: u32, id_out: u32, h: f64) -> Result<(), JsValue> {
        let n = self.state.vectors.get(&id_in).ok_or("Input vector not found")?.len();
        if self.state.vectors.get(&id_out).ok_or("Output vector not found")?.len() != n {
            return Err(JsValue::from_str("Input and output vectors must have same length"));
        }
        
        let in_ptr = self.state.vectors.get(&id_in).unwrap().as_ptr();
        let out_ptr = self.state.vectors.get_mut(&id_out).unwrap().as_mut_ptr();
        
        let in_slice = unsafe { std::slice::from_raw_parts(in_ptr, n) };
        let out_slice = unsafe { std::slice::from_raw_parts_mut(out_ptr, n) };
        
        unsafe { crate::calculus::diff_5pt_stencil(in_slice, h, out_slice); }
        Ok(())
    }

    pub fn integrate(&self, id_in: u32, h: f64) -> Result<f64, JsValue> {
        let v = self.state.vectors.get(&id_in).ok_or("Vector not found")?;
        Ok(crate::calculus::integrate_simpson(v, h))
    }

    pub fn fit_linear(&self, id_x: u32, id_y: u32) -> Result<Vec<f64>, JsValue> {
        let vx = self.state.vectors.get(&id_x).ok_or("Vector X not found")?;
        let vy = self.state.vectors.get(&id_y).ok_or("Vector Y not found")?;
        
        let (slope, intercept, r2) = crate::fitting::fit_linear(vx, vy);
        Ok(vec![slope, intercept, r2])
    }
    
    pub fn fit_poly(&self, id_x: u32, id_y: u32, order: usize) -> Result<Vec<f64>, JsValue> {
        let vx = self.state.vectors.get(&id_x).ok_or("Vector X not found")?;
        let vy = self.state.vectors.get(&id_y).ok_or("Vector Y not found")?;
        
        crate::fitting::fit_polynomial(vx, vy, order)
            .ok_or_else(|| JsValue::from_str("Failed to fit polynomial"))
    }

    pub fn fit_exponential(&self, id_x: u32, id_y: u32) -> Result<Vec<f64>, JsValue> {
        let vx = self.state.vectors.get(&id_x).ok_or("Vector X not found")?;
        let vy = self.state.vectors.get(&id_y).ok_or("Vector Y not found")?;
        
        match crate::fitting::fit_exponential(vx, vy) {
            Some(res) => Ok(res.to_vec()),
            None => Err(JsValue::from_str("Failed to fit exponential"))
        }
    }

    pub fn fit_logarithmic(&self, id_x: u32, id_y: u32) -> Result<Vec<f64>, JsValue> {
        let vx = self.state.vectors.get(&id_x).ok_or("Vector X not found")?;
        let vy = self.state.vectors.get(&id_y).ok_or("Vector Y not found")?;
        
        match crate::fitting::fit_logarithmic(vx, vy) {
            Some(res) => Ok(res.to_vec()),
            None => Err(JsValue::from_str("Failed to fit logarithmic"))
        }
    }

    pub fn fit_gaussians(&self, id_x: u32, id_y: u32, initial: Vec<f64>) -> Result<Vec<f64>, JsValue> {
        let vx = self.state.vectors.get(&id_x).ok_or("Vector X not found")?;
        let vy = self.state.vectors.get(&id_y).ok_or("Vector Y not found")?;
        
        Ok(crate::fitting::fit_gaussians(vx, vy, &initial))
    }

    pub fn remove_baseline(&mut self, id_y: u32, id_x: u32, order: usize, id_out: u32, iters: usize) -> Result<(), JsValue> {
        let n = self.state.vectors.get(&id_y).ok_or("Vector Y not found")?.len();
        if self.state.vectors.get(&id_x).ok_or("Vector X not found")?.len() != n {
            return Err(JsValue::from_str("Vectors must have same length"));
        }
        
        let vx = self.state.vectors.get(&id_x).unwrap().clone();
        let vy = self.state.vectors.get(&id_y).unwrap().clone();
        
        let out_ptr = self.state.vectors.get_mut(&id_out).ok_or("Output vector not found")?.as_mut_ptr();
        let out_slice = unsafe { std::slice::from_raw_parts_mut(out_ptr, n) };
        
        if iters > 0 {
             crate::analysis::remove_baseline_iterative(&vy, &vx, order, iters, out_slice);
        } else {
             crate::analysis::remove_baseline(&vy, &vx, order, out_slice);
        }
        Ok(())
    }

    pub fn smooth_sg(&mut self, id_in: u32, id_out: u32, window: usize, degree: usize) -> Result<(), JsValue> {
        let n = self.state.vectors.get(&id_in).ok_or("Input vector not found")?.len();
        let in_vec = self.state.vectors.get(&id_in).unwrap().clone();
        
        let out_ptr = self.state.vectors.get_mut(&id_out).ok_or("Output vector not found")?.as_mut_ptr();
        let out_slice = unsafe { std::slice::from_raw_parts_mut(out_ptr, n) };
        
        crate::analysis::smooth_savitzky_golay(&in_vec, window, degree, out_slice);
        Ok(())
    }

    pub fn detect_peaks(&self, id_in: u32, threshold: f64, prominence: f64) -> Result<Vec<u32>, JsValue> {
        let v = self.state.vectors.get(&id_in).ok_or("Vector not found")?;
        Ok(crate::analysis::find_peaks(v, threshold, prominence))
    }

    pub fn mode(&self, id_in: u32) -> Result<f64, JsValue> {
        let v = self.state.vectors.get(&id_in).ok_or("Vector not found")?;
        Ok(crate::stats::mode(v))
    }

    pub fn skewness(&self, id_in: u32) -> Result<f64, JsValue> {
        let v = self.state.vectors.get(&id_in).ok_or("Vector not found")?;
        Ok(crate::stats::skewness(v))
    }

    pub fn kurtosis(&self, id_in: u32) -> Result<f64, JsValue> {
        let v = self.state.vectors.get(&id_in).ok_or("Vector not found")?;
        Ok(crate::stats::kurtosis(v))
    }

    pub fn trace(&self, id_in: u32, n: usize) -> Result<f64, JsValue> {
        let v = self.state.vectors.get(&id_in).ok_or("Vector not found")?;
        crate::linalg::trace(v, n)
    }

    pub fn det_lu(&self, id_in: u32, n: usize) -> Result<f64, JsValue> {
        let v = self.state.vectors.get(&id_in).ok_or("Vector not found")?;
        crate::linalg::det_lu(v, n)
    }

    pub fn deconvolve_rl(&mut self, id_in: u32, id_kernel: u32, iterations: u32, id_out: u32) -> Result<(), JsValue> {
        let n = self.state.vectors.get(&id_in).ok_or("Input vector not found")?.len();
        let _k_len = self.state.vectors.get(&id_kernel).ok_or("Kernel vector not found")?.len();
        
        let in_vec = self.state.vectors.get(&id_in).unwrap().clone();
        let kernel_vec = self.state.vectors.get(&id_kernel).unwrap().clone();
        
        let out_ptr = self.state.vectors.get_mut(&id_out).ok_or("Output vector not found")?.as_mut_ptr();
        let out_slice = unsafe { std::slice::from_raw_parts_mut(out_ptr, n) };
        
        crate::analysis::deconvolve::deconvolve_rl(&in_vec, &kernel_vec, iterations, out_slice);
        Ok(())
    }

    pub fn decimate(&mut self, id_in: u32, factor: usize, id_out: u32) -> Result<(), JsValue> {
        let in_vec = self.state.vectors.get(&id_in).ok_or("Input vector not found")?.to_vec();
        let res = crate::analysis::decimate(&in_vec, factor);
        self.state.vectors.insert(id_out, res);
        Ok(())
    }

    pub fn resample_linear(&mut self, id_in: u32, new_len: usize, id_out: u32) -> Result<(), JsValue> {
        let in_vec = self.state.vectors.get(&id_in).ok_or("Input vector not found")?.to_vec();
        let res = crate::signal::resample(&in_vec, new_len);
        self.state.vectors.insert(id_out, res);
        Ok(())
    }

    pub fn genetic_algorithm(
        &self,
        f: &js_sys::Function,
        bounds: Vec<f64>,
        pop_size: usize,
        generations: usize,
        mutation_rate: f64
    ) -> Result<Vec<f64>, JsValue> {
        crate::optimization::genetic_algorithm(f, &bounds, pop_size, generations, mutation_rate)
    }

    pub fn butterworth_lp(&mut self, id_in: u32, id_out: u32, cutoff: f64, fs: f64) -> Result<(), JsValue> {
        let n = self.state.vectors.get(&id_in).ok_or("Input vector not found")?.len();
        if self.state.vectors.get(&id_out).ok_or("Output vector not found")?.len() != n {
            return Err(JsValue::from_str("Input and output vectors must have same length"));
        }
        
        let in_ptr = self.state.vectors.get(&id_in).unwrap().as_ptr();
        let out_ptr = self.state.vectors.get_mut(&id_out).unwrap().as_mut_ptr();
        
        analysis::run_filter_butterworth(n, in_ptr, out_ptr, cutoff, fs);
        Ok(())
    }
}
