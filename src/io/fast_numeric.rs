//! Ultra-fast numeric parser for scientific data
//! Zero-copy, SIMD-accelerated, brute-force byte processing
//! 
//! Strategy:
//! 1. Use memchr (SIMD) to find line boundaries
//! 2. Parse ASCII digits manually (no UTF-8 validation overhead)
//! 3. Parallel processing with rayon
//! 4. Direct Float64Array output

use wasm_bindgen::prelude::*;
use js_sys::Float64Array;
use rayon::prelude::*;
use memchr::memchr_iter;
use std::sync::Mutex;

// ============================================================================
// ZERO-COPY BUFFER MANAGEMENT
// ============================================================================

/// Global buffer for zero-copy operations
static PARSE_BUFFER: Mutex<Vec<u8>> = Mutex::new(Vec::new());
static RESULT_BUFFER: Mutex<Vec<f64>> = Mutex::new(Vec::new());

/// Allocate input buffer and return pointer for JS to write directly
#[wasm_bindgen(js_name = allocParseBuffer)]
pub fn alloc_parse_buffer(size: usize) -> *mut u8 {
    let mut buf = PARSE_BUFFER.lock().unwrap();
    buf.clear();
    buf.resize(size, 0);
    buf.as_mut_ptr()
}

/// Get pointer to result buffer after parsing
#[wasm_bindgen(js_name = getResultPtr)]
pub fn get_result_ptr() -> *const f64 {
    let buf = RESULT_BUFFER.lock().unwrap();
    buf.as_ptr()
}

/// Get length of result buffer
#[wasm_bindgen(js_name = getResultLen)]
pub fn get_result_len() -> usize {
    let buf = RESULT_BUFFER.lock().unwrap();
    buf.len()
}

/// Parse the pre-loaded buffer (zero-copy from JS perspective)
#[wasm_bindgen(js_name = parseBufferInPlace)]
pub fn parse_buffer_in_place(delimiter: u8, skip_lines: usize) -> usize {
    let input = PARSE_BUFFER.lock().unwrap();
    let data = &input[..];
    
    // Step 1: Detect line boundaries
    let mut line_starts = vec![0usize];
    line_starts.extend(memchr_iter(b'\n', data).map(|pos| pos + 1));
    
    if line_starts.len() <= skip_lines {
        let mut result = RESULT_BUFFER.lock().unwrap();
        result.clear();
        return 0;
    }
    
    // Step 2: Parallel processing with large chunks to avoid allocation overhead
    let remaining_lines = &line_starts[skip_lines..];
    let num_lines = remaining_lines.len();
    let num_threads = rayon::current_num_threads();
    let lines_per_chunk = (num_lines / num_threads).max(1024);

    let values: Vec<f64> = remaining_lines.par_chunks(lines_per_chunk)
        .map(|chunk| {
            let mut chunk_values = Vec::with_capacity(chunk.len() * 8);
            for window in chunk.windows(2) {
                let s = window[0];
                let e = window[1].saturating_sub(1);
                if s < e {
                    let line = &data[s..e];
                    for field in line.split(|&b| b == delimiter) {
                        let mut fs = 0;
                        while fs < field.len() && field[fs].is_ascii_whitespace() { fs += 1; }
                        let mut fe = field.len();
                        while fe > fs && field[fe - 1].is_ascii_whitespace() { fe -= 1; }
                        if fs < fe {
                            chunk_values.push(fast_float::parse(&field[fs..fe]).unwrap_or(f64::NAN));
                        } else {
                            chunk_values.push(f64::NAN);
                        }
                    }
                }
            }
            // Handle last line of the chunk if it's the very last line of the file
            chunk_values
        })
        .flatten()
        .collect();
    
    let len = values.len();
    let mut result = RESULT_BUFFER.lock().unwrap();
    *result = values;
    len
}

// ============================================================================
// OPTIMIZED SINGLE-CALL VERSION (for comparison)
// ============================================================================

/// Ultra-fast CSV numeric parser
/// Operates directly on bytes, no string allocations
#[wasm_bindgen(js_name = parseNumericCSVFast)]
pub fn parse_numeric_csv_fast(
    data: &[u8],
    delimiter: u8,
    skip_lines: usize,
) -> Result<Float64Array, JsValue> {
    let mut line_starts = vec![0];
    line_starts.extend(memchr_iter(b'\n', data).map(|pos| pos + 1));
    
    if line_starts.len() <= skip_lines {
        return Ok(Float64Array::new(&JsValue::from(0)));
    }
    
    let remaining_lines = &line_starts[skip_lines..];
    let num_lines = remaining_lines.len();
    let num_threads = rayon::current_num_threads();
    let lines_per_chunk = (num_lines / num_threads).max(1024);

    let values: Vec<f64> = remaining_lines.par_chunks(lines_per_chunk)
        .map(|chunk| {
            let mut chunk_values = Vec::with_capacity(chunk.len() * 8);
            for window in chunk.windows(2) {
                let s = window[0];
                let e = window[1].saturating_sub(1);
                if s < e {
                    let line = &data[s..e];
                    for field in line.split(|&b| b == delimiter) {
                        let mut fs = 0;
                        while fs < field.len() && field[fs].is_ascii_whitespace() { fs += 1; }
                        let mut fe = field.len();
                        while fe > fs && field[fe - 1].is_ascii_whitespace() { fe -= 1; }
                        if fs < fe {
                            chunk_values.push(fast_float::parse(&field[fs..fe]).unwrap_or(f64::NAN));
                        } else {
                            chunk_values.push(f64::NAN);
                        }
                    }
                }
            }
            chunk_values
        })
        .flatten()
        .collect();
    
    let array = Float64Array::new(&JsValue::from(values.len() as u32));
    array.copy_from(&values);
    Ok(array)
}

/// Manual f64 parser from ASCII bytes (keeping for backward compat if needed)
#[inline]
fn parse_f64_bytes(bytes: &[u8]) -> Option<f64> {
    if bytes.is_empty() { return None; }
    let mut start = 0;
    while start < bytes.len() && bytes[start].is_ascii_whitespace() { start += 1; }
    let mut end = bytes.len();
    while end > start && bytes[end - 1].is_ascii_whitespace() { end -= 1; }
    if start >= end { return None; }
    fast_float::parse(&bytes[start..end]).ok()
}

/// Ultra-fast fixed-width numeric parser
#[wasm_bindgen(js_name = parseFixedWidthFast)]
pub fn parse_fixed_width_fast(
    data: &[u8],
    widths: Vec<usize>,
    skip_lines: usize,
) -> Result<Float64Array, JsValue> {
    let _total_width: usize = widths.iter().sum::<usize>() + widths.len() - 1;
    
    // Find line boundaries
    let mut line_starts = vec![0];
    line_starts.extend(memchr_iter(b'\n', data).map(|pos| pos + 1));
    
    if line_starts.len() <= skip_lines {
        return Ok(Float64Array::new(&JsValue::from(0)));
    }
    
    // Process in parallel
    let values: Vec<f64> = line_starts[skip_lines..]
        .par_windows(2)
        .flat_map(|window| {
            let start = window[0];
            let end = window[1].saturating_sub(1);
            if start >= end { return vec![]; }
            
            let line = &data[start..end];
            parse_fixed_line(line, &widths)
        })
        .collect();
    
    let array = Float64Array::new(&JsValue::from(values.len() as u32));
    array.copy_from(&values);
    Ok(array)
}

/// Parse fixed-width line
#[inline]
fn parse_fixed_line(line: &[u8], widths: &[usize]) -> Vec<f64> {
    let mut values = Vec::with_capacity(widths.len());
    let mut pos = 0;
    
    for &width in widths {
        if pos + width > line.len() {
            break;
        }
        
        if let Some(val) = parse_f64_bytes(&line[pos..pos + width]) {
            values.push(val);
        } else {
            values.push(f64::NAN);
        }
        
        pos += width;
    }
    
    values
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parse_f64_bytes() {
        assert_eq!(parse_f64_bytes(b"123.45"), Some(123.45));
        assert_eq!(parse_f64_bytes(b"  -42.0  "), Some(-42.0));
        assert_eq!(parse_f64_bytes(b"1.23e-4"), Some(0.000123));
        assert_eq!(parse_f64_bytes(b""), None);
        assert_eq!(parse_f64_bytes(b"   "), None);
    }
    
    #[test]
    fn test_parse_line_fast() {
        let line = b"1.5,2.3,4.7";
        let result = parse_line_fast(line, b',');
        assert_eq!(result, vec![1.5, 2.3, 4.7]);
    }
}
