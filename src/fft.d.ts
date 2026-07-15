// Ambient types for `fft.js` (indutny), which ships no TypeScript declarations.
// Complex arrays are interleaved real/imaginary: [re0, im0, re1, im1, ...].
declare module "fft.js" {
  export default class FFT {
    constructor(size: number);
    readonly size: number;
    createComplexArray(): number[];
    toComplexArray(input: ArrayLike<number>, storage?: number[]): number[];
    fromComplexArray(complex: ArrayLike<number>, storage?: number[]): number[];
    realTransform(out: number[], data: ArrayLike<number>): void;
    completeSpectrum(spectrum: number[]): void;
    transform(out: number[], data: ArrayLike<number>): void;
    inverseTransform(out: number[], data: ArrayLike<number>): void;
  }
}
