use rayon::prelude::*;

#[cfg(target_feature = "simd128")]
pub fn run_matmul_simd(
    a_addr: usize,
    b_addr: usize,
    out_addr: usize,
    size: usize
) {
    use core::arch::wasm32::*;
    unsafe {
        let chunk_size = if size > 256 { size / rayon::current_num_threads().max(1) } else { size };
        
        (0..size).into_par_iter().with_min_len(chunk_size).for_each(move |i| {
            let a = a_addr as *const f64;
            let b = b_addr as *const f64;
            let out = out_addr as *mut f64;
            
            let i_idx = i * size;
            
            for k in 0..size {
                let aik = f64x2_splat(*a.add(i_idx + k));
                let b_row = k * size;
                let mut j = 0;
                
                while j + 1 < size {
                    let vb = v128_load(b.add(b_row + j) as *const v128);
                    let vo = v128_load(out.add(i_idx + j) as *const v128);
                    let vr = f64x2_add(vo, f64x2_mul(aik, vb));
                    v128_store(out.add(i_idx + j) as *mut v128, vr);
                    j += 2;
                }
                
                while j < size {
                    *out.add(i_idx + j) += *a.add(i_idx + k) * *b.add(b_row + j);
                    j += 1;
                }
            }
        });
    }
}

pub fn run_matmul_unrolled(
    a_ptr: usize,
    b_ptr: usize,
    out_ptr: usize,
    size: usize
) {
    #[cfg(target_feature = "simd128")]
    {
        if size % 2 == 0 || size > 128 {
             return run_matmul_simd(a_ptr, b_ptr, out_ptr, size);
        }
    }
    
    // Fallback unrolled version (original)
    unsafe {
        let chunk_size = if size > 512 { size / rayon::current_num_threads().max(1) } else { size };
        (0..size).into_par_iter().with_min_len(chunk_size).for_each(move |i| {
            let a = a_ptr as *const f64;
            let b = b_ptr as *const f64;
            let out = out_ptr as *mut f64;
            let i_idx = i * size;
            for k in 0..size {
                let aik = *a.add(i_idx + k);
                let b_row = k * size;
                let mut j = 0;
                while j + 3 < size {
                    *out.add(i_idx + j) += aik * *b.add(b_row + j);
                    *out.add(i_idx + j + 1) += aik * *b.add(b_row + j + 1);
                    *out.add(i_idx + j + 2) += aik * *b.add(b_row + j + 2);
                    *out.add(i_idx + j + 3) += aik * *b.add(b_row + j + 3);
                    j += 4;
                }
                while j < size {
                    *out.add(i_idx + j) += aik * *b.add(b_row + j);
                    j += 1;
                }
            }
        });
    }
}
