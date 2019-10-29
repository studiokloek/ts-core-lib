declare function subscribe(message: string, func: Function): string | undefined;
declare function subscribeOnce(message: string, func: Function): string | undefined;
declare function unsubscribe(value: Function | string | (Function | string)[]): void;
declare function publish(message: string, data?: any, report?: boolean): boolean;
declare function publishSync(message: string, data?: any, report?: boolean): boolean;
export declare class PubSubMixin {
    private __pubsubSubscriptions;
    protected subscribe(message: string, func: Function): void;
    protected unsubscribe(message: string): void;
    protected unsubscribeAll(): void;
    protected publish(message: string, data?: any, report?: boolean): boolean;
    protected publishSync(message: string, data?: any, report?: boolean): boolean;
}
export declare const PubSub: {
    subscribe: typeof subscribe;
    subscribeOnce: typeof subscribeOnce;
    unsubscribe: typeof unsubscribe;
    publish: typeof publish;
    publishSync: typeof publishSync;
};
export {};
