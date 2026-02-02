# IO Module - File Processing

The IO module provides high-performance file parsing capabilities for scientific data formats, supporting both streaming text formats (CSV, TSV, DAT, MPT) and binary formats (Excel).

## Table of Contents

- [Overview](#overview)
- [Text Streaming](#text-streaming)
- [Binary Files](#binary-files)
- [Format Detection](#format-detection)
- [API Reference](#api-reference)

## Overview

The IO module is designed to handle the complexities of scientific data files:

- **Streaming Processing**: Handle large files without loading everything into memory
- **Flexible Parsing**: Configure delimiters, headers, comments dynamically
- **Multiple Formats**: CSV, TSV, DAT, MPT, XLSX, XLS
- **Auto-Detection**: Smart format guessing based on content analysis

## Text Streaming

### TextStreamer Class

The `TextStreamer` provides a fluent API for configuring and processing text-based scientific files.

#### Constructor

```typescript
const streamer = new TextStreamer();
```

#### Configuration Methods

##### `setDelimiter(charCode: number)`
Sets the field delimiter character using ASCII codes:
- `44` - Comma (CSV)
- `9` - Tab (TSV)
- `32` - Space
- `59` - Semicolon
- `124` - Pipe

##### `setSkipLines(count: number)`
Skips the specified number of initial lines (for headers/metadata).

##### `setCommentChar(charCode: number)`
Sets the comment character. Lines starting with this character are ignored:
- `35` - Hash (#)
- `59` - Semicolon (;)
- `37` - Percent (%)

##### `setHasHeader(hasHeader: boolean)`
Enables/disables header row handling.

##### `setTrimValues(trim: boolean)`
Enables/disables whitespace trimming from values.

##### `setFixedWidthColumns(columns: number[])`
Configures fixed-width column parsing. Pass an array of `[start, end]` pairs.

#### Processing Methods

##### `processChunk(chunk: Uint8Array): any[][]`
Processes a chunk of file data and returns parsed rows. Stores remainder for next chunk.

##### `finalize(): any[][]`
Processes any remaining buffered data after all chunks are received.

##### `getRowCount(): number`
Returns the total number of data rows processed.

##### `reset()`
Resets the streamer state for reuse.

### Example: Potentiostat Data (.mpt)

```typescript
import { TextStreamer } from 'sci-math-wasm';

// Biologic EC-Lab .mpt file typically has:
// - Tab-separated values
// - ~60 lines of instrument metadata
// - Comments starting with #
const streamer = new TextStreamer()
    .setDelimiter(9)        // Tab character
    .setSkipLines(60)       // Skip metadata header
    .setCommentChar(35);    // # comments

// Process file in chunks
const reader = file.stream().getReader();
while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const rows = streamer.processChunk(value);
    // Process rows incrementally
    processRows(rows);
}

// Handle remaining data
const finalRows = streamer.finalize();
processRows(finalRows);

console.log(`Total rows processed: ${streamer.getRowCount()}`);
```

### Example: Fixed-Width Format

```typescript
// Old spectrometer data with fixed-width columns
// Column 1: 0-10 (Wavelength)
// Column 2: 11-20 (Intensity)
// Column 3: 21-30 (Background)
const streamer = new TextStreamer()
    .setFixedWidthColumns([0, 10, 11, 20, 21, 30])
    .setSkipLines(5);  // Skip header lines

const rows = streamer.processChunk(data);
// rows = [['400.0', '1234.5', '12.3'], ['401.0', '1245.6', '12.1'], ...]
```

## Binary Files

### Excel Processing

#### `readExcelFile(fileBytes: Uint8Array): any[][]`
Reads the first sheet of an Excel file.

```typescript
import { readExcelFile } from 'sci-math-wasm';

const arrayBuffer = await file.arrayBuffer();
const data = readExcelFile(new Uint8Array(arrayBuffer));
// data = [['Header1', 'Header2'], ['Value1', 'Value2'], ...]
```

#### `readExcelSheet(fileBytes: Uint8Array, sheetIndex: number): any[][]`
Reads a specific sheet by index (0-based).

#### `readExcelSheetByName(fileBytes: Uint8Array, sheetName: string): any[][]`
Reads a specific sheet by name.

#### `getExcelInfo(fileBytes: Uint8Array): { sheetNames: string[], sheetCount: number }`
Gets workbook information.

```typescript
import { getExcelInfo } from 'sci-math-wasm';

const info = getExcelInfo(fileBytes);
console.log(`Sheets: ${info.sheetNames.join(', ')}`);
console.log(`Count: ${info.sheetCount}`);
```

#### `readExcelNumeric(fileBytes: Uint8Array, sheetIndex: number, skipRows: number): number[]`
Extracts numeric data, converting non-numeric values to NaN.

```typescript
// Extract numeric data from row 2 onwards (skip header)
const numericData = readExcelNumeric(fileBytes, 0, 1);
// numericData = [1.23, 4.56, 7.89, NaN, 10.11, ...]
```

### Example: Multi-Sheet Excel

```typescript
import { getExcelInfo, readExcelSheet } from 'sci-math-wasm';

const fileBytes = new Uint8Array(await file.arrayBuffer());

// Get sheet information
const info = getExcelInfo(fileBytes);
console.log('Available sheets:', info.sheetNames);

// Read specific sheets
const rawData = readExcelSheet(fileBytes, 0);      // First sheet
const processedData = readExcelSheet(fileBytes, 1); // Second sheet

// Or by name
const calibration = readExcelSheetByName(fileBytes, 'Calibration');
```

## Format Detection

### Auto-Detection with Sniffers

The sniffer analyzes file content to guess the format automatically.

#### `sniffFormat(headerBytes: Uint8Array): FormatHint`

```typescript
import { sniffFormat } from 'sci-math-wasm';

// Read first 2KB of file for analysis
const header = new Uint8Array(await file.slice(0, 2048).arrayBuffer());
const hint = sniffFormat(header);

console.log(`Format: ${hint.format}`);        // 'csv', 'tsv', 'xlsx', etc.
console.log(`Delimiter: ${hint.delimiter}`);  // ASCII code
console.log(`Skip lines: ${hint.skipLines}`);
console.log(`Confidence: ${hint.confidence}`);
console.log(`Is binary: ${hint.isBinary}`);
```

#### `detectDelimiter(sampleBytes: Uint8Array): number`
Detects the most likely delimiter character.

#### `detectHeaderLines(sampleBytes: Uint8Array): number`
Counts header/metadata lines before actual data.

#### `isScientificFormat(filename: string, headerBytes: Uint8Array): boolean`
Checks if a file is likely a scientific data format.

### Example: Smart File Processor

```typescript
import { sniffFormat, TextStreamer, readExcelFile } from 'sci-math-wasm';

async function processScientificFile(file) {
    const filename = file.name;
    const header = new Uint8Array(await file.slice(0, 2048).arrayBuffer());
    
    // Auto-detect format
    if (isScientificFormat(filename, header)) {
        const hint = sniffFormat(header);
        
        if (hint.isBinary) {
            // Handle binary formats
            if (hint.format === 'xlsx' || hint.format === 'xls') {
                const arrayBuffer = await file.arrayBuffer();
                return readExcelFile(new Uint8Array(arrayBuffer));
            }
        } else {
            // Handle text formats
            const streamer = new TextStreamer()
                .setDelimiter(hint.delimiter)
                .setSkipLines(hint.skipLines)
                .setCommentChar(hint.commentChar);
            
            // Process in chunks
            const reader = file.stream().getReader();
            const allRows = [];
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const rows = streamer.processChunk(value);
                allRows.push(...rows);
            }
            
            const finalRows = streamer.finalize();
            allRows.push(...finalRows);
            
            return allRows;
        }
    }
    
    throw new Error('Unsupported file format');
}
```

## API Reference

### TextStreamer

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `constructor()` | - | `TextStreamer` | Creates new streamer with default CSV settings |
| `setDelimiter(charCode)` | `number` | `TextStreamer` | Sets field delimiter |
| `setSkipLines(count)` | `number` | `TextStreamer` | Sets lines to skip |
| `setCommentChar(charCode)` | `number` | `TextStreamer` | Sets comment character |
| `setHasHeader(hasHeader)` | `boolean` | `TextStreamer` | Enable/disable header handling |
| `setTrimValues(trim)` | `boolean` | `TextStreamer` | Enable/disable value trimming |
| `setFixedWidthColumns(columns)` | `number[]` | `TextStreamer` | Configure fixed-width parsing |
| `processChunk(chunk)` | `Uint8Array` | `any[][]` | Process data chunk |
| `finalize()` | - | `any[][]` | Process remaining data |
| `getRowCount()` | - | `number` | Get total rows processed |
| `reset()` | - | `void` | Reset streamer state |

### Binary Functions

| Function | Parameters | Return Type | Description |
|----------|------------|-------------|-------------|
| `readExcelFile` | `Uint8Array` | `any[][]` | Read first Excel sheet |
| `readExcelSheet` | `Uint8Array, number` | `any[][]` | Read Excel sheet by index |
| `readExcelSheetByName` | `Uint8Array, string` | `any[][]` | Read Excel sheet by name |
| `getExcelInfo` | `Uint8Array` | `{sheetNames, sheetCount}` | Get workbook info |
| `readExcelNumeric` | `Uint8Array, number, number` | `number[]` | Extract numeric data |
| `readExcelTyped` | `Uint8Array` | `CellValue[][]` | Read with type information |

### Sniffer Functions

| Function | Parameters | Return Type | Description |
|----------|------------|-------------|-------------|
| `sniffFormat` | `Uint8Array` | `FormatHint` | Detect file format |
| `detectDelimiter` | `Uint8Array` | `number` | Detect delimiter |
| `detectHeaderLines` | `Uint8Array` | `number` | Count header lines |
| `isScientificFormat` | `string, Uint8Array` | `boolean` | Check scientific format |

### Types

#### FormatHint
```typescript
interface FormatHint {
    format: string;      // 'csv', 'tsv', 'xlsx', 'unknown_binary', etc.
    delimiter: number;   // ASCII code (0 if not applicable)
    confidence: number;  // 0.0 - 1.0
    skipLines: number;   // Header lines to skip
    isBinary: boolean;   // True for binary formats
    commentChar: number; // Comment character (0 if none)
}
```

#### CellValue
```typescript
type CellValue = 
    | { type: 'Empty' }
    | { type: 'String', value: string }
    | { type: 'Number', value: number }
    | { type: 'Bool', value: boolean }
    | { type: 'Error', value: string };
```

## Performance Characteristics

### Parallel Processing
The IO module is optimized with **Rayon** for multi-threaded execution. When the browser environment supports Web Workers and `SharedArrayBuffer` (Cross-Origin Isolation enabled), tasks such as text parsing and Excel extraction are automatically parallelized.

> **Note**: To enable parallel processing, your server must serve the following headers:
> - `Cross-Origin-Embedder-Policy: require-corp`
> - `Cross-Origin-Opener-Policy: same-origin`

### Text Streaming
- **Memory**: Constant (only buffers incomplete lines)
- **Speed**: ~200-500 MB/s with multi-threading enabled
- **Overhead**: Minimal compared to pure JS parsing

### Excel Processing
- **Memory**: Loads entire file into memory
- **Speed**: ~100-300 MB/s for XLSX files using parallel cell extraction
- **Limitation**: File size constrained by available memory

### Format Detection
- **Speed**: ~2 GB/s (analyzes sample lines in parallel)
- **Accuracy**: >95% for common scientific formats
- **Overhead**: Negligible when processing large files

## See Also

- [File Processing Guide](/guide/file-processing) - Practical examples and workflows
- [Performance Comparison](/examples/performance-comparison) - WASM vs TypeScript benchmarks
- [Interactive Benchmarks](/bench) - Live performance testing
