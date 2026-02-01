export function polyEval(coeffs: number[] | Float64Array, x: number): number {
    let res = 0;
    for (let i = coeffs.length - 1; i >= 0; i--) res = res * x + coeffs[i];
    return res;
}

export function polyDerive(coeffs: number[] | Float64Array): number[] {
    if (coeffs.length <= 1) return [0];
    const res = [];
    for (let i = 1; i < coeffs.length; i++) res.push(coeffs[i] * i);
    return res;
}

export function polyIntegrate(coeffs: number[] | Float64Array, c: number): number[] {
    const res = [c];
    for (let i = 0; i < coeffs.length; i++) res.push(coeffs[i] / (i + 1));
    return res;
}
