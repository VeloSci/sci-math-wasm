use wasm_bindgen::prelude::*;
// use std::io::Read;

#[wasm_bindgen]
pub struct NpyData {
    pub(crate) data: Vec<f64>,
    pub(crate) shape: Vec<usize>,
}

#[wasm_bindgen]
impl NpyData {
    #[wasm_bindgen(getter)]
    pub fn data(&self) -> Vec<f64> {
        self.data.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn shape(&self) -> Vec<usize> {
        self.shape.clone()
    }
}

/// Simple NumPy (.npy) format parser (Version 1.0)
/// Note: Only supports little-endian f8 (float64) for now.
#[wasm_bindgen]
pub fn read_npy(bytes: &[u8]) -> Result<NpyData, JsValue> {
    if bytes.len() < 10 || &bytes[0..6] != b"\x93NUMPY" {
        return Err(JsValue::from_str("Invalid .npy magic number"));
    }

    let major = bytes[6];
    let header_len = if major == 1 {
        u16::from_le_bytes([bytes[8], bytes[9]]) as usize
    } else {
        u32::from_le_bytes([bytes[8], bytes[9], bytes[10], bytes[11]]) as usize
    };

    let header_start = if major == 1 { 10 } else { 12 };
    let header_end = header_start + header_len;
    let _header = std::str::from_utf8(&bytes[header_start..header_end])
        .map_err(|_| JsValue::from_str("Invalid header encoding"))?;

    // Very primitive parsing of the header string: {'descr': '<f8', 'fortran_order': False, 'shape': (10,), }
    // We'll just look for the shape and verify f8
    if !_header.contains("'descr': '<f8'") && !_header.contains("'descr': '|f8'") {
        return Err(JsValue::from_str("Only float64 (<f8) .npy files are supported in this sweep."));
    }

    // Extract shape
    let shape_start = _header.find("'shape': (").ok_or("Shape not found")? + 10;
    let shape_end = _header[shape_start..].find(")").ok_or("Invalid shape format")? + shape_start;
    let shape_str = &_header[shape_start..shape_end];
    let shape: Vec<usize> = shape_str.split(',')
        .filter(|s| !s.trim().is_empty())
        .map(|s| s.trim().parse::<usize>().unwrap_or(0))
        .collect();

    let data_start = header_end;
    let data_bytes = &bytes[data_start..];
    let n_elements = data_bytes.len() / 8;
    
    let mut data = Vec::with_capacity(n_elements);
    for i in 0..n_elements {
        let mut b = [0u8; 8];
        b.copy_from_slice(&data_bytes[i*8..(i+1)*8]);
        data.push(f64::from_le_bytes(b));
    }

    Ok(NpyData { data, shape })
}
