export declare const constrainNumber: (value: number, min: number, max: number, roundPrecision?: number) => number;
export declare const numberIsBetween: (value: number, min: number, max: number) => boolean;
export declare const mapNumber: (value: number, istart: number, istop: number, ostart: number, ostop: number, constrain?: boolean | undefined, roundPrecision?: number) => number;
export declare const normalizeNumber: (value: number, low: number, high: number) => number;
export declare const distanceBetween: (x1: number, x2: number, y1: number, y2: number) => number;
export declare const randomBetween: (min: number, max: number) => number;
export declare const randomIntBetween: (min: number, max: number) => number;
export declare const getGreatestCommonDivisor: (a: number, b: number) => number;
export declare const MathUtil: {
    constrain: (value: number, min: number, max: number, roundPrecision?: number) => number;
    between: (value: number, min: number, max: number) => boolean;
    map: (value: number, istart: number, istop: number, ostart: number, ostop: number, constrain?: boolean | undefined, roundPrecision?: number) => number;
    normalize: (value: number, low: number, high: number) => number;
    distance: (x1: number, x2: number, y1: number, y2: number) => number;
    random: (min: number, max: number) => number;
    randomInt: (min: number, max: number) => number;
    gcd: (a: number, b: number) => number;
};
