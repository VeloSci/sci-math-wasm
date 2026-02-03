use wasm_bindgen::prelude::*;
#[cfg(all(target_arch = "wasm32", target_feature = "simd128"))]
use core::arch::wasm32::*;
use rayon::prelude::*;

#[cfg(not(all(target_arch = "wasm32", target_feature = "simd128")))]
mod wasm_simd_stubs {
    #[allow(non_camel_case_types)]
    pub type v128 = i128;
}
#[cfg(not(all(target_arch = "wasm32", target_feature = "simd128")))]
use wasm_simd_stubs::*;

pub fn run_nbody_f32(
    n: usize, 
    px_addr: usize, py_addr: usize, pz_addr: usize,
    vx_addr: usize, vy_addr: usize, vz_addr: usize,
    dt: f32, iters: u32
) {
    if n < 4 { return; }
    
    #[cfg(all(target_arch = "wasm32", target_feature = "simd128"))]
    unsafe {
        let v_soft = f32x4_splat(1e-5);
        let v_one = f32x4_splat(1.0);
        for _ in 0..iters {
            (0..n).into_par_iter().for_each(move |i| {
                let px = px_addr as *const f32; let py = py_addr as *const f32; let pz = pz_addr as *const f32;
                let vx = vx_addr as *mut f32; let vy = vy_addr as *mut f32; let vz = vz_addr as *mut f32;
                let mut v_fx = f32x4_splat(0.0); let mut v_fy = f32x4_splat(0.0); let mut v_fz = f32x4_splat(0.0);
                let pxi = *px.add(i); let pyi = *py.add(i); let pzi = *pz.add(i);
                let v_pxi = f32x4_splat(pxi); let v_pyi = f32x4_splat(pyi); let v_pzi = f32x4_splat(pzi);
                let n_simd = (n / 4) * 4;
                for j in (0..n_simd).step_by(4) {
                    let v_pxj = v128_load(px.add(j) as *const v128);
                    let v_pyj = v128_load(py.add(j) as *const v128);
                    let v_pzj = v128_load(pz.add(j) as *const v128);
                    let dx = f32x4_sub(v_pxj, v_pxi); let dy = f32x4_sub(v_pyj, v_pyi); let dz = f32x4_sub(v_pzj, v_pzi);
                    let d2 = f32x4_add(f32x4_add(f32x4_mul(dx, dx), f32x4_mul(dy, dy)), f32x4_add(f32x4_mul(dz, dz), v_soft));
                    let inv_dist = f32x4_div(v_one, f32x4_sqrt(d2)); 
                    let inv_dist3 = f32x4_mul(inv_dist, f32x4_mul(inv_dist, inv_dist));
                    v_fx = f32x4_add(v_fx, f32x4_mul(dx, inv_dist3)); v_fy = f32x4_add(v_fy, f32x4_mul(dy, inv_dist3)); v_fz = f32x4_add(v_fz, f32x4_mul(dz, inv_dist3));
                }
                let fx_s = f32x4_extract_lane::<0>(v_fx) + f32x4_extract_lane::<1>(v_fx) + f32x4_extract_lane::<2>(v_fx) + f32x4_extract_lane::<3>(v_fx);
                let fy_s = f32x4_extract_lane::<0>(v_fy) + f32x4_extract_lane::<1>(v_fy) + f32x4_extract_lane::<2>(v_fy) + f32x4_extract_lane::<3>(v_fy);
                let fz_s = f32x4_extract_lane::<0>(v_fz) + f32x4_extract_lane::<1>(v_fz) + f32x4_extract_lane::<2>(v_fz) + f32x4_extract_lane::<3>(v_fz);
                for j in n_simd..n {
                    let dx = *px.add(j) - pxi; let dy = *py.add(j) - pyi; let dz = *pz.add(j) - pzi;
                    let id3 = 1.0 / (dx*dx + dy*dy + dz*dz + 1e-9).sqrt().powi(3);
                    *vx.add(i) += dx * id3 * dt; *vy.add(i) += dy * id3 * dt; *vz.add(i) += dz * id3 * dt;
                }
                *vx.add(i) += fx_s * dt; *vy.add(i) += fy_s * dt; *vz.add(i) += fz_s * dt;
            });
        }
    }

    #[cfg(any(not(target_arch = "wasm32"), not(target_feature = "simd128")))]
    {
        for _ in 0..iters {
            (0..n).into_par_iter().for_each(move |i| unsafe {
                let px = px_addr as *const f32; let py = py_addr as *const f32; let pz = pz_addr as *const f32;
                let vx = vx_addr as *mut f32; let vy = vy_addr as *mut f32; let vz = vz_addr as *mut f32;
                let pxi = *px.add(i); let pyi = *py.add(i); let pzi = *pz.add(i);
                let mut fx = 0.0; let mut fy = 0.0; let mut fz = 0.0;
                for j in 0..n {
                    let dx = *px.add(j) - pxi; let dy = *py.add(j) - pyi; let dz = *pz.add(j) - pzi;
                    let d2 = dx*dx + dy*dy + dz*dz + 1e-9;
                    let inv_dist3 = 1.0 / (d2.sqrt() * d2);
                    fx += dx * inv_dist3; fy += dy * inv_dist3; fz += dz * inv_dist3;
                }
                *vx.add(i) += fx * dt; *vy.add(i) += fy * dt; *vz.add(i) += fz * dt;
            });
        }
    }
}
