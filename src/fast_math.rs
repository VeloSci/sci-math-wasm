use wasm_bindgen::prelude::*;
use rayon::prelude::*;

#[wasm_bindgen]
pub struct DataBuffer {
    data: Vec<f64>,
}

#[wasm_bindgen]
impl DataBuffer {
    #[wasm_bindgen(constructor)]
    pub fn new(size: usize) -> Self {
        Self { data: vec![0.0; size] }
    }

    pub fn ptr(&self) -> *const f64 { self.data.as_ptr() }
    pub fn mut_ptr(&mut self) -> *mut f64 { self.data.as_mut_ptr() }
    pub fn len(&self) -> usize { self.data.len() }
}

/// MANDELBROT ZERO-COPY - Parallel
#[wasm_bindgen]
pub fn fast_mandelbrot(
    in_ptr: *const f64, 
    out_ptr: *mut f64, 
    len: usize, 
    iters: u32
) {
    let in_addr = in_ptr as usize;
    let out_addr = out_ptr as usize;

    (0..len).into_par_iter()
        .with_min_len(1024)
        .for_each(|i| unsafe {
            let input = in_addr as *const f64;
            let output = out_addr as *mut f64;
            
            let c = *input.add(i);
            let mut x = c;
            let mut y = c;
            let mut d = 0.0;
            
            for _ in 0..iters {
                let next_x = x * x - y * y + c;
                let next_y = 2.0 * x * y + 0.5;
                x = next_x;
                y = next_y;
                let mag_sq = x * x + y * y;
                d += mag_sq.sqrt();
                if mag_sq > 100.0 {
                    x = 0.0; y = 0.0;
                }
            }
            *output.add(i) = d;
        });
}

/// MATRIX MULTIPLY ZERO-COPY - Parallel
#[wasm_bindgen]
pub fn fast_matmul_ptr(
    a_ptr: *const f64, 
    b_ptr: *const f64, 
    out_ptr: *mut f64, 
    size: usize
) {
    let a_addr = a_ptr as usize;
    let b_addr = b_ptr as usize;
    let out_addr = out_ptr as usize;

    // Parallelize over rows
    (0..size).into_par_iter()
        .for_each(|i| unsafe {
            let a = a_addr as *const f64;
            let b = b_addr as *const f64;
            let out = out_addr as *mut f64;
            
            let i_off = i * size;
            // Clear row
            for j in 0..size {
                *out.add(i_off + j) = 0.0;
            }

            for k in 0..size {
                let aik = *a.add(i_off + k);
                let b_off = k * size;
                for j in 0..size {
                    *out.add(i_off + j) += aik * *b.add(b_off + j);
                }
            }
        });
}
