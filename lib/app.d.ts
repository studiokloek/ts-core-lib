interface AppSettings {
    title: string;
    version: string;
    inited: boolean;
}
declare global {
    interface Window {
        APP?: AppSettings;
    }
}
export declare function isReloadedPage(): boolean;
export {};
