declare class ConcreteStorage {
    constructor();
    set(key?: string, value?: any): Promise<void>;
    get(key?: string): Promise<any>;
    remove(key?: string): Promise<void>;
    keys(): Promise<string[]>;
    clear(): Promise<void>;
}
export declare const LocalStorage: ConcreteStorage;
export {};
