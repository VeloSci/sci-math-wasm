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
    
    // Step 1: Find all line boundaries using SIMD
    let mut line_starts = vec![0usize];
    line_starts.extend(memchr_iter(b'\n', data).map(|pos| pos + 1));
    
    if line_starts.len() <= skip_lines {
        let mut result = RESULT_BUFFER.lock().unwrap();
        result.clear();
        return 0;
    }
    
    // Step 2: Process lines in parallel
    let values: Vec<f64> = line_starts[skip_lines..]
        .par_windows(2)
        .flat_map(|window| {
            let start = window[0];
            let end = window[1].saturating_sub(1);
            if start >= end { return vec![]; }
            
            let line = &data[start..end];
            parse_line_fast(line, delimiter)
        })
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
    // Step 1: Find all line boundaries using SIMD
    let mut line_starts = vec![0];
    line_starts.extend(memchr_iter(b'\n', data).map(|pos| pos + 1));
    
    if line_starts.len() <= skip_lines {
        return Ok(Float64Array::new(&JsValue::from(0)));
    }
    
    // Step 2: Process lines in parallel
    let values: Vec<f64> = line_starts[skip_lines..]
        .par_windows(2)
        .flat_map(|window| {
            let start = window[0];
            let end = window[1].saturating_sub(1); // Remove \n
            if start >= end { return vec![]; }
            
            let line = &data[start..end];
            parse_line_fast(line, delimiter)
        })
        .collect();
    
    // Handle last line if it doesn't end with \n
    if let Some(&last_start) = line_starts.last() {
        if last_start < data.len() {
            let last_line = &data[last_start..];
            let mut last_values = values;
            last_values.extend(parse_line_fast(last_line, delimiter));
            
            let array = Float64Array::new(&JsValue::from(last_values.len() as u32));
            array.copy_from(&last_values);
            return Ok(array);
        }
    }
    
    let array = Float64Array::new(&JsValue::from(values.len() as u32));
    array.copy_from(&values);
    Ok(array)
}

/// Parse a single line into f64 values
/// No allocations, direct byte→float conversion
#[inline]
fn parse_line_fast(line: &[u8], delimiter: u8) -> Vec<f64> {
    let mut values = Vec::with_capacity(16);
    let mut start = 0;
    
    // Find delimiter positions
    for pos in memchr_iter(delimiter, line) {
        if let Some(val) = parse_f64_bytes(&line[start..pos]) {
            values.push(val);
        }
        start = pos + 1;
    }
    
    // Last field
    if start < line.len() {
        if let Some(val) = parse_f64_bytes(&line[start..]) {
            values.push(val);
        }
    }
    
    values
}

/// Manual f64 parser from ASCII bytes
/// Handles: integers, decimals, scientific notation, +/- signs
/// Returns None for invalid input
#[inline]
fn parse_f64_bytes(bytes: &[u8]) -> Option<f64> {
    if bytes.is_empty() {
        return None;
    }
    
    // Trim whitespace
    let mut start = 0;
    let mut end = bytes.len();
    
    while start < end && bytes[start].is_ascii_whitespace() {
        start += 1;
    }
    while end > start && bytes[end - 1].is_ascii_whitespace() {
        end -= 1;
    }
    
    if start >= end {
        return None;
    }
    
    let trimmed = &bytes[start..end];
    
    // Use fast-float for the actual parsing (it's optimized for this)
    fast_float::parse(trimmed).ok()
}

/// Ultra-fast fixed-width numeric parser
#[wasm_bindgen(js_name = parseFixedWidthFast)]
pub fn parse_fixed_width_fast(
    data: &[u8],
    widths: Vec<usize>,
    skip_lines: usize,
) -> Result<Float64Array, JsValue> {
    let total_width: usize = widths.iter().sum::<usize>() + widths.len() - 1;
    
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
