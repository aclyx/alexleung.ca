export interface Complex {
  re: number;
  im: number;
}

export const complex = (re: number, im: number): Complex => ({ re, im });

export const addComplex = (a: Complex, b: Complex): Complex => ({
  re: a.re + b.re,
  im: a.im + b.im,
});

export const multiplyComplex = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

export const divideComplex = (a: Complex, b: Complex): Complex => {
  const denominator = b.re * b.re + b.im * b.im;
  return {
    re: (a.re * b.re + a.im * b.im) / denominator,
    im: (a.im * b.re - a.re * b.im) / denominator,
  };
};

export const conjugateComplex = (value: Complex): Complex => ({
  re: value.re,
  im: -value.im,
});

export const polarToComplex = (
  magnitude: number,
  angleRad: number
): Complex => ({
  re: magnitude * Math.cos(angleRad),
  im: magnitude * Math.sin(angleRad),
});
