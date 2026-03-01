---
description: High-speed ingestion of scientific data types
---
# SIMD Parsing Architecture

Scientific equipment outputs text files (.csv, .dat) that can be several gigabytes in size. `sci-math-wasm` provides a high-speed parsing engine to handle these instantly in the browser.

## TextStreamer
When parsing large files, DO NOT try to call `reader.readAsText()` in Javascript and pass the giant String to Rust. The browser will chunk the heap and crash.

Instead:
1. In JS, instantiate a `const streamer = new TextStreamer()`.
2. Use the HTML5 `File` API stream (`file.stream().getReader()`).
3. As `Uint8Array` chunks arrive from the disk, pass them instantly to `streamer.push_chunk(chunk)`.
4. Rust will use `memchr` capable of SIMD search to locate the newline characters `\n` at hundreds of megabytes per second.
5. Rust parses the digits using fast-float algorithms directly into `Vec<f64>`.
6. When the stream finishes, call `streamer.get_final_array()` to retrieve the Float64Array.
