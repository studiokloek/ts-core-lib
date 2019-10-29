import { round } from 'lodash-es';
export const constrainNumber = (value, min, max, roundPrecision = -1) => {
    if (value > max) {
        value = max;
    }
    else if (value < min) {
        value = min;
    }
    return roundPrecision === -1 ? value : round(value, roundPrecision);
};
export const numberIsBetween = (value, min, max) => {
    return value > max ? false : value >= min;
};
export const mapNumber = (value, istart, istop, ostart, ostop, constrain, roundPrecision = -1) => {
    constrain = constrain === true ? true : false;
    let mappedValue = (ostop - ostart) * ((value - istart) / (istop - istart));
    if (constrain) {
        if (ostop > ostart) {
            return constrainNumber(ostart + mappedValue, ostart, ostop, roundPrecision);
        }
        return constrainNumber(ostart + mappedValue, ostop, ostart, roundPrecision);
    }
    mappedValue = ostart + mappedValue;
    return roundPrecision === -1 ? mappedValue : round(mappedValue, roundPrecision);
};
export const normalizeNumber = (value, low, high) => {
    return (value - low) / (high - low);
};
export const distanceBetween = (x1, x2, y1, y2) => {
    let xs = x2 - x1, ys = y2 - y1;
    xs = xs * xs;
    ys = ys * ys;
    return Math.abs(Math.sqrt(xs + ys));
};
export const randomBetween = (min, max) => {
    const value = Math.random() * (max - min);
    return min + value;
};
export const randomIntBetween = (min, max) => {
    const value = Math.random() * (max - min + 1);
    return Math.floor(min + value);
};
export const getGreatestCommonDivisor = (a, b) => {
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
//# sourceMappingURL=math.js.map