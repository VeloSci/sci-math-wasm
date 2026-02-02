//! # Binary File Handlers
//!
//! Parsers for binary scientific data formats like Excel (.xlsx, .xls).
//! Future support planned for HDF5.

use wasm_bindgen::prelude::*;
use calamine::{Reader, Xlsx, Xls, Data};
use serde::Serialize;
use std::io::Cursor;
use js_sys::Float64Array;
use rayon::prelude::*;

/// Represents an Excel cell value in a format suitable for JavaScript
#[derive(Serialize)]
#[serde(tag = "type", content = "value")]
pub enum CellValue {
    Empty,
    String(String),
    Number(f64),
    Bool(bool),
    Error(String),
}

impl From<&Data> for CellValue {
    fn from(data: &Data) -> Self {
        match data {
            Data::Empty => CellValue::Empty,
            Data::String(s) => CellValue::String(s.clone()),
            Data::Float(f) => CellValue::Number(*f),
            Data::Int(i) => CellValue::Number(*i as f64),
            Data::Bool(b) => CellValue::Bool(*b),
            Data::Error(e) => CellValue::Error(format!("{:?}", e)),
            Data::DateTime(dt) => CellValue::Number(dt.as_f64()), // Excel datetime as serial number
            Data::DateTimeIso(s) => CellValue::String(s.clone()),
            Data::DurationIso(s) => CellValue::String(s.clone()),
        }
    }
}

/// Information about an Excel workbook
#[derive(Serialize)]
pub struct WorkbookInfo {
    pub sheet_names: Vec<String>,
    pub sheet_count: usize,
}

/// Reads an Excel file (.xlsx) and returns all data from the first sheet.
///
/// # Arguments
/// * `file_bytes` - The complete file contents as a byte array
///
/// # Returns
/// A 2D array of string values representing the spreadsheet data
#[wasm_bindgen(js_name = readExcelFile)]
pub fn read_excel_file(file_bytes: &[u8]) -> Result<JsValue, JsValue> {
    // Try XLSX format first, then XLS
    let result = read_xlsx(file_bytes).or_else(|_| read_xls(file_bytes));
    
    match result {
        Ok(rows) => Ok(serde_wasm_bindgen::to_value(&rows)?),
        Err(e) => Err(JsValue::from_str(&e)),
    }
}

/// Reads an Excel file and returns data from a specific sheet by index.
#[wasm_bindgen(js_name = readExcelSheet)]
pub fn read_excel_sheet(file_bytes: &[u8], sheet_index: usize) -> Result<JsValue, JsValue> {
    let result = read_xlsx_sheet(file_bytes, sheet_index)
        .or_else(|_| read_xls_sheet(file_bytes, sheet_index));
    
    match result {
        Ok(rows) => Ok(serde_wasm_bindgen::to_value(&rows)?),
        Err(e) => Err(JsValue::from_str(&e)),
    }
}

/// Reads an Excel file and returns data from a specific sheet by name.
#[wasm_bindgen(js_name = readExcelSheetByName)]
pub fn read_excel_sheet_by_name(file_bytes: &[u8], sheet_name: &str) -> Result<JsValue, JsValue> {
    let result = read_xlsx_sheet_by_name(file_bytes, sheet_name)
        .or_else(|_| read_xls_sheet_by_name(file_bytes, sheet_name));
    
    match result {
        Ok(rows) => Ok(serde_wasm_bindgen::to_value(&rows)?),
        Err(e) => Err(JsValue::from_str(&e)),
    }
}

/// Gets information about an Excel workbook (sheet names, count).
#[wasm_bindgen(js_name = getExcelInfo)]
pub fn get_excel_info(file_bytes: &[u8]) -> Result<JsValue, JsValue> {
    let info = get_xlsx_info(file_bytes).or_else(|_| get_xls_info(file_bytes));
    
    match info {
        Ok(info) => Ok(serde_wasm_bindgen::to_value(&info)?),
        Err(e) => Err(JsValue::from_str(&e)),
    }
}

/// High-performance Excel numeric extraction.
/// Returns a flat Float64Array for brute-force processing.
#[wasm_bindgen(js_name = readExcelNumericFast)]
pub fn read_excel_numeric_fast(
    file_bytes: &[u8],
    sheet_index: usize,
    skip_rows: usize,
) -> Result<Float64Array, JsValue> {
    let mut workbook: Xlsx<_> = Xlsx::new(Cursor::new(file_bytes))
        .map_err(|e| format!("Error opening Excel: {}", e))?;

    let range = workbook
        .worksheet_range_at(sheet_index)
        .ok_or_else(|| format!("Sheet index {} not found", sheet_index))?
        .map_err(|e| e.to_string())?;

    let rows: Vec<_> = range.rows().skip(skip_rows).collect();
    
    // Process in parallel
    let values: Vec<f64> = rows.par_iter()
        .flat_map(|row| {
            row.iter().map(|cell| {
                match cell {
                    Data::Float(f) => *f,
                    Data::Int(i) => *i as f64,
                    Data::String(s) => fast_float::parse(s.trim()).unwrap_or(f64::NAN),
                    _ => f64::NAN,
                }
            }).collect::<Vec<f64>>()
        })
        .collect();

    let array = Float64Array::new(&JsValue::from(values.len() as u32));
    array.copy_from(&values);
    Ok(array)
}

// ========== INTERNAL XLSX FUNCTIONS ==========

fn read_xlsx(file_bytes: &[u8]) -> Result<Vec<Vec<String>>, String> {
    read_xlsx_sheet(file_bytes, 0)
}

fn read_xlsx_sheet(file_bytes: &[u8], sheet_index: usize) -> Result<Vec<Vec<String>>, String> {
    let mut workbook: Xlsx<_> = Xlsx::new(Cursor::new(file_bytes))
        .map_err(|e| format!("Error opening Excel file: {}", e))?;

    let range = workbook
        .worksheet_range_at(sheet_index)
        .ok_or_else(|| format!("Sheet index {} not found", sheet_index))?
        .map_err(|e| e.to_string())?;

    Ok(extract_rows(&range))
}

fn read_xlsx_sheet_by_name(file_bytes: &[u8], sheet_name: &str) -> Result<Vec<Vec<String>>, String> {
    let mut workbook: Xlsx<_> = Xlsx::new(Cursor::new(file_bytes))
        .map_err(|e| format!("Error opening Excel file: {}", e))?;

    let range = workbook
        .worksheet_range(sheet_name)
        .map_err(|e| e.to_string())?;

    Ok(extract_rows(&range))
}

fn get_xlsx_info(file_bytes: &[u8]) -> Result<WorkbookInfo, String> {
    let workbook: Xlsx<_> = Xlsx::new(Cursor::new(file_bytes))
        .map_err(|e| format!("Error opening Excel file: {}", e))?;

    let sheet_names: Vec<String> = workbook.sheet_names().to_vec();
    let sheet_count = sheet_names.len();

    Ok(WorkbookInfo {
        sheet_names,
        sheet_count,
    })
}

// ========== INTERNAL XLS FUNCTIONS ==========

fn read_xls(file_bytes: &[u8]) -> Result<Vec<Vec<String>>, String> {
    read_xls_sheet(file_bytes, 0)
}

fn read_xls_sheet(file_bytes: &[u8], sheet_index: usize) -> Result<Vec<Vec<String>>, String> {
    let mut workbook: Xls<_> = Xls::new(Cursor::new(file_bytes))
        .map_err(|e| format!("Error opening XLS file: {}", e))?;

    let range = workbook
        .worksheet_range_at(sheet_index)
        .ok_or_else(|| format!("Sheet index {} not found", sheet_index))?
        .map_err(|e| e.to_string())?;

    Ok(extract_rows(&range))
}

fn read_xls_sheet_by_name(file_bytes: &[u8], sheet_name: &str) -> Result<Vec<Vec<String>>, String> {
    let mut workbook: Xls<_> = Xls::new(Cursor::new(file_bytes))
        .map_err(|e| format!("Error opening XLS file: {}", e))?;

    let range = workbook
        .worksheet_range(sheet_name)
        .map_err(|e| e.to_string())?;

    Ok(extract_rows(&range))
}

fn get_xls_info(file_bytes: &[u8]) -> Result<WorkbookInfo, String> {
    let workbook: Xls<_> = Xls::new(Cursor::new(file_bytes))
        .map_err(|e| format!("Error opening XLS file: {}", e))?;

    let sheet_names: Vec<String> = workbook.sheet_names().to_vec();
    let sheet_count = sheet_names.len();

    Ok(WorkbookInfo {
        sheet_names,
        sheet_count,
    })
}

// ========== HELPER FUNCTIONS ==========

fn extract_rows(range: &calamine::Range<Data>) -> Vec<Vec<String>> {
    range
        .rows()
        .map(|row| {
            row.iter()
                .map(|cell| cell_to_string(cell))
                .collect()
        })
        .collect()
}

fn cell_to_string(cell: &Data) -> String {
    match cell {
        Data::Empty => String::new(),
        Data::String(s) => s.clone(),
        Data::Float(f) => {
            // Format floats nicely (avoid unnecessary decimals)
            if f.fract() == 0.0 {
                format!("{:.0}", f)
            } else {
                format!("{}", f)
            }
        }
        Data::Int(i) => i.to_string(),
        Data::Bool(b) => b.to_string(),
        Data::Error(e) => format!("#ERROR:{:?}", e),
        Data::DateTime(dt) => format!("{}", dt), // Could convert to ISO string
        Data::DateTimeIso(s) => s.clone(),
        Data::DurationIso(s) => s.clone(),
    }
}

/// Extracts typed cell values with type information preserved.
/// Use this when you need to differentiate between strings and numbers.
#[wasm_bindgen(js_name = readExcelTyped)]
pub fn read_excel_typed(file_bytes: &[u8]) -> Result<JsValue, JsValue> {
    let mut workbook: Xlsx<_> = Xlsx::new(Cursor::new(file_bytes))
        .map_err(|e| format!("Error opening Excel file: {}", e))?;

    let range = workbook
        .worksheet_range_at(0)
        .ok_or("No worksheet found")?
        .map_err(|e| e.to_string())?;

    let rows: Vec<Vec<CellValue>> = range
        .rows()
        .map(|row| row.iter().map(CellValue::from).collect())
        .collect();

    Ok(serde_wasm_bindgen::to_value(&rows)?)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cell_to_string() {
        assert_eq!(cell_to_string(&Data::Empty), "");
        assert_eq!(cell_to_string(&Data::String("test".to_string())), "test");
        assert_eq!(cell_to_string(&Data::Float(3.14)), "3.14");
        assert_eq!(cell_to_string(&Data::Float(42.0)), "42");
        assert_eq!(cell_to_string(&Data::Int(123)), "123");
        assert_eq!(cell_to_string(&Data::Bool(true)), "true");
    }
}
