import { bench, describe } from 'vitest';
import { TextStreamer, sniffFormat } from '../pkg/node';

// Generate large CSV data
const genCsv = (rows: number, cols: number) => {
    let res: string[] = [];
    for(let i=0; i<rows; i++) {
        const row = Array.from({length: cols}, () => Math.random().toFixed(4)).join(',');
        res.push(row);
    }
    return new TextEncoder().encode(res.join('\n'));
};

const smallCsv = genCsv(10000, 5);
const largeCsv = genCsv(100000, 8);
const mptLike = new TextEncoder().encode(`Nb header lines: 2
mode: 3
Technique: 1
Values:
1.23\t4.56\t7.89
0.12\t3.45\t6.78
`.repeat(10000));

describe('IO Benchmarks', () => {
  bench('CSV Parsing 10K rows', () => {
    const streamer = new TextStreamer();
    streamer.processNumericChunk(smallCsv);
  });

  bench('CSV Parsing 100K rows (Numeric)', () => {
    const streamer = new TextStreamer();
    streamer.processNumericChunk(largeCsv);
  });

  bench('CSV Parsing 100K rows (Columnar)', () => {
    const streamer = new TextStreamer();
    streamer.processColumnarChunk(largeCsv);
  });

  bench('CSV Parsing 100K rows (Text)', () => {
    const streamer = new TextStreamer();
    streamer.processChunk(largeCsv);
  });
  
  bench('MPT Like Processing', () => {
      const streamer = new TextStreamer().setDelimiter(9).setSkipLines(4);
      streamer.processChunk(mptLike);
  });

  bench('Format Detection', () => {
    sniffFormat(smallCsv.slice(0, 4096));
  });
});
