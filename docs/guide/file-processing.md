# File Processing Guide

This guide covers practical scenarios for processing scientific data files using the IO module, with real-world examples from different instruments and disciplines.

## Table of Contents

- [Getting Started](#getting-started)
- [Electrochemistry Files](#electrochemistry-files)
- [Spectroscopy Data](#spectroscopy-data)
- [Chromatography Files](#chromatography-files)
- [Multi-Format Processing](#multi-format-processing)
- [Web Workers Integration](#web-workers-integration)
- [Error Handling](#error-handling)

## Getting Started

### Basic File Upload

```typescript
import init, { TextStreamer, sniffFormat } from 'sci-math-wasm';

await init();

// Handle file input
document.getElementById('fileInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        await processFile(file);
    } catch (error) {
        console.error('Processing failed:', error);
    }
});

async function processFile(file) {
    // Auto-detect format
    const header = new Uint8Array(await file.slice(0, 2048).arrayBuffer());
    const hint = sniffFormat(header);
    
    console.log(`Detected format: ${hint.format}`);
    console.log(`Confidence: ${(hint.confidence * 100).toFixed(1)}%`);
    
    if (hint.isBinary) {
        // Handle binary files (Excel, etc.)
        await processBinaryFile(file);
    } else {
        // Handle text files
        await processTextFile(file, hint);
    }
}
```

## Electrochemistry Files

### Biologic EC-Lab (.mpt)

Biologic potentiostats generate .mpt files with tab-separated data and extensive metadata headers.

```typescript
async function processMPTFile(file) {
    const streamer = new TextStreamer()
        .setDelimiter(9)        // Tab delimiter
        .setSkipLines(60)       // Typical metadata header
        .setCommentChar(35);    // # comments
    
    const reader = file.stream().getReader();
    const allData = [];
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const rows = streamer.processChunk(value);
        if (rows.length > 0) {
            allData.push(...rows);
        }
    }
    
    // Process final chunk
    const finalRows = streamer.finalize();
    allData.push(...finalRows);
    
    // Convert to numeric arrays
    const numericData = allData.map(row => 
        row.map(val => parseFloat(val) || 0)
    );
    
    // Extract columns (assuming: Ewe/V, I/mA, time/s)
    const voltage = numericData.map(row => row[0]);    // Column 1
    const current = numericData.map(row => row[1]);    // Column 2
    const time = numericData.map(row => row[2]);       // Column 3
    
    return { voltage, current, time, rowCount: allData.length };
}

// Usage
const result = await processMPTFile(mptFile);
console.log(`Processed ${result.rowCount} data points`);
console.log('Voltage range:', Math.min(...result.voltage), 'to', Math.max(...result.voltage));
```

### Gamry (.dta)

Gamry files have different header structures:

```typescript
async function processDTAFile(file) {
    // Gamry .dta files typically have ~40-50 header lines
    const streamer = new TextStreamer()
        .setDelimiter(9)        // Tab separated
        .setSkipLines(45)       // Adjust based on your files
        .setCommentChar(37);    // % comments
    
    // Same processing loop as above
    // ...
}
```

### CH Instruments (.txt)

```typescript
async function processCHFile(file) {
    const streamer = new TextStreamer()
        .setDelimiter(44)       // Comma separated
        .setSkipLines(25)       // Variable header length
        .setCommentChar(35);    // # comments
    
    // Process...
}
```

## Spectroscopy Data

### UV-Vis Spectrophotometry (.csv/.dat)

```typescript
async function processSpectroscopyFile(file) {
    // Auto-detect delimiter
    const header = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
    const delimiter = detectDelimiter(header);
    
    const streamer = new TextStreamer()
        .setDelimiter(delimiter)
        .setSkipLines(5)        // Instrument info header
        .setCommentChar(59);    // ; comments
    
    const data = await processChunks(file, streamer);
    
    // Typical columns: Wavelength (nm), Absorbance, Blank
    const wavelengths = data.map(row => parseFloat(row[0]));
    const absorbance = data.map(row => parseFloat(row[1]));
    const blank = data.map(row => parseFloat(row[2]) || 0);
    
    // Calculate corrected absorbance
    const corrected = absorbance.map((a, i) => a - blank[i]);
    
    return { wavelengths, absorbance: corrected };
}

// Helper function
async function processChunks(file, streamer) {
    const reader = file.stream().getReader();
    const allRows = [];
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        allRows.push(...streamer.processChunk(value));
    }
    
    return [...allRows, ...streamer.finalize()];
}
```

### Mass Spectrometry (Fixed-Width)

Old mass spectrometers often use fixed-width formats:

```typescript
async function processMassSpecFile(file) {
    // Fixed-width columns:
    // 0-10: Mass/Charge ratio
    // 11-25: Intensity
    // 26-40: Resolution
    // 41-50: Timestamp
    const streamer = new TextStreamer()
        .setFixedWidthColumns([0, 10, 11, 25, 26, 40, 41, 50])
        .setSkipLines(10);  // Header info
    
    const data = await processChunks(file, streamer);
    
    const mz = data.map(row => parseFloat(row[0]));
    const intensity = data.map(row => parseFloat(row[1]));
    const resolution = data.map(row => parseFloat(row[2]));
    
    return { mz, intensity, resolution };
}
```

## Chromatography Files

### HPLC Data Processing

```typescript
async function processHPLCFile(file) {
    // Many HPLC systems export CSV with retention time and detector signal
    const streamer = new TextStreamer()
        .setDelimiter(44)       // Comma
        .setSkipLines(10)       // Method info
        .setCommentChar(35);    // # comments
    
    const data = await processChunks(file, streamer);
    
    const retentionTime = data.map(row => parseFloat(row[0]));  // minutes
    const detectorSignal = data.map(row => parseFloat(row[1])); // mAU or V
    
    // Find peaks
    const peaks = findPeaks(detectorSignal, threshold: 10);
    const peakTimes = peaks.map(i => retentionTime[i]);
    
    return {
        retentionTime,
        detectorSignal,
        peaks: peakTimes,
        baseline: calculateBaseline(detectorSignal)
    };
}

function findPeaks(data, threshold) {
    const peaks = [];
    for (let i = 1; i < data.length - 1; i++) {
        if (data[i] > data[i-1] && data[i] > data[i+1] && data[i] > threshold) {
            peaks.push(i);
        }
    }
    return peaks;
}
```

## Multi-Format Processing

### Universal File Processor

Create a smart processor that handles multiple scientific formats automatically:

```typescript
class ScientificFileProcessor {
    constructor() {
        this.processors = {
            'mpt': this.processMPT.bind(this),
            'dta': this.processDTA.bind(this),
            'txt': this.processGenericText.bind(this),
            'csv': this.processGenericText.bind(this),
            'dat': this.processGenericText.bind(this),
            'xlsx': this.processExcel.bind(this),
            'xls': this.processExcel.bind(this)
        };
    }
    
    async process(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        const processor = this.processors[ext];
        
        if (!processor) {
            throw new Error(`Unsupported file format: ${ext}`);
        }
        
        return await processor(file);
    }
    
    async processMPT(file) {
        // Biologic EC-Lab specific processing
        const streamer = new TextStreamer()
            .setDelimiter(9)
            .setSkipLines(60)
            .setCommentChar(35);
        
        const data = await this.processStream(file, streamer);
        return this.extractEChemData(data);
    }
    
    async processDTA(file) {
        // Gamry specific processing
        const streamer = new TextStreamer()
            .setDelimiter(9)
            .setSkipLines(45)
            .setCommentChar(37);
        
        const data = await this.processStream(file, streamer);
        return this.extractEChemData(data);
    }
    
    async processGenericText(file) {
        // Auto-detect for unknown text formats
        const header = new Uint8Array(await file.slice(0, 2048).arrayBuffer());
        const hint = sniffFormat(header);
        
        const streamer = new TextStreamer()
            .setDelimiter(hint.delimiter)
            .setSkipLines(hint.skipLines)
            .setCommentChar(hint.commentChar);
        
        return await this.processStream(file, streamer);
    }
    
    async processExcel(file) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const info = getExcelInfo(bytes);
        
        // Process first sheet
        const data = readExcelSheet(bytes, 0);
        return data;
    }
    
    async processStream(file, streamer) {
        const reader = file.stream().getReader();
        const allRows = [];
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            allRows.push(...streamer.processChunk(value));
        }
        
        return [...allRows, ...streamer.finalize()];
    }
    
    extractEChemData(rows) {
        // Generic extraction assuming columns: Time, Voltage, Current
        const time = rows.map(row => parseFloat(row[0]) || 0);
        const voltage = rows.map(row => parseFloat(row[1]) || 0);
        const current = rows.map(row => parseFloat(row[2]) || 0);
        
        return { time, voltage, current, rowCount: rows.length };
    }
}

// Usage
const processor = new ScientificFileProcessor();

document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    try {
        const result = await processor.process(file);
        console.log('Processed data:', result);
        visualizeData(result);
    } catch (error) {
        console.error('Processing error:', error);
    }
});
```

## Web Workers Integration

For large files, process in a Web Worker to avoid blocking the UI:

```typescript
// worker.js
import init, { TextStreamer } from 'sci-math-wasm';

let streamer;

self.onmessage = async (event) => {
    const { type, data, config } = event.data;
    
    switch (type) {
        case 'init':
            await init();
            streamer = new TextStreamer()
                .setDelimiter(config.delimiter)
                .setSkipLines(config.skipLines)
                .setCommentChar(config.commentChar);
            break;
            
        case 'chunk':
            const rows = streamer.processChunk(data);
            self.postMessage({ type: 'data', rows });
            break;
            
        case 'finalize':
            const finalRows = streamer.finalize();
            self.postMessage({ 
                type: 'complete', 
                rows: finalRows,
                totalRows: streamer.getRowCount()
            });
            break;
    }
};

// main.js
const worker = new Worker('worker.js');

async function processLargeFile(file) {
    // Initialize worker
    worker.postMessage({
        type: 'init',
        config: {
            delimiter: 9,
            skipLines: 60,
            commentChar: 35
        }
    });
    
    // Process chunks
    const reader = file.stream().getReader();
    let totalRows = 0;
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        worker.postMessage({ type: 'chunk', data: value });
    }
    
    // Finalize
    worker.postMessage({ type: 'finalize' });
    
    // Collect results
    return new Promise((resolve) => {
        const results = [];
        worker.onmessage = (event) => {
            const { type, rows, totalRows: count } = event.data;
            
            if (type === 'data') {
                results.push(...rows);
            } else if (type === 'complete') {
                resolve({ data: results, totalRows: count });
            }
        };
    });
}
```

## Error Handling

### Robust Processing with Validation

```typescript
async function processWithValidation(file) {
    try {
        // Validate file size
        if (file.size > 100 * 1024 * 1024) {  // 100MB limit
            throw new Error('File too large (>100MB)');
        }
        
        // Check if file is readable
        const header = new Uint8Array(await file.slice(0, 100).arrayBuffer());
        if (!isReadableText(header)) {
            throw new Error('File appears to be binary or corrupted');
        }
        
        // Auto-detect format
        const hint = sniffFormat(header);
        if (hint.confidence < 0.5) {
            console.warn('Low confidence in format detection');
        }
        
        // Process with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s
        
        const result = await processFile(file, hint, controller.signal);
        clearTimeout(timeout);
        
        return result;
        
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Processing timed out');
        }
        throw error;
    }
}

function isReadableText(bytes) {
    // Simple heuristic: >80% printable ASCII
    const printable = bytes.filter(b => 
        (b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9
    ).length;
    return (printable / bytes.length) > 0.8;
}

async function processFile(file, hint, signal) {
    if (signal.aborted) throw new Error('Aborted');
    
    const streamer = new TextStreamer()
        .setDelimiter(hint.delimiter)
        .setSkipLines(hint.skipLines)
        .setCommentChar(hint.commentChar);
    
    const reader = file.stream().getReader();
    const rows = [];
    
    while (true) {
        if (signal.aborted) throw new Error('Aborted');
        
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkRows = streamer.processChunk(value);
        rows.push(...chunkRows);
        
        // Progress reporting
        if (rows.length % 1000 === 0) {
            postMessage({
                type: 'progress',
                processed: rows.length,
                percentage: Math.min(99, (rows.length / 100000) * 100)
            });
        }
    }
    
    const finalRows = streamer.finalize();
    rows.push(...finalRows);
    
    return rows;
}
```

## Performance Tips

1. **Use streaming for large files** (>10MB)
2. **Process in Web Workers** for UI responsiveness
3. **Batch DOM updates** when visualizing data
4. **Validate early** to fail fast on bad files
5. **Cache format hints** for files from the same instrument

## Next Steps

- [API Reference](/api/io) - Complete function documentation
- [Performance Comparison](/examples/performance-comparison) - WASM vs JS benchmarks
- [Interactive Benchmarks](/bench) - Live performance testing including IO operations
- [Integration Guide](/guide/integration) - Framework integration examples
