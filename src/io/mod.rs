//! # IO Module - Universal File Parser for Scientific Data
//!
//! This module provides streaming parsers for various scientific data formats.
//! It supports text-based formats (CSV, TSV, DAT, MPT) and binary formats (Excel).
//!
//! ## Architecture
//! - `text.rs`: Universal text streamer with configurable delimiters
//! - `binary.rs`: Binary file handlers (Excel, future HDF5)
//! - `sniffers.rs`: Auto-detection of file formats
//!
//! ## Usage
//! ```typescript
//! import { TextStreamer, read_excel_file, sniff_format } from 'sci-math-wasm';
//!
//! // For CSV/TSV/DAT files
//! const streamer = new TextStreamer()
//!     .set_delimiter(44)  // comma
//!     .set_skip_lines(10);
//!
//! // For Excel files
//! const data = read_excel_file(fileBytes);
//! ```

pub mod text;
pub mod binary;
pub mod sniffers;
pub mod fast_numeric;  // Ultra-fast zero-copy numeric parser

// Re-export main types for convenience
pub use text::TextStreamer;
pub use binary::read_excel_file;
pub use sniffers::{sniff_format, FormatHint};
pub use fast_numeric::{parse_numeric_csv_fast, parse_fixed_width_fast, alloc_parse_buffer, parse_buffer_in_place, get_result_ptr, get_result_len};
