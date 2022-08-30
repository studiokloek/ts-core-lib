import { round } from 'lodash-es';

export const constrainNumber = (value: number, min: number, max: number, roundPrecision = -1): number => {
  if (value > max) {
    value = max;
  } else if (value < min) {
    value = min;
  }

  return roundPrecision === -1 ? value : round(value, roundPrecision);
};

export const numberIsBetween = (value: number, min: number, max: number): boolean => {
  return value > max ? false : value >= min;
};

export const mapNumber = (value: number, istart: number, istop: number, ostart: number, ostop: number, constrain?: boolean, roundPrecision = -1): number => {
  constrain = constrain === true ? true : false;

  // fix voor als range start/stop gelijk is, om te voorkomen dat we door nul delen
  const inputRangeDiff = istop - istart || 0.000_000_1;

  let mappedValue = (ostop - ostart) * ((value - istart) / inputRangeDiff);

  if (constrain) {
    if (ostop > ostart) {
      return constrainNumber(ostart + mappedValue, ostart, ostop, roundPrecision);
    }

    return constrainNumber(ostart + mappedValue, ostop, ostart, roundPrecision);
  }

  mappedValue = ostart + mappedValue;

  return roundPrecision === -1 ? mappedValue : round(mappedValue, roundPrecision);
};

export const normalizeNumber = (value: number, low: number, high: number): number => {
  return (value - low) / (high - low);
};

export const distanceBetween = (x1: number, x2: number, y1: number, y2: number): number => {
  let xs = x2 - x1,
    ys = y2 - y1;

  xs = xs * xs;
  ys = ys * ys;

  return Math.abs(Math.sqrt(xs + ys));
};

export const randomBetween = (min: number, max: number): number => {
  const value = Math.random() * (max - min);

  return min + value;
};

export const randomIntBetween = (min: number, max: number): number => {
  const value = Math.random() * (max - min + 1);

  return Math.floor(min + value);
};

export const getGreatestCommonDivisor = (a: number, b: number): number => {
  return b === 0 ? a : getGreatestCommonDivisor(b, a % b);
};

export const MathUtil = {
  constrain: constrainNumber,
  between: numberIsBetween,
  map: mapNumber,
  normalize: normalizeNumber,
  distance: distanceBetween,
  random: randomBetween,
  randomInt: randomIntBetween,
  gcd: getGreatestCommonDivisor,
};
