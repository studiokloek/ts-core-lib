declare global {
    interface Window {
        ga?: Function;
    }
}
export interface StatsPageData {
    path: string;
    title: string;
}
export interface StatsEventData {
    path: string;
    value?: string | number;
}
declare function initStats(_ua: string): void;
declare function registerPageStats(_data?: StatsPageData): void;
declare function registerEventStats(_data?: StatsEventData): void;
export declare const Stats: {
    registerPage: typeof registerPageStats;
    registerEvent: typeof registerEventStats;
    initStats: typeof initStats;
};
export {};
