use rayon::prelude::*;

/// Fast Peak Detection with Prominence - Parallel
pub fn find_peaks(data: &[f64], threshold: f64, prominence: f64) -> Vec<u32> {
    let n = data.len();
    if n < 3 { return vec![]; }
    
    // Stage 1: Local Maxima
    let cand_indices: Vec<usize>;
    
    if n < 4096 {
        cand_indices = (1..n-1).filter(|&i| {
            let val = data[i];
            val > threshold && val > data[i-1] && val > data[i+1]
        }).collect();
    } else {
        cand_indices = (1..n-1).into_par_iter()
            .with_min_len(4096)
            .filter(|&i| unsafe {
                let val = *data.get_unchecked(i);
                val > threshold && val > *data.get_unchecked(i-1) && val > *data.get_unchecked(i+1)
            })
            .collect();
    }

    if prominence <= 0.0 {
        return cand_indices.into_iter().map(|i| i as u32).collect();
    }

    // Stage 2: Prominence filtering (Simplified)
    cand_indices.into_iter().filter(|&i| {
        let val = data[i];
        
        let mut left_min = val;
        for j in (0..i).rev() {
            if data[j] > val { break; }
            if data[j] < left_min { left_min = data[j]; }
        }
        
        let mut right_min = val;
        for j in (i+1)..n {
            if data[j] > val { break; }
            if data[j] < right_min { right_min = data[j]; }
        }
        
        let higher_min = left_min.max(right_min);
        (val - higher_min) >= prominence
    }).map(|i| i as u32).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_find_peaks_basic() {
        let data = vec![0.0, 1.0, 3.0, 1.0, 0.5, 2.0, 0.0];
        let peaks = find_peaks(&data, 1.5, 0.0);
        assert_eq!(peaks, vec![2, 5]);
    }

    #[test]
    fn test_find_peaks_prominence() {
        // Peak at 2 (val 3) -> prominence ~ (3 - 0.5) = 2.5
        // Peak at 5 (val 2) -> prominence ~ (2 - 0.5) = 1.5
        let data = vec![0.0, 1.0, 3.0, 1.0, 0.5, 2.0, 0.0];
        
        let peaks_high_prom = find_peaks(&data, 0.0, 2.0);
        assert_eq!(peaks_high_prom, vec![2]);
    }
}
