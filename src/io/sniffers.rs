//! # Format Sniffers
//!
//! Auto-detection of file formats based on content analysis.
//! Analyzes file headers, magic bytes, and content patterns.

use wasm_bindgen::prelude::*;
use serde::Serialize;


/// Detected file format information
#[derive(Serialize, Clone)]
#[wasm_bindgen]
pub struct FormatHint {
    /// Detected format type
    format: String,
    /// Recommended delimiter (ASCII code), 0 if not applicable
    delimiter: u8,
    /// Confidence level (0.0 - 1.0)
    confidence: f32,
    /// Suggested number of header lines to skip
    skip_lines: usize,
    /// Whether the file appears to be binary
    is_binary: bool,
    /// Detected comment character (0 if none)
    comment_char: u8,
}

#[wasm_bindgen]
impl FormatHint {
    #[wasm_bindgen(getter)]
    pub fn format(&self) -> String {
        self.format.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn delimiter(&self) -> u8 {
        self.delimiter
    }

    #[wasm_bindgen(getter)]
    pub fn confidence(&self) -> f32 {
        self.confidence
    }

    #[wasm_bindgen(getter, js_name = skipLines)]
    pub fn skip_lines(&self) -> usize {
        self.skip_lines
    }

    #[wasm_bindgen(getter, js_name = isBinary)]
    pub fn is_binary(&self) -> bool {
        self.is_binary
    }

    #[wasm_bindgen(getter, js_name = commentChar)]
    pub fn comment_char(&self) -> u8 {
        self.comment_char
    }
}

/// Magic bytes for common file formats
const XLSX_MAGIC: &[u8] = &[0x50, 0x4B, 0x03, 0x04]; // PK.. (ZIP)
const XLS_MAGIC: &[u8] = &[0xD0, 0xCF, 0x11, 0xE0];  // OLE Compound
const HDF5_MAGIC: &[u8] = &[0x89, 0x48, 0x44, 0x46]; // .HDF
const PDF_MAGIC: &[u8] = &[0x25, 0x50, 0x44, 0x46];  // %PDF
const PARQUET_MAGIC: &[u8] = b"PAR1";
const NETCDF_MAGIC: &[u8] = b"CDF\x01";
const ARROW_MAGIC: &[u8] = b"ARROW1";
const MAT_MAGIC: &[u8] = b"MATLAB 5.0";

/// Common delimiters to check
const DELIMITERS: &[(u8, &str)] = &[
    (b',', "comma"),
    (b'\t', "tab"),
    (b';', "semicolon"),
    (b' ', "space"),
    (b'|', "pipe"),
];

/// Common comment characters
const COMMENT_CHARS: &[u8] = &[b'#', b'%', b';', b'!'];

/// Analyzes the first bytes of a file to detect its format.
///
/// # Arguments
/// * `header_bytes` - First 1024-4096 bytes of the file
///
/// # Returns
/// A `FormatHint` struct with detected format information
#[wasm_bindgen(js_name = sniffFormat)]
pub fn sniff_format(header_bytes: &[u8]) -> FormatHint {
    // Check for binary formats first (magic bytes)
    if let Some(hint) = check_binary_format(header_bytes) {
        return hint;
    }

    // Check if content appears to be text
    if !is_likely_text(header_bytes) {
        return FormatHint {
            format: "unknown_binary".to_string(),
            delimiter: 0,
            confidence: 0.5,
            skip_lines: 0,
            is_binary: true,
            comment_char: 0,
        };
    }

    // Analyze text content
    analyze_text_format(header_bytes)
}

/// Detects the most likely delimiter in a text file.
/// Detects the most likely delimiter in a text file.
#[wasm_bindgen(js_name = detectDelimiter)]
pub fn detect_delimiter(sample_bytes: &[u8]) -> u8 {
    let mut best_delimiter = b',';
    let mut best_score = 0;

    for &(delim, _) in DELIMITERS {
        let score = score_delimiter_bytes(sample_bytes, delim);
        if score > best_score {
            best_score = score;
            best_delimiter = delim;
        }
    }

    best_delimiter
}

/// Counts the number of header/metadata lines before actual data.
#[wasm_bindgen(js_name = detectHeaderLines)]
pub fn detect_header_lines(sample_bytes: &[u8]) -> usize {
    if sample_bytes.is_empty() {
        return 0;
    }

    let delimiter = detect_delimiter(sample_bytes);
    
    // Iterate lines as bytes
    let mut skip_count = 0;
    let mut consistent_cols = 0;
    
    for (i, line) in memchr::memchr_iter(b'\n', sample_bytes)
        .chain(std::iter::once(sample_bytes.len()))
        .scan(0, |start, end| {
            let slice = &sample_bytes[*start..end];
            *start = end + 1;
            Some(slice)
        })
        .enumerate() 
    {
        // Trim whitespace
        let mut trimmed = line;
        while let Some((first, rest)) = trimmed.split_first() {
            if first.is_ascii_whitespace() { trimmed = rest; } else { break; }
        }
        
        if trimmed.is_empty() {
            skip_count = i + 1;
            continue;
        }
        
        let first_char = trimmed[0];
        if COMMENT_CHARS.contains(&first_char) {
            skip_count = i + 1;
            continue;
        }
        
        // Count columns
        let cols = trimmed.split(|&b| b == delimiter).count();
        
        if consistent_cols == 0 {
            consistent_cols = cols;
        } else if cols != consistent_cols {
            skip_count = i;
            consistent_cols = cols;
        }
        
        if i > skip_count + 3 {
            break;
        }
    }

    skip_count
}

fn analyze_text_format(bytes: &[u8]) -> FormatHint {
    // Detect delimiter
    let mut best_delim = b',';
    let mut best_score = 0;
    
    for &(delim, _) in DELIMITERS {
        let score = score_delimiter_bytes(bytes, delim);
        if score > best_score {
            best_score = score;
            best_delim = delim;
        }
    }

    // Detect comment character
    let comment_char = detect_comment_char_bytes(bytes);
    
    // Detect header lines
    let skip_lines = detect_header_lines(bytes);
    
    // Determine format name
    let format = match best_delim {
        b',' => "csv",
        b'\t' => "tsv",
        b';' => "csv_semicolon",
        b' ' => "space_separated",
        b'|' => "pipe_separated",
        _ => "delimited",
    };

    // Calculate confidence based on consistency
    let confidence = calculate_confidence_bytes(bytes, best_delim);

    FormatHint {
        format: format.to_string(),
        delimiter: best_delim,
        confidence,
        skip_lines,
        is_binary: false,
        comment_char,
    }
}

fn score_delimiter_bytes(bytes: &[u8], delim: u8) -> usize {
    // Take first 50 lines sequentially - thread overhead is too high for this small task
    let mut line_count = 0;
    let mut col_counts = Vec::with_capacity(50);
    
    let mut start = 0;
    for end in memchr::memchr_iter(b'\n', bytes) {
        if line_count >= 50 { break; }
        let line = &bytes[start..end];
        if !line.iter().all(|b| b.is_ascii_whitespace()) {
             let cols = line.split(|&b| b == delim).count();
             col_counts.push(cols);
             line_count += 1;
        }
        start = end + 1;
    }
    
    if col_counts.is_empty() { return 0; }

    let first_count = col_counts[0];
    if first_count <= 1 {
        return 0;
    }

    let consistent = col_counts.iter().filter(|&&c| c == first_count).count();
    let consistency_score = (consistent * 100) / col_counts.len();
    
    let col_bonus = if first_count >= 2 && first_count <= 20 { 50 } else { 0 };

    consistency_score + col_bonus + first_count
}

fn detect_comment_char_bytes(bytes: &[u8]) -> u8 {
    for &ch in COMMENT_CHARS {
        let mut count = 0;
        let mut start = 0;
        for end in memchr::memchr_iter(b'\n', bytes).take(100) {
             let line = &bytes[start..end];
             // Trim start
             let mut trimmed = line;
             while let Some((c, rest)) = trimmed.split_first() {
                 if c.is_ascii_whitespace() { trimmed = rest; } else { break; }
             }
             if trimmed.first() == Some(&ch) {
                 count += 1;
             }
             start = end + 1;
        }
        
        if count > 0 {
            return ch;
        }
    }
    0
}

fn calculate_confidence_bytes(bytes: &[u8], delimiter: u8) -> f32 {
    let mut lines = Vec::new();
    let mut start = 0;
    for end in memchr::memchr_iter(b'\n', bytes).take(20) {
        let line = &bytes[start..end];
        if !line.iter().all(|b| b.is_ascii_whitespace()) {
             lines.push(line);
        }
        start = end + 1;
    }

    if lines.is_empty() {
        return 0.0;
    }

    let col_counts: Vec<usize> = lines
        .iter()
        .map(|&l| l.split(|&b| b == delimiter).count())
        .collect();

    let first = col_counts[0];
    let consistent = col_counts.iter().filter(|&&c| c == first).count();
    
    (consistent as f32) / (col_counts.len() as f32)
}

fn check_binary_format(bytes: &[u8]) -> Option<FormatHint> {
    if bytes.len() < 4 {
        return None;
    }

    let magic = &bytes[0..4];

    if magic == XLSX_MAGIC {
        return Some(FormatHint {
            format: "xlsx".to_string(),
            delimiter: 0,
            confidence: 0.99,
            skip_lines: 0,
            is_binary: true,
            comment_char: 0,
        });
    }

    if magic == XLS_MAGIC {
        return Some(FormatHint {
            format: "xls".to_string(),
            delimiter: 0,
            confidence: 0.99,
            skip_lines: 0,
            is_binary: true,
            comment_char: 0,
        });
    }

    if magic == HDF5_MAGIC {
        return Some(FormatHint {
            format: "hdf5".to_string(),
            delimiter: 0,
            confidence: 0.99,
            skip_lines: 0,
            is_binary: true,
            comment_char: 0,
        });
    }

    if magic == PDF_MAGIC {
        return Some(FormatHint {
            format: "pdf".to_string(),
            delimiter: 0,
            confidence: 0.99,
            skip_lines: 0,
            is_binary: true,
            comment_char: 0,
        });
    }

    if bytes.starts_with(ARROW_MAGIC) {
        return Some(FormatHint {
            format: "arrow".to_string(),
            delimiter: 0,
            confidence: 0.99,
            skip_lines: 0,
            is_binary: true,
            comment_char: 0,
        });
    }

    if bytes.starts_with(PARQUET_MAGIC) {
        return Some(FormatHint {
            format: "parquet".to_string(),
            delimiter: 0,
            confidence: 0.99,
            skip_lines: 0,
            is_binary: true,
            comment_char: 0,
        });
    }

    if bytes.starts_with(NETCDF_MAGIC) {
        return Some(FormatHint {
            format: "netcdf".to_string(),
            delimiter: 0,
            confidence: 0.99,
            skip_lines: 0,
            is_binary: true,
            comment_char: 0,
        });
    }

    if bytes.starts_with(MAT_MAGIC) {
        return Some(FormatHint {
            format: "matlab".to_string(),
            delimiter: 0,
            confidence: 0.99,
            skip_lines: 0,
            is_binary: true,
            comment_char: 0,
        });
    }

    None
}

fn is_likely_text(bytes: &[u8]) -> bool {
    if bytes.is_empty() {
        return false;
    }

    // Check for high proportion of printable ASCII
    let printable_count = bytes
        .iter()
        .filter(|&&b| (b >= 0x20 && b < 0x7F) || b == b'\n' || b == b'\r' || b == b'\t')
        .count();

    let ratio = printable_count as f32 / bytes.len() as f32;
    ratio > 0.85
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_csv_detection() {
        let data = b"a,b,c\n1,2,3\n4,5,6";
        let hint = sniff_format(data);
        assert_eq!(hint.format, "csv");
        assert_eq!(hint.delimiter, b',');
    }

    #[test]
    fn test_tsv_detection() {
        let data = b"a\tb\tc\n1\t2\t3\n4\t5\t6";
        let hint = sniff_format(data);
        assert_eq!(hint.format, "tsv");
        assert_eq!(hint.delimiter, b'\t');
    }

    #[test]
    fn test_xlsx_detection() {
        let data = &[0x50, 0x4B, 0x03, 0x04, 0x00, 0x00];
        let hint = sniff_format(data);
        assert_eq!(hint.format, "xlsx");
        assert!(hint.is_binary);
    }

    #[test]
    fn test_comment_detection() {
        let data = b"# Header comment\n# Another comment\na,b,c\n1,2,3";
        let hint = sniff_format(data);
        assert_eq!(hint.comment_char, b'#');
    }
}
