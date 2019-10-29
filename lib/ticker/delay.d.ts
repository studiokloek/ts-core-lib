import { TweenMax } from 'gsap';
declare function addDelay(_callback: (...args: any[]) => void, _delay: number, _params?: any[]): TweenMax | undefined;
declare function killDelay(_callback: (...args: any[]) => void): void;
declare function pauseDelay(_callback: (...args: any[]) => void): void;
declare function resumeDelay(_callback: (...args: any[]) => void): void;
declare function killAllDelays(): void;
declare function callAsync(_callback: (...args: any[]) => void): void;
declare function waitFor(_delay?: number): Promise<void>;
export declare const Delayed: {
    call: typeof addDelay;
    kill: typeof killDelay;
    killAll: typeof killAllDelays;
    pause: typeof pauseDelay;
    resume: typeof resumeDelay;
    async: typeof callAsync;
    wait: typeof waitFor;
};
export declare class DelayedMixin {
    private __delayed;
    protected addDelay(_callback: (...args: any[]) => void, _delay: number, _params?: any[]): void;
    protected killDelay(_callback: (...args: any[]) => void): void;
    protected pauseDelay(_callback: (...args: any[]) => void): void;
    protected remumeDelay(_callback: (...args: any[]) => void): void;
    protected killDelays(): void;
    protected pauseDelays(): void;
    protected resumeDelays(): void;
}
export {};
