use rayon::prelude::*;

pub fn parallel_numeric_parse(
    data: &[u8],
    delimiter: u8,
    line_starts: &[usize],
) -> Vec<f64> {
    let num_threads = rayon::current_num_threads();
    let chunk_size = (line_starts.len() / num_threads).max(1024);

    line_starts.par_chunks(chunk_size)
        .map(|chunk| {
            let mut local = Vec::with_capacity(chunk.len());
            for i in 0..chunk.len() - 1 {
                let s = chunk[i];
                let e = chunk[i+1].saturating_sub(1);
                if s < e {
                    let line = &data[s..e];
                    for field in line.split(|&b| b == delimiter) {
                        let mut fs = 0;
                        while fs < field.len() && field[fs].is_ascii_whitespace() { fs += 1; }
                        let mut fe = field.len();
                        while fe > fs && field[fe - 1].is_ascii_whitespace() { fe -= 1; }
                        local.push(if fs < fe {
                            fast_float::parse(&field[fs..fe]).unwrap_or(f64::NAN)
                        } else {
                            f64::NAN
                        });
                    }
                }
            }
            local
        })
        .flatten()
        .collect()
}

pub fn parallel_columnar_parse(
    data: &[u8],
    delimiter: u8,
    line_starts: &[usize],
    col_count: usize,
) -> Vec<Vec<f64>> {
    let num_threads = rayon::current_num_threads();
    let chunk_size = (line_starts.len() / num_threads).max(1024);

    let thread_results: Vec<Vec<Vec<f64>>> = line_starts.par_chunks(chunk_size)
        .map(|chunk| {
            let mut local_cols = vec![Vec::with_capacity(chunk.len()); col_count];
            for i in 0..chunk.len() - 1 {
                let s = chunk[i];
                let e = chunk[i+1].saturating_sub(1);
                if s < e {
                    let line = &data[s..e];
                    let mut fields = line.split(|&b| b == delimiter);
                    for col_idx in 0..col_count {
                        if let Some(field) = fields.next() {
                            let mut fs = 0;
                            while fs < field.len() && field[fs].is_ascii_whitespace() { fs += 1; }
                            let mut fe = field.len();
                            while fe > fs && field[fe - 1].is_ascii_whitespace() { fe -= 1; }
                            local_cols[col_idx].push(if fs < fe {
                                fast_float::parse(&field[fs..fe]).unwrap_or(f64::NAN)
                            } else {
                                f64::NAN
                            });
                        } else {
                            local_cols[col_idx].push(f64::NAN);
                        }
                    }
                }
            }
            local_cols
        })
        .collect();

    let mut final_cols = vec![Vec::with_capacity(line_starts.len()); col_count];
    for col_idx in 0..col_count {
        for tr in &thread_results {
            final_cols[col_idx].extend_from_slice(&tr[col_idx]);
        }
    }
    final_cols
}

pub fn parallel_columnar_parse_f32(
    data: &[u8],
    delimiter: u8,
    line_starts: &[usize],
    col_count: usize,
) -> Vec<Vec<f32>> {
    let num_threads = rayon::current_num_threads();
    let chunk_size = (line_starts.len() / num_threads).max(1024);

    let thread_results: Vec<Vec<Vec<f32>>> = line_starts.par_chunks(chunk_size)
        .map(|chunk| {
            let mut local_cols = vec![Vec::with_capacity(chunk.len()); col_count];
            for i in 0..chunk.len() - 1 {
                let s = chunk[i];
                let e = chunk[i+1].saturating_sub(1);
                if s < e {
                    let line = &data[s..e];
                    let mut fields = line.split(|&b| b == delimiter);
                    for col_idx in 0..col_count {
                        if let Some(field) = fields.next() {
                            let mut fs = 0;
                            while fs < field.len() && field[fs].is_ascii_whitespace() { fs += 1; }
                            let mut fe = field.len();
                            while fe > fs && field[fe - 1].is_ascii_whitespace() { fe -= 1; }
                            local_cols[col_idx].push(if fs < fe {
                                fast_float::parse(&field[fs..fe]).unwrap_or(f32::NAN)
                            } else {
                                f32::NAN
                            });
                        } else {
                            local_cols[col_idx].push(f32::NAN);
                        }
                    }
                }
            }
            local_cols
        })
        .collect();

    let mut final_cols = vec![Vec::with_capacity(line_starts.len()); col_count];
    for col_idx in 0..col_count {
        for tr in &thread_results {
            final_cols[col_idx].extend_from_slice(&tr[col_idx]);
        }
    }
    final_cols
}
