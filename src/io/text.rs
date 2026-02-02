//! # Universal Text Streamer
//!
//! A configurable streaming parser for text-based scientific data files.
//! Supports CSV, TSV, DAT, MPT, and other delimited formats.
//!
//! ## Features
//! - Configurable delimiter (comma, tab, space, etc.)
//! - Skip header/metadata lines
//! - Comment line filtering
//! - Streaming chunk processing for large files
//! - Fixed-width column support

use wasm_bindgen::prelude::*;
use csv::ReaderBuilder;
use serde::Serialize;
use rayon::prelude::*;
use js_sys::Float64Array;

/// Result row containing parsed string values
#[derive(Serialize)]
pub struct ParsedRow {
    pub values: Vec<String>,
}

/// Universal text file streamer with configurable parsing options.
///
/// # Example (TypeScript)
/// ```typescript
/// const streamer = new TextStreamer()
///     .set_delimiter(9)    // Tab character
///     .set_skip_lines(5)   // Skip 5 header lines
///     .set_comment_char(35); // '#' comments
///
/// const rows = streamer.process_chunk(chunk);
/// ```
#[wasm_bindgen]
pub struct TextStreamer {
    remainder: Vec<u8>,
    delimiter: u8,
    has_header: bool,
    comment_char: Option<u8>,
    skip_lines: usize,
    lines_skipped_count: usize,
    // Fixed-width parsing mode
    fixed_width_columns: Option<Vec<(usize, usize)>>,
    // Trim whitespace from values
    trim_values: bool,
    // Track if we've processed any data
    total_rows_processed: usize,
}

#[wasm_bindgen]
impl TextStreamer {
    /// Creates a new TextStreamer with default CSV settings.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            remainder: Vec::new(),
            delimiter: b',',
            has_header: false,
            comment_char: None,
            skip_lines: 0,
            lines_skipped_count: 0,
            fixed_width_columns: None,
            trim_values: true,
            total_rows_processed: 0,
        }
    }

    // ========== FLUENT CONFIGURATION API ==========

    /// Sets the field delimiter character (ASCII code).
    /// Common values: 44 (comma), 9 (tab), 32 (space), 59 (semicolon)
    #[wasm_bindgen(js_name = setDelimiter)]
    pub fn set_delimiter(mut self, char_code: u8) -> Self {
        self.delimiter = char_code;
        self
    }

    /// Sets the comment character (ASCII code). Lines starting with this char are skipped.
    /// Common values: 35 (#), 59 (;), 37 (%)
    #[wasm_bindgen(js_name = setCommentChar)]
    pub fn set_comment_char(mut self, char_code: u8) -> Self {
        self.comment_char = Some(char_code);
        self
    }

    /// Sets the number of initial lines to skip (metadata/headers).
    #[wasm_bindgen(js_name = setSkipLines)]
    pub fn set_skip_lines(mut self, count: usize) -> Self {
        self.skip_lines = count;
        self
    }

    /// Enables or disables header row handling.
    #[wasm_bindgen(js_name = setHasHeader)]
    pub fn set_has_header(mut self, has_header: bool) -> Self {
        self.has_header = has_header;
        self
    }

    /// Enables or disables whitespace trimming from values.
    #[wasm_bindgen(js_name = setTrimValues)]
    pub fn set_trim_values(mut self, trim: bool) -> Self {
        self.trim_values = trim;
        self
    }

    /// Configures fixed-width column parsing.
    /// Pass an array of [start, end] pairs defining column boundaries.
    /// When set, delimiter is ignored.
    #[wasm_bindgen(js_name = setFixedWidthColumns)]
    pub fn set_fixed_width_columns(mut self, columns: Vec<u32>) -> Self {
        if columns.len() % 2 != 0 {
            return self; // Invalid input, ignore
        }
        let pairs: Vec<(usize, usize)> = columns
            .chunks(2)
            .map(|c| (c[0] as usize, c[1] as usize))
            .collect();
        self.fixed_width_columns = Some(pairs);
        self
    }

    // ========== PROCESSING ENGINE ==========

    /// Processes a chunk and returns a flat Float64Array.
    /// This is the "Brute Force" path for maximum performance.
    #[wasm_bindgen(js_name = processNumericChunk)]
    pub fn process_numeric_chunk(&mut self, chunk: &[u8]) -> Result<Float64Array, JsValue> {
        let mut data = self.remainder.clone();
        data.extend_from_slice(chunk);

        let last_newline = data.iter().rposition(|&x| x == b'\n').unwrap_or(0);
        if last_newline == 0 && !data.contains(&b'\n') {
            self.remainder = data;
            return Ok(Float64Array::new(&JsValue::from(0)));
        }

        let (valid_chunk, rest) = data.split_at(last_newline + 1);
        self.remainder = rest.to_vec();

        let skip_lines = self.skip_lines;
        let skipped = self.lines_skipped_count;
        let delimiter = self.delimiter;
        let comment_char = self.comment_char;

        let text_data = String::from_utf8_lossy(valid_chunk);
        let lines: Vec<&str> = text_data.lines().collect();
        
        let values: Vec<f64> = lines.par_iter()
            .with_min_len(512)
            .enumerate()
            .filter_map(|(i, line)| {
                if skipped + i < skip_lines { return None; }
                let trimmed = line.trim();
                if trimmed.is_empty() { return None; }
                if let Some(c) = comment_char {
                    if trimmed.starts_with(c as char) { return None; }
                }
                Some(line)
            })
            .flat_map(|line| {
                // High performance split and parse
                line.split(delimiter as char)
                    .map(|part| {
                        fast_float::parse(part.trim()).unwrap_or(f64::NAN)
                    })
                    .collect::<Vec<f64>>()
            })
            .collect();

        self.total_rows_processed += lines.len();
        if self.lines_skipped_count < self.skip_lines {
            self.lines_skipped_count = (self.lines_skipped_count + lines.len()).min(self.skip_lines);
        }

        let array = Float64Array::new(&JsValue::from(values.len() as u32));
        array.copy_from(&values);
        Ok(array)
    }

    /// Processes a chunk of file data and returns parsed rows.
    /// Handles partial lines by storing remainder for next chunk.
    #[wasm_bindgen(js_name = processChunk)]
    pub fn process_chunk(&mut self, chunk: &[u8]) -> Result<JsValue, JsValue> {
        let mut data = self.remainder.clone();
        data.extend_from_slice(chunk);

        // Find the last complete line
        let last_newline = data.iter().rposition(|&x| x == b'\n').unwrap_or(0);
        
        if last_newline == 0 && !data.contains(&b'\n') {
            // No complete line yet, store everything
            self.remainder = data;
            return Ok(serde_wasm_bindgen::to_value(&Vec::<Vec<String>>::new())?);
        }

        let (valid_chunk, rest) = data.split_at(last_newline + 1);
        self.remainder = rest.to_vec();

        // Choose parsing method
        let rows = if self.fixed_width_columns.is_some() {
            self.parse_fixed_width(valid_chunk)?
        } else {
            self.parse_delimited(valid_chunk)?
        };

        self.total_rows_processed += rows.len();
        Ok(serde_wasm_bindgen::to_value(&rows)?)
    }

    /// Processes the final remaining data after all chunks.
    /// Call this when the file stream ends.
    #[wasm_bindgen(js_name = finalize)]
    pub fn finalize(&mut self) -> Result<JsValue, JsValue> {
        if self.remainder.is_empty() {
            return Ok(serde_wasm_bindgen::to_value(&Vec::<Vec<String>>::new())?);
        }

        let data = std::mem::take(&mut self.remainder);
        
        let rows = if self.fixed_width_columns.is_some() {
            self.parse_fixed_width(&data)?
        } else {
            self.parse_delimited(&data)?
        };

        self.total_rows_processed += rows.len();
        Ok(serde_wasm_bindgen::to_value(&rows)?)
    }

    /// Returns the total number of data rows processed so far.
    #[wasm_bindgen(js_name = getRowCount)]
    pub fn get_row_count(&self) -> usize {
        self.total_rows_processed
    }

    /// Resets the streamer state for reuse with a new file.
    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.remainder.clear();
        self.lines_skipped_count = 0;
        self.total_rows_processed = 0;
    }

    // ========== INTERNAL PARSING METHODS ==========

    fn parse_delimited(&mut self, data: &[u8]) -> Result<Vec<Vec<String>>, String> {
        let text = String::from_utf8_lossy(data);
        let lines: Vec<&str> = text.lines().collect();
        
        // Use parallel processing for large data sets
        let skip_lines = self.skip_lines;
        let skipped = self.lines_skipped_count;
        let delimiter = self.delimiter;
        let comment_char = self.comment_char;
        let trim_values = self.trim_values;

        let rows: Vec<Vec<String>> = lines.par_iter()
            .with_min_len(1024)
            .enumerate()
            .filter_map(|(i, line)| {
                // This logic is slightly complex for parallel since we need to track global skipped count
                // However, for TextStreamer, chunks are processed sequentially at the struct level, 
                // but we can parallelize the inner chunk work.
                
                // Skip lines (approximate for parallel, but since we know current skipped count)
                if skipped + i < skip_lines {
                    return None;
                }

                let trimmed = line.trim();
                if trimmed.is_empty() { return None; }

                if let Some(c) = comment_char {
                    if trimmed.starts_with(c as char) {
                        return None;
                    }
                }

                // Parse the single line as CSV
                let mut builder = ReaderBuilder::new();
                builder.delimiter(delimiter).has_headers(false);
                let mut reader = builder.from_reader(line.as_bytes());
                
                if let Some(result) = reader.records().next() {
                    if let Ok(record) = result {
                        let row: Vec<String> = record.iter()
                            .map(|s| if trim_values { s.trim().to_string() } else { s.to_string() })
                            .collect();
                        if !row.is_empty() { return Some(row); }
                    }
                }
                None
            })
            .collect();

        // Update skipped count for state persistence
        let lines_in_chunk = lines.len();
        if self.lines_skipped_count < self.skip_lines {
            self.lines_skipped_count = (self.lines_skipped_count + lines_in_chunk).min(self.skip_lines);
        }

        Ok(rows)
    }

    fn parse_fixed_width(&mut self, data: &[u8]) -> Result<Vec<Vec<String>>, String> {
        let columns = self.fixed_width_columns.as_ref().unwrap();
        let text = String::from_utf8_lossy(data);
        let lines: Vec<&str> = text.lines().collect();
        
        let skip_lines = self.skip_lines;
        let skipped = self.lines_skipped_count;
        let comment_char = self.comment_char;
        let trim_values = self.trim_values;

        let rows: Vec<Vec<String>> = lines.par_iter()
            .with_min_len(1024)
            .enumerate()
            .filter_map(|(i, line)| {
                if skipped + i < skip_lines {
                    return None;
                }

                if let Some(comment) = comment_char {
                    if line.trim().starts_with(comment as char) {
                        return None;
                    }
                }

                let line_bytes = line.as_bytes();
                let mut row = Vec::with_capacity(columns.len());

                for &(start, end) in columns {
                    let value = if start < line_bytes.len() {
                        let actual_end = end.min(line_bytes.len());
                        let slice = &line_bytes[start..actual_end];
                        let s = String::from_utf8_lossy(slice);
                        if trim_values { s.trim().to_string() } else { s.to_string() }
                    } else {
                        String::new()
                    };
                    row.push(value);
                }

                if !row.iter().all(|s| s.is_empty()) {
                    Some(row)
                } else {
                    None
                }
            })
            .collect();

        // Update skipped count
        let lines_in_chunk = lines.len();
        if self.lines_skipped_count < self.skip_lines {
            self.lines_skipped_count = (self.lines_skipped_count + lines_in_chunk).min(self.skip_lines);
        }

        Ok(rows)
    }
}

impl Default for TextStreamer {
    fn default() -> Self {
        Self::new()
    }
}

// ========== UTILITY FUNCTIONS ==========

/// Parses an entire text file at once (non-streaming).
/// Useful for small files where streaming isn't necessary.
#[wasm_bindgen(js_name = parseTextFile)]
pub fn parse_text_file(
    data: &[u8],
    delimiter: u8,
    skip_lines: usize,
    comment_char: Option<u8>,
) -> Result<JsValue, JsValue> {
    let mut streamer = TextStreamer::new();
    streamer.delimiter = delimiter;
    streamer.skip_lines = skip_lines;
    streamer.comment_char = comment_char;

    let rows = streamer.parse_delimited(data).map_err(JsValue::from)?;
    Ok(serde_wasm_bindgen::to_value(&rows)?)
}

/// Parses text data and attempts to convert values to f64.
/// Returns NaN for non-numeric values.
#[wasm_bindgen(js_name = parseNumericData)]
pub fn parse_numeric_data(
    data: &[u8],
    delimiter: u8,
    skip_lines: usize,
) -> Result<Vec<f64>, JsValue> {
    let mut streamer = TextStreamer::new();
    streamer.delimiter = delimiter;
    streamer.skip_lines = skip_lines;

    let rows = streamer.parse_delimited(data).map_err(JsValue::from)?;
    
    let mut values = Vec::new();
    for row in rows {
        for val in row {
            let num = val.parse::<f64>().unwrap_or(f64::NAN);
            values.push(num);
        }
    }

    Ok(values)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_csv_parsing() {
        let data = b"a,b,c\n1,2,3\n4,5,6";
        let mut streamer = TextStreamer::new();
        let rows = streamer.parse_delimited(data).unwrap();
        assert_eq!(rows.len(), 3);
        assert_eq!(rows[1], vec!["1", "2", "3"]);
    }

    #[test]
    fn test_skip_lines() {
        let data = b"header1\nheader2\n1,2,3\n4,5,6";
        let mut streamer = TextStreamer::new();
        streamer.skip_lines = 2;
        let rows = streamer.parse_delimited(data).unwrap();
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0], vec!["1", "2", "3"]);
    }

    #[test]
    fn test_tab_delimiter() {
        let data = b"a\tb\tc\n1\t2\t3";
        let mut streamer = TextStreamer::new();
        streamer.delimiter = b'\t';
        let rows = streamer.parse_delimited(data).unwrap();
        assert_eq!(rows[0], vec!["a", "b", "c"]);
    }

    #[test]
    fn test_fixed_width() {
        let data = b"AAABBBCCC\n111222333";
        let mut streamer = TextStreamer::new();
        streamer.fixed_width_columns = Some(vec![(0, 3), (3, 6), (6, 9)]);
        let rows = streamer.parse_fixed_width(data).unwrap();
        assert_eq!(rows[0], vec!["AAA", "BBB", "CCC"]);
        assert_eq!(rows[1], vec!["111", "222", "333"]);
    }
}
