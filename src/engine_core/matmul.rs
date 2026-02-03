use rayon::prelude::*;

pub fn run_matmul_unrolled(
    a_addr: usize,
    b_addr: usize,
    out_addr: usize,
    size: usize
) {
    unsafe {
        let chunk_size = if size > 512 { size / rayon::current_num_threads().max(1) } else { size };
        
        (0..size).into_par_iter().with_min_len(chunk_size).for_each(move |i| {
            let a = a_addr as *const f64;
            let b = b_addr as *const f64;
            let out = out_addr as *mut f64;
            
            let i_idx = i * size;
            let mut row_a = vec![0.0; size];
            std::ptr::copy_nonoverlapping(a.add(i_idx), row_a.as_mut_ptr(), size);
            
            for k in 0..size {
                let aik = row_a[k];
                let b_row = k * size;
                let mut j = 0;
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
