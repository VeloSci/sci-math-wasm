use wasm_bindgen::prelude::*;

// Ensure you export the struct so JS can instantiate it
#[wasm_bindgen]
pub struct MovingAverageFilter {
    window_size: usize,
    buffer: Vec<f64>
}

#[wasm_bindgen]
impl MovingAverageFilter {
    #[wasm_bindgen(constructor)]
    pub fn new(window_size: usize) -> Self {
        MovingAverageFilter {
            window_size,
            buffer: Vec::with_capacity(window_size),
        }
    }

    // Accept raw slice mapping directly to JS Float64Array
    pub fn process(&mut self, data: &[f64]) -> Vec<f64> {
        let mut output = Vec::with_capacity(data.len());
        
        for &value in data {
            self.buffer.push(value);
            if self.buffer.len() > self.window_size {
                self.buffer.remove(0);
            }
            
            let sum: f64 = self.buffer.iter().sum();
            output.push(sum / self.buffer.len() as f64);
        }
        
        output
    }
}
