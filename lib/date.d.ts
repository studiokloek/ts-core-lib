export declare function getDateString(date?: Date): string;
export declare function isBetweenDates(start: Date, end: Date): boolean;
export declare function isLeapYear(year: number): boolean;
export declare function getDateFromFirestoreString(value: string): Date | undefined;
export declare function getDateFromAPIString(value: string): Date;
export declare function isSameDay(d1: Date, d2: Date): boolean;
export declare function getSecondsBetween(d1: Date, d2: Date): number;
export declare function calulateAgeFromDate(birthday?: Date | string): number;
