import { round } from 'lodash';

/**
 * Begrenst een getal tussen een minimum- en maximumwaarde, met optionele afronding.
 * Als `roundPrecision` -1 is (standaard), wordt er niet afgerond.
 */
export const constrainNumber = (value: number, min: number, max: number, roundPrecision = -1): number => {
  if (value > max) {
    value = max;
  } else if (value < min) {
    value = min;
  }

  return roundPrecision === -1 ? value : round(value, roundPrecision);
};

/**
 * Geeft true terug als `value` binnen het inclusieve bereik [min, max] valt.
 */
export const numberIsBetween = (value: number, min: number, max: number): boolean => {
  return value > max ? false : value >= min;
};

/**
 * Zet een getal van het ene bereik om naar het andere, vergelijkbaar met de `map()`-functie van Processing.
 * Optioneel wordt de uitvoer begrensd tot het uitvoerbereik en wordt afronding toegepast.
 */
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

/**
 * Normaliseert een getal naar een bereik van 0–1, gegeven een onderste en bovenste grens.
 */
export const normalizeNumber = (value: number, low: number, high: number): number => {
  return (value - low) / (high - low);
};

/**
 * Berekent de Euclidische afstand tussen twee 2D-punten (x1, y1) en (x2, y2).
 */
export const distanceBetween = (x1: number, x2: number, y1: number, y2: number): number => {
  let xs = x2 - x1,
    ys = y2 - y1;

  xs = xs * xs;
  ys = ys * ys;

  return Math.abs(Math.sqrt(xs + ys));
};

/**
 * Geeft een willekeurig getal met drijvende komma terug tussen `min` (inclusief) en `max` (exclusief).
 */
export const randomBetween = (min: number, max: number): number => {
  const value = Math.random() * (max - min);

  return min + value;
};

/**
 * Geeft een willekeurig geheel getal terug tussen `min` en `max` (beide inclusief).
 */
export const randomIntBetween = (min: number, max: number): number => {
  const value = Math.random() * (max - min + 1);

  return Math.floor(min + value);
};

/**
 * Berekent de grootste gemene deler van twee gehele getallen met het algoritme van Euclides.
 */
export const getGreatestCommonDivisor = (a: number, b: number): number => {
  return b === 0 ? a : getGreatestCommonDivisor(b, a % b);
};

/**
 * Handigheidsobject dat alle wiskundige hulpfuncties groepeert onder één namespace.
 * Biedt verkorte toegang tot begrenzing, mapping, normalisatie, afstand, willekeurigheid en GGD-bewerkingen.
 */
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
