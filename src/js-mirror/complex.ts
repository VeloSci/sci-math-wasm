export class Complex {
    constructor(public re: number, public im: number) {}
    add(other: Complex): Complex { return new Complex(this.re + other.re, this.im + other.im); }
    mul(other: Complex): Complex {
        return new Complex(this.re * other.re - this.im * other.im, this.re * other.im + this.im * other.re);
    }
    magnitude(): number { return Math.sqrt(this.re * this.re + this.im * this.im); }
    phase(): number { return Math.atan2(this.im, this.re); }
    static fromPolar(r: number, theta: number): Complex {
        return new Complex(r * Math.cos(theta), r * Math.sin(theta));
    }
}
