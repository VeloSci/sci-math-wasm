use wasm_bindgen::prelude::*;
use js_sys::Float64Array;
use crate::io::parallel_core::*;

#[wasm_bindgen]
pub struct TextStreamer {
    pub(crate) delimiter: u8,
    pub(crate) skip_lines: usize,
    pub(crate) remainder: Vec<u8>,
    pub(crate) lines_skipped_count: usize,
    pub(crate) col_count: Option<usize>,
}

#[wasm_bindgen]
impl TextStreamer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            delimiter: b',',
            skip_lines: 0,
            remainder: Vec::new(),
            lines_skipped_count: 0,
            col_count: None,
        }
    }

    #[wasm_bindgen(js_name = setDelimiter)]
    pub fn set_delimiter(mut self, delimiter: u8) -> TextStreamer {
        self.delimiter = delimiter;
        self
    }

    #[wasm_bindgen(js_name = setSkipLines)]
    pub fn set_skip_lines(mut self, skip: usize) -> TextStreamer {
        self.skip_lines = skip;
        self
    }

    #[wasm_bindgen(js_name = processNumericChunk)]
    pub fn process_numeric_chunk(&mut self, chunk: &[u8]) -> Result<Float64Array, JsValue> {
        let (valid, starts) = self.prepare_valid_data(chunk);
        if starts.is_empty() { return Ok(Float64Array::new(&JsValue::from(0))); }

        let values = parallel_numeric_parse(valid, self.delimiter, &starts);
        let array = Float64Array::new(&JsValue::from(values.len() as u32));
        array.copy_from(&values);
        Ok(array)
    }

    #[wasm_bindgen(js_name = processColumnarChunk)]
    pub fn process_columnar_chunk(&mut self, chunk: &[u8]) -> Result<JsValue, JsValue> {
        let (valid, starts) = self.prepare_valid_data(chunk);
        if starts.is_empty() { return Ok(js_sys::Array::new().into()); }

        let cc = self.col_count.unwrap_or_else(|| {
            let count = valid[starts[0]..starts[1].saturating_sub(1)].split(|&b| b == self.delimiter).count();
            self.col_count = Some(count);
            count
        });

        let cols = parallel_columnar_parse(valid, self.delimiter, &starts, cc);
        let result = js_sys::Array::new();
        for col in cols {
            let arr = Float64Array::new_with_length(col.len() as u32);
            arr.copy_from(&col);
            result.push(&arr);
        }
        Ok(result.into())
    }

    #[wasm_bindgen(js_name = processChunk)]
    pub fn process_chunk(&mut self, chunk: &[u8]) -> Result<JsValue, JsValue> {
        let (valid, starts) = self.prepare_valid_data(chunk);
        if starts.is_empty() { return Ok(serde_wasm_bindgen::to_value(&Vec::<Vec<String>>::new())?); }

        let rows: Vec<Vec<String>> = starts.windows(2).map(|w| {
            let line = &valid[w[0]..w[1].saturating_sub(1)];
            line.split(|&b| b == self.delimiter)
                .map(|f| String::from_utf8_lossy(f).trim().to_string())
                .collect()
        }).collect();
        Ok(serde_wasm_bindgen::to_value(&rows)?)
    }

    fn prepare_valid_data<'a>(&mut self, chunk: &[u8]) -> (&'a [u8], Vec<usize>) {
        let mut data = std::mem::take(&mut self.remainder);
        data.extend_from_slice(chunk);
        
        let last_nl = match memchr::memrchr(b'\n', &data) {
            Some(idx) => idx,
            None => { self.remainder = data; return (&[], vec![]); }
        };

        let (valid, rest) = data.split_at(last_nl + 1);
        self.remainder = rest.to_vec();

        let mut starts = Vec::with_capacity(valid.len() / 40);
        let mut pos = 0;
        for nl in memchr::memchr_iter(b'\n', valid) {
            if self.lines_skipped_count < self.skip_lines { self.lines_skipped_count += 1; }
            else { starts.push(pos); }
            pos = nl + 1;
        }
        if !starts.is_empty() { starts.push(valid.len()); }
        
        // Safety: Valid lives as long as the data we just split. 
        // Since we are returning it to JS and it will be processed immediately, transmute is used for the lifetime trick.
        unsafe { (std::mem::transmute(valid), starts) }
    }
}
