use super::memory::EngineState;
use super::{nbody, matmul, analysis};

pub fn run_nbody(state: &mut EngineState, idx: u32, idy: u32, idz: u32, ivx: u32, ivy: u32, ivz: u32, dt: f32, iters: u32) -> Result<(), String> {
    let n = state.vectors_f32.get(&idx).ok_or("Vector not found")?.len();
    let px = state.vectors_f32.get(&idx).ok_or("Vector X not found")?.as_ptr() as usize;
    let py = state.vectors_f32.get(&idy).ok_or("Vector Y not found")?.as_ptr() as usize;
    let pz = state.vectors_f32.get(&idz).ok_or("Vector Z not found")?.as_ptr() as usize;
    let vx = state.vectors_f32.get_mut(&ivx).ok_or("Vector VX not found")?.as_mut_ptr() as usize;
    let vy = state.vectors_f32.get_mut(&ivy).ok_or("Vector VY not found")?.as_mut_ptr() as usize;
    let vz = state.vectors_f32.get_mut(&ivz).ok_or("Vector VZ not found")?.as_mut_ptr() as usize;
    nbody::run_nbody_f32(n, px, py, pz, vx, vy, vz, dt, iters);
    Ok(())
}

pub fn run_matmul(state: &mut EngineState, a_id: u32, b_id: u32, o_id: u32, size: usize) -> Result<(), String> {
    let ap = state.vectors.get(&a_id).ok_or("Vector A not found")?.as_ptr() as usize;
    let bp = state.vectors.get(&b_id).ok_or("Vector B not found")?.as_ptr() as usize;
    let op = state.vectors.get_mut(&o_id).ok_or("Output vector not found")?.as_mut_ptr() as usize;
    matmul::run_matmul_unrolled(ap, bp, op, size);
    Ok(())
}

pub fn run_smooth_sg(state: &mut EngineState, id: u32, oid: u32, window: usize, degree: usize) -> Result<(), String> {
    let n = state.vectors.get(&id).ok_or("Input vector not found")?.len();
    let i_ptr = state.vectors.get(&id).ok_or("Input vector not found")?.as_ptr();
    let o_ptr = state.vectors.get_mut(&oid).ok_or("Output vector not found")?.as_mut_ptr();
    analysis::run_smooth_sg(n, i_ptr, o_ptr, window, degree);
    Ok(())
}
