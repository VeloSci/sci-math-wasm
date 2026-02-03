/**
 * Performance Comparison: WASM vs TypeScript File Processing
 * 
 * This simulation compares the performance of sci-math-wasm's IO module
 * against pure TypeScript implementations for various scientific file formats.
 */

// Import WASM functions
import init, {
    TextStreamer,
    readExcelFile,
    sniffFormat,
    detectDelimiter
} from '../pkg/web/sci_math_wasm.js';

// Sample data generators for testing
class TestDataGenerator {
    static generateCSV(rows: number, cols: number): string {
        let csv = '';
        // Header
        csv += Array.from({ length: cols }, (_, i) => `Column${i + 1}`).join(',') + '\n';
        // Data rows
        for (let i = 0; i < rows; i++) {
            const row = Array.from({ length: cols }, (_, j) => 
                (Math.random() * 1000).toFixed(6)
            ).join(',');
            csv += row + '\n';
        }
        return csv;
    }

    static generateTSV(rows: number, cols: number): string {
        return this.generateCSV(rows, cols).replace(/,/g, '\t');
    }

    static generateMPT(rows: number): string {
        // Simulate Biologic EC-Lab .mpt file
        let content = '';
        // Metadata header (60 lines)
        for (let i = 0; i < 60; i++) {
            content += `# Metadata line ${i + 1}\n`;
        }
        // Data header
        content += 'Time/s\tEwe/V\tI/mA\tCycle\tIndex\n';
        // Data rows
        for (let i = 0; i < rows; i++) {
            const time = (i * 0.1).toFixed(6);
            const voltage = (2.5 + Math.sin(i * 0.01) * 0.5).toFixed(6);
            const current = (Math.random() * 10 - 5).toFixed(6);
            content += `${time}\t${voltage}\t${current}\t1\t${i}\n`;
        }
        return content;
    }

    static generateExcelData(rows: number, cols: number): Uint8Array {
        // In a real scenario, we'd generate actual Excel binary data
        // For simulation, we'll create a representative byte array
        const size = 2048 + (rows * cols * 8); // Approximate size
        return new Uint8Array(size).fill(0);
    }
}

// Pure TypeScript implementations for comparison
class TypeScriptParser {
    static parseCSV(data: string): string[][] {
        const lines = data.trim().split('\n');
        return lines.map(line => line.split(','));
    }

    static parseTSV(data: string): string[][] {
        const lines = data.trim().split('\n');
        return lines.map(line => line.split('\t'));
    }

    static parseMPT(data: string): string[][] {
        const lines = data.trim().split('\n');
        // Skip first 60 lines (metadata) + 1 header line
        const dataLines = lines.slice(61);
        return dataLines.map(line => line.split('\t'));
    }

    static parseExcel(data: Uint8Array): string[][] {
        // Placeholder - real implementation would use libraries like SheetJS
        return [['Placeholder', 'Data']];
    }
}

// Benchmark runner
class BenchmarkRunner {
    static async runBenchmark(
        name: string,
        wasmFn: () => Promise<any>,
        tsFn: () => any,
        iterations: number = 5
    ): Promise<{ wasm: number[], ts: number[] }> {
        const wasmTimes: number[] = [];
        const tsTimes: number[] = [];

        console.log(`\n=== ${name} ===`);

        // Warm-up
        try {
            await wasmFn();
        } catch (e: any) {
            console.log('WASM warm-up failed:', e.message);
        }
        try {
            tsFn();
        } catch (e: any) {
            console.log('TS warm-up failed:', e.message);
        }

        // WASM benchmark
        console.log('Running WASM tests...');
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            try {
                await wasmFn();
                const end = performance.now();
                wasmTimes.push(end - start);
                console.log(`  WASM run ${i + 1}: ${(end - start).toFixed(2)}ms`);
            } catch (e: any) {
                console.log(`  WASM run ${i + 1}: FAILED - ${e.message}`);
                wasmTimes.push(NaN);
            }
        }

        // TypeScript benchmark
        console.log('Running TypeScript tests...');
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            try {
                tsFn();
                const end = performance.now();
                tsTimes.push(end - start);
                console.log(`  TS run ${i + 1}: ${(end - start).toFixed(2)}ms`);
            } catch (e: any) {
                console.log(`  TS run ${i + 1}: FAILED - ${e.message}`);
                wasmTimes.push(NaN);
            }
        }

        return { wasm: wasmTimes, ts: tsTimes };
    }

    static calculateStats(times: number[]): { mean: number; min: number; max: number; std: number } {
        const validTimes = times.filter(t => !isNaN(t));
        if (validTimes.length === 0) {
            return { mean: NaN, min: NaN, max: NaN, std: NaN };
        }
        
        const mean = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
        const min = Math.min(...validTimes);
        const max = Math.max(...validTimes);
        const std = Math.sqrt(
            validTimes.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / validTimes.length
        );
        
        return { mean, min, max, std };
    }

    static printComparison(name: string, wasmTimes: number[], tsTimes: number[]) {
        const wasmStats = this.calculateStats(wasmTimes);
        const tsStats = this.calculateStats(tsTimes);

        console.log(`\n${name} Results:`);
        console.log('----------------------------------------');
        console.log(`WASM:  Mean=${wasmStats.mean.toFixed(2)}ms ±${wasmStats.std.toFixed(2)}ms`);
        console.log(`       Min=${wasmStats.min.toFixed(2)}ms, Max=${wasmStats.max.toFixed(2)}ms`);
        console.log(`TS:    Mean=${tsStats.mean.toFixed(2)}ms ±${tsStats.std.toFixed(2)}ms`);
        console.log(`       Min=${tsStats.min.toFixed(2)}ms, Max=${tsStats.max.toFixed(2)}ms`);
        
        if (!isNaN(wasmStats.mean) && !isNaN(tsStats.mean)) {
            const speedup = tsStats.mean / wasmStats.mean;
            console.log(`Speedup: ${speedup.toFixed(2)}x faster`);
        }
        console.log('');
    }
}

// Main simulation
async function runSimulation() {
    console.log('Sci-Math-WASM IO Performance Comparison');
    console.log('=======================================\n');

    // Initialize WASM
    try {
        await init();
        console.log('✅ WASM initialized successfully');
    } catch (e) {
        console.error('❌ Failed to initialize WASM:', e);
        return;
    }

    // Test 1: Small CSV (10K rows)
    console.log('\n--- Test 1: Small CSV File (10K rows × 5 columns) ---');
    const smallCSV = TestDataGenerator.generateCSV(10000, 5);
    const smallCSVBytes = new TextEncoder().encode(smallCSV);

    const { wasm: wasmSmall, ts: tsSmall } = await BenchmarkRunner.runBenchmark(
        'Small CSV (10K rows)',
        async () => {
            const streamer = new TextStreamer().setDelimiter(44).setSkipLines(1);
            return streamer.processNumericChunk(smallCSVBytes);
        },
        () => TypeScriptParser.parseCSV(smallCSV)
    );

    BenchmarkRunner.printComparison('Small CSV', wasmSmall, tsSmall);

    // Test 2: Large CSV (100K rows) - COLUMNAR TURBO
    console.log('\n--- Test 2: Large CSV File (100K rows × 8 columns) - COLUMNAR ---');
    const largeCSV = TestDataGenerator.generateCSV(100000, 8);
    const largeCSVBytes = new TextEncoder().encode(largeCSV);

    const { wasm: wasmLarge, ts: tsLarge } = await BenchmarkRunner.runBenchmark(
        'Large CSV (100K rows) - Columnar',
        async () => {
            const streamer = new TextStreamer().setDelimiter(44).setSkipLines(1);
            return streamer.processColumnarChunk(largeCSVBytes);
        },
        () => TypeScriptParser.parseCSV(largeCSV),
        3 
    );

    BenchmarkRunner.printComparison('Large CSV (Columnar)', wasmLarge, tsLarge);

    // Test 3: MPT File with Headers
    console.log('\n--- Test 3: MPT File (50K rows with 60-line header) ---');
    const mptData = TestDataGenerator.generateMPT(50000);
    const mptBytes = new TextEncoder().encode(mptData);

    const { wasm: wasmMPT, ts: tsMPT } = await BenchmarkRunner.runBenchmark(
        'MPT File (50K rows)',
        async () => {
            const streamer = new TextStreamer()
                .setDelimiter(9)
                .setSkipLines(61);
            return streamer.processColumnarChunk(mptBytes);
        },
        () => TypeScriptParser.parseMPT(mptData)
    );

    BenchmarkRunner.printComparison('MPT File', wasmMPT, tsMPT);

    // Test 4: Excel File
    console.log('\n--- Test 4: Excel File Simulation ---');
    const excelBytes = TestDataGenerator.generateExcelData(50000, 5);

    const { wasm: wasmExcel, ts: tsExcel } = await BenchmarkRunner.runBenchmark(
        'Excel File',
        async () => readExcelFile(excelBytes),
        () => TypeScriptParser.parseExcel(excelBytes)
    );

    BenchmarkRunner.printComparison('Excel File', wasmExcel, tsExcel);

    // Test 5: Format Detection
    console.log('\n--- Test 5: Format Detection ---');
    const csvSample = new TextEncoder().encode('a,b,c\n1,2,3\n4,5,6');
    const tsvSample = new TextEncoder().encode('a\tb\tc\n1\t2\t3\n4\t5\t6');

    const { wasm: wasmSniff, ts: tsSniff } = await BenchmarkRunner.runBenchmark(
        'Format Detection',
        async () => {
            sniffFormat(csvSample);
            sniffFormat(tsvSample);
        },
        () => {
            // Simple TS detection
            const csvDelim = csvSample.includes(44) ? 44 : null;
            const tsvDelim = tsvSample.includes(9) ? 9 : null;
            return { csvDelim, tsvDelim };
        }
    );

    BenchmarkRunner.printComparison('Format Detection', wasmSniff, tsSniff);

    // Summary
    console.log('\n=======================================');
    console.log('SUMMARY');
    console.log('=======================================');
    
    const allWASMTimes = [...wasmSmall, ...wasmLarge, ...wasmMPT, ...wasmExcel, ...wasmSniff].filter(t => !isNaN(t));
    const allTSTimes = [...tsSmall, ...tsLarge, ...tsMPT, ...tsExcel, ...tsSniff].filter(t => !isNaN(t));
    
    if (allWASMTimes.length > 0 && allTSTimes.length > 0) {
        const totalWASMMean = allWASMTimes.reduce((a, b) => a + b, 0) / allWASMTimes.length;
        const totalTSMean = allTSTimes.reduce((a, b) => a + b, 0) / allTSTimes.length;
        const overallSpeedup = totalTSMean / totalWASMMean;
        
        console.log(`Overall Performance: WASM is ${overallSpeedup.toFixed(2)}x faster than TypeScript`);
        console.log(`Total WASM time: ${totalWASMMean.toFixed(2)}ms avg`);
        console.log(`Total TS time: ${totalTSMean.toFixed(2)}ms avg`);
    }

    console.log('\nNote: Excel test uses placeholder data. Real performance will vary.');
    console.log('Actual speedup depends on file size, complexity, and hardware.');
}

// Memory usage monitoring
function monitorMemory() {
    if ('memory' in performance) {
        const mem = (performance as any).memory;
        console.log(`Memory Usage: ${(mem.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Memory Limit: ${(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
    }
}

// Run the simulation
runSimulation().then(() => {
    monitorMemory();
    console.log('\nSimulation complete!');
}).catch(err => {
    console.error('Simulation failed:', err);
});

// Export for use in other modules
export {
    TestDataGenerator,
    TypeScriptParser,
    BenchmarkRunner,
    runSimulation
};
