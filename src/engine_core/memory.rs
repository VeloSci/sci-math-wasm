use std::collections::HashMap;

pub struct EngineState {
    pub vectors: HashMap<u32, Vec<f64>>,
    pub vectors_f32: HashMap<u32, Vec<f32>>,
    pub columns: HashMap<String, u32>,
    pub next_id: u32,
}

impl EngineState {
    pub fn new() -> Self {
        Self {
            vectors: HashMap::new(),
            vectors_f32: HashMap::new(),
            columns: HashMap::new(),
            next_id: 0,
        }
    }

    pub fn create_vector(&mut self, size: usize) -> u32 {
        let id = self.next_id;
        self.vectors.insert(id, vec![0.0; size]);
        self.next_id += 1;
        id
    }

    pub fn create_vector_f32(&mut self, size: usize) -> u32 {
        let id = self.next_id;
        self.vectors_f32.insert(id, vec![0.0; size]);
        self.next_id += 1;
        id
    }

    /// Allocates multiple vectors of the same size in one batch.
    pub fn create_batch(&mut self, count: usize, size: usize) -> Vec<u32> {
        let mut ids = Vec::with_capacity(count);
        for _ in 0..count {
            ids.push(self.create_vector(size));
        }
        ids
    }
}
