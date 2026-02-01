import { solveLinearSystem } from './linalg';

export function fitLinear(x: number[] | Float64Array, y: number[] | Float64Array): [number, number, number] {
    const n = x.length;
    let sx = 0, sy = 0, sxy = 0, sxx = 0;
    for (let i = 0; i < n; i++) {
        sx += x[i]; sy += y[i]; sxy += x[i] * y[i]; sxx += x[i] * x[i];
    }
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    const intercept = (sy - slope * sx) / n;
    
    let ssRes = 0, ssTot = 0, syAvg = sy / n;
    for (let i = 0; i < n; i++) {
        const pred = slope * x[i] + intercept;
        ssRes += Math.pow(y[i] - pred, 2);
        ssTot += Math.pow(y[i] - syAvg, 2);
    }
    return [slope, intercept, 1 - ssRes / ssTot];
}

export function fitPolynomial(x: number[] | Float64Array, y: number[] | Float64Array, order: number): Float64Array | null {
    const n = order + 1;
    const powers = new Float64Array(2 * order + 1);
    const b = new Float64Array(n);
    for (let i = 0; i < x.length; i++) {
        let p = 1;
        for (let j = 0; j <= 2 * order; j++) {
            powers[j] += p;
            if (j <= order) b[j] += p * y[i];
            p *= x[i];
        }
    }
    const a = new Float64Array(n * n);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) a[i * n + j] = powers[i + j];
    }
    return solveLinearSystem(a, b, n);
}

export function fitGaussians(x: number[] | Float64Array, y: number[] | Float64Array, initial: [number, number, number]): number[] {
    let [a, mu, sigma] = initial;
    let lambda = 0.001;
    for (let iter = 0; iter < 20; iter++) {
        const jtj = new Float64Array(9), jtr = new Float64Array(3);
        let err = 0;
        for (let i = 0; i < x.length; i++) {
            const exp = Math.exp(-Math.pow(x[i] - mu, 2) / (2 * sigma * sigma));
            const fi = a * exp, ri = y[i] - fi;
            err += ri * ri;
            const jac = [exp, a * exp * (x[i] - mu) / (sigma * sigma), a * exp * Math.pow(x[i] - mu, 2) / Math.pow(sigma, 3)];
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) jtj[r * 3 + c] += jac[r] * jac[c];
                jtr[r] += jac[r] * ri;
            }
        }
        for (let i = 0; i < 3; i++) jtj[i * 3 + i] *= (1 + lambda);
        const delta = solveLinearSystem(jtj, jtr, 3);
        if (!delta) break;
        const [na, nmu, nsigma] = [a + delta[0], mu + delta[1], sigma + delta[2]];
        let nerr = 0;
        for (let i = 0; i < x.length; i++) nerr += Math.pow(y[i] - na * Math.exp(-Math.pow(x[i] - nmu, 2) / (2 * nsigma * nsigma)), 2);
        if (nerr < err) { a = na; mu = nmu; sigma = nsigma; lambda /= 10; if (Math.abs(err - nerr) < 1e-6) break; }
        else lambda *= 10;
    }
    return [a, mu, sigma];
}

export function fitExponential(x: number[] | Float64Array, y: number[] | Float64Array): [number, number] | null {
    const validX: number[] = [], logY: number[] = [];
    for (let i = 0; i < x.length; i++) {
        if (y[i] > 0) { validX.push(x[i]); logY.push(Math.log(y[i])); }
    }
    if (validX.length < 2) return null;
    const [slopeB, interceptLnA] = fitLinear(validX, logY);
    return [Math.exp(interceptLnA), slopeB];
}

export function fitLogarithmic(x: number[] | Float64Array, y: number[] | Float64Array): [number, number] | null {
    const logX: number[] = [], validY: number[] = [];
    for (let i = 0; i < x.length; i++) {
        if (x[i] > 0) { logX.push(Math.log(x[i])); validY.push(y[i]); }
    }
    if (logX.length < 2) return null;
    const [slopeB, interceptA] = fitLinear(logX, validY);
    return [interceptA, slopeB];
}
