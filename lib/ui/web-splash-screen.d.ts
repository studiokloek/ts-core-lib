declare class ConcreteWebSplashScreen {
    private loader;
    private mediatrigger;
    init(_target: HTMLElement | string): void;
    private initWebLoaderScreen;
    private initMediaTriggerScreen;
    checkMediaReady(): Promise<void>;
    private onLoadComplete;
    private onReady;
    private onLoadProgress;
}
export declare const WebSplashScreen: ConcreteWebSplashScreen;
export {};
