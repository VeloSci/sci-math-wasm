//! # Format Sniffers
//!
//! Auto-detection of file formats based on content analysis.
//! Analyzes file headers, magic bytes, and content patterns.

use wasm_bindgen::prelude::*;
use serde::Serialize;
use rayon::prelude::*;

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
#[wasm_bindgen(js_name = detectDelimiter)]
pub fn detect_delimiter(sample_bytes: &[u8]) -> u8 {
    let text = String::from_utf8_lossy(sample_bytes);
    
    let mut best_delimiter = b',';
    let mut best_score = 0;

    for &(delim, _) in DELIMITERS {
        let score = score_delimiter(&text, delim);
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
    let text = String::from_utf8_lossy(sample_bytes);
    let lines: Vec<&str> = text.lines().collect();
    
    if lines.is_empty() {
        return 0;
    }

    // Detect the most likely delimiter first
    let delimiter = detect_delimiter(sample_bytes) as char;
    
    // Find where consistent column count starts
    let mut skip_count = 0;
    let mut consistent_cols = 0;
    
    for (i, line) in lines.iter().enumerate() {
        // Skip comment lines
        if line.trim().is_empty() {
            skip_count = i + 1;
            continue;
        }
        
        let first_char = line.trim().chars().next().unwrap_or(' ');
        if COMMENT_CHARS.contains(&(first_char as u8)) {
            skip_count = i + 1;
            continue;
        }
        
        // Count columns
        let cols = line.split(delimiter).count();
        
        if consistent_cols == 0 {
            consistent_cols = cols;
        } else if cols != consistent_cols {
            // Column count changed, this might be a header boundary
            skip_count = i;
            consistent_cols = cols;
        }
        
        // If we've seen 3+ consistent lines, we're probably in the data
        if i > skip_count + 3 {
            break;
        }
    }

    skip_count
}

/// Checks if a file is likely a scientific data format (.mpt, .dat, etc.)
#[wasm_bindgen(js_name = isScientificFormat)]
pub fn is_scientific_format(filename: &str, header_bytes: &[u8]) -> bool {
    let ext = filename.split('.').last().unwrap_or("").to_lowercase();
    
    // Check extension
    let scientific_extensions = ["mpt", "dat", "dta", "spe", "csv", "tsv", "txt", "asc"];
    if scientific_extensions.contains(&ext.as_str()) {
        return true;
    }
    
    // Check content patterns
    let text = String::from_utf8_lossy(header_bytes);
    
    // Common scientific file markers
    let markers = [
        "EC-Lab",       // BioLogic potentiostat
        "Gamry",        // Gamry potentiostat
        "CHI",          // CH Instruments
        "NOVA",         // Metrohm Autolab
        "Potential",    // Common header
        "Current",      // Common header
        "Time",         // Common header
        "Wavelength",   // Spectrometer
        "Absorbance",   // Spectrometer
        "Intensity",    // General scientific
    ];
    
    markers.iter().any(|&m| text.contains(m))
}

// ========== INTERNAL FUNCTIONS ==========

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

fn analyze_text_format(bytes: &[u8]) -> FormatHint {
    let text = String::from_utf8_lossy(bytes);
    
    // Detect delimiter
    let mut best_delim = b',';
    let mut best_score = 0;
    
    for &(delim, _) in DELIMITERS {
        let score = score_delimiter(&text, delim);
        if score > best_score {
            best_score = score;
            best_delim = delim;
        }
    }

    // Detect comment character
    let comment_char = detect_comment_char(&text);
    
    // Detect header lines
    let skip_lines = count_header_lines(&text, best_delim as char, comment_char);
    
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
    let confidence = calculate_confidence(&text, best_delim);

    FormatHint {
        format: format.to_string(),
        delimiter: best_delim,
        confidence,
        skip_lines,
        is_binary: false,
        comment_char,
    }
}

fn score_delimiter(text: &str, delim: u8) -> usize {
    let delim_char = delim as char;
    let lines: Vec<&str> = text.lines().take(50).collect(); // Increase sample size for better detection
    
    if lines.is_empty() {
        return 0;
    }

    // Count columns per line in parallel
    let col_counts: Vec<usize> = lines
        .par_iter()
        .filter(|l| !l.trim().is_empty())
        .map(|l| l.split(delim_char).count())
        .collect();

    if col_counts.is_empty() {
        return 0;
    }

    // Score based on:
    // 1. Consistent column count
    // 2. More than 1 column
    // 3. Reasonable number of columns
    
    let first_count = col_counts[0];
    if first_count <= 1 {
        return 0;
    }

    let consistent = col_counts.iter().filter(|&&c| c == first_count).count();
    let consistency_score = (consistent * 100) / col_counts.len();
    
    // Bonus for reasonable column count (2-20)
    let col_bonus = if first_count >= 2 && first_count <= 20 { 50 } else { 0 };

    consistency_score + col_bonus + first_count
}

fn detect_comment_char(text: &str) -> u8 {
    for &ch in COMMENT_CHARS {
        let char_ch = ch as char;
        let comment_lines = text
            .lines()
            .filter(|l| l.trim().starts_with(char_ch))
            .count();
        
        if comment_lines > 0 {
            return ch;
        }
    }
    0
}

fn count_header_lines(text: &str, delimiter: char, comment_char: u8) -> usize {
    let lines: Vec<&str> = text.lines().collect();
    let comment_ch = if comment_char > 0 { Some(comment_char as char) } else { None };
    
    let mut skip = 0;
    let mut data_col_count = 0;
    
    for (i, line) in lines.iter().enumerate() {
        let trimmed = line.trim();
        
        // Skip empty lines
        if trimmed.is_empty() {
            skip = i + 1;
            continue;
        }
        
        // Skip comment lines
        if let Some(cc) = comment_ch {
            if trimmed.starts_with(cc) {
                skip = i + 1;
                continue;
            }
        }
        
        let cols = line.split(delimiter).count();
        
        // First non-comment, non-empty line sets expected columns
        if data_col_count == 0 {
            data_col_count = cols;
            // Check if this looks like a header (non-numeric first field)
            let first_field = line.split(delimiter).next().unwrap_or("").trim();
            if !first_field.parse::<f64>().is_ok() && !first_field.is_empty() {
                // Might be a header, check next lines
                continue;
            }
        }
        
        // If column count is consistent, we're in data
        if cols == data_col_count && i > skip {
            break;
        }
    }

    skip
}

fn calculate_confidence(text: &str, delimiter: u8) -> f32 {
    let delim_char = delimiter as char;
    let lines: Vec<&str> = text
        .lines()
        .filter(|l| !l.trim().is_empty())
        .take(20)
        .collect();

    if lines.is_empty() {
        return 0.0;
    }

    let col_counts: Vec<usize> = lines
        .iter()
        .map(|l| l.split(delim_char).count())
        .collect();

    let first = col_counts[0];
    let consistent = col_counts.iter().filter(|&&c| c == first).count();
    
    (consistent as f32) / (col_counts.len() as f32)
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
