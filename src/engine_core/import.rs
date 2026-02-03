use rayon::prelude::*;

pub fn run_import_csv(
    data: &[u8], 
    delimiter: u8, 
    skip_lines: usize
) -> Vec<f64> {
    let mut line_starts = vec![0];
    line_starts.extend(memchr::memchr_iter(b'\n', data).map(|pos| pos + 1));
    
    if line_starts.len() <= skip_lines {
        return vec![];
    }
    
    line_starts[skip_lines..]
        .par_windows(2)
        .flat_map(|window| {
            let start = window[0];
            let end = window[1].saturating_sub(1);
            if start >= end { return vec![]; }
            
            let line = &data[start..end];
            let mut v = Vec::with_capacity(8);
            for field in line.split(|&b| b == delimiter) {
                let mut s = 0;
                while s < field.len() && field[s].is_ascii_whitespace() { s += 1; }
                let mut e = field.len();
                while e > s && field[e - 1].is_ascii_whitespace() { e -= 1; }
                
                let f = &field[s..e];
                if f.is_empty() {
                    v.push(f64::NAN);
                } else {
                    v.push(fast_float::parse(f).unwrap_or(f64::NAN));
                }
            }
            v
        })
        .collect()
}
